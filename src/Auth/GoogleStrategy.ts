import passport from "passport";
// @ts-expect-error Needed as there are no types available for this package
import GoogleStrategy from "passport-google-oidc";
import type express from "express";
import type { Request } from "express";
import {Role} from "../Database/entities/Role.js";
import {User} from "../Database/entities/User.js";
import type {DataSource} from "typeorm";
import session from "express-session";
import type { Session } from "express-session";

// eslint-disable-next-line max-lines-per-function 
export const GoogleStrategySetup = (app: express.Express, AppDataSource:DataSource) => {
    // Required environment variables
    const REQUIRED_VARS = [
        ["AUTH_SECRET", process.env.AUTH_SECRET],
        ["AUTH_GOOGLE_ID", process.env.AUTH_GOOGLE_ID],
        ["AUTH_GOOGLE_SECRET", process.env.AUTH_GOOGLE_SECRET],
        ["AUTH_GOOGLE_CALLBACK", process.env.AUTH_GOOGLE_CALLBACK]
    ];
    let fail = false;
    for (const [varName, varValue] of REQUIRED_VARS) {
        if (varValue === undefined) {
            console.error(`\x1b[31m[ERROR] Environment variable ${varName} is not set.\x1b[0m`);
            fail = true;
        }
    }
    if (fail) process.exit(1);

    // Optional environment variables
    const OPTIONAL_VARS = [
        ["SESSION_SECRET", process.env.SESSION_SECRET, "dev-secret"],
        ["SERVER_URL", process.env.SERVER_URL, "http://localhost:3000"],
        ["CLIENT_URL", process.env.CLIENT_URL, "http://localhost:4200"]
    ];
    for (const [varName, varValue, defaultValue] of OPTIONAL_VARS) {
        if (varValue === undefined) {
            process.env[varName!] = defaultValue;
            console.warn(`\x1b[33m[WARNING] ${varName} is not defined. Using default: '${defaultValue}'\x1b[0m`);
        }
    }

    // session must be registered before passport.session()
    app.use(session({
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // true in prod (requires HTTPS)
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" // adjust for OAuth flow
        }
        // In production: provide a store (connect-pg-simple / connect-redis) instead of default MemoryStore
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(new GoogleStrategy({
        clientID: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        callbackURL: process.env.AUTH_GOOGLE_CALLBACK!
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (issuer: any, profile: any, cb: any) => {
        const credentialsRepository = AppDataSource.getRepository("FederatedCredentials");
        const userRepository = AppDataSource.getRepository("User");

        credentialsRepository.findOneBy({provider: issuer, providerId: profile.id})
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then(async (federatedCredentials: any) => {
                if (federatedCredentials) {
                    return userRepository.findOneBy({userId: federatedCredentials.userId});
                }
                const user = new User();
                user.email = profile.emails[0].value;
                user.name = profile.displayName;
                user.role = await AppDataSource.getRepository(Role).findOneBy({name: "user"}).then((r) => {return r!;});
                user.idNumber = "ID_NUMBER_NOT_ASSIGNED";

                const newUser = await userRepository.save(user);
                const newFederatedCredentials = credentialsRepository.create({
                    provider: issuer,
                    providerId: profile.id,
                    userId: newUser.userId
                });
                await credentialsRepository.save(newFederatedCredentials);
                return newUser;
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((user: any) => cb(null, user))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((err: any) => cb(err));
    }
    ));


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passport.serializeUser((user: any, done) => {
        done(null, user.userId);
    });


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passport.deserializeUser((id: any, done) => {
        const UserRepository = AppDataSource.getRepository("User");
        UserRepository.findOneBy({userId: id})
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then((user: any) => done(null, user))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .catch((err: any) => done(err));
    });


    app.get("/auth/callback/google",
        passport.authenticate("google", { failureRedirect: "/login" }),
        (req, res) => {
            // Successful authentication, redirect home.
            res.redirect(process.env.CLIENT_URL + "/home");
        });


    return async (authorizedRoles: string[], req: express.Request, res: express.Response, cb:() => void) => {
        const session = (req as Request & { session?: Session & { passport?: { user: string } } }).session;

        // Check if we're in development mode
        if(process.env.IS_PRODUCTION === "false") {
            // If we are developing and no user has been assigned set to a default admin user
            if (!session?.passport?.user) {
                console.log("\x1b[33m[WARNING] No user in session, assigning default admin user for development.\x1b[0m");
                // Get the default user or create it if it doesn't exist
                let defaultUser = await AppDataSource.getRepository(User).findOneBy({email: "default@example.com"});
                if (defaultUser) {
                    session.passport = { user: defaultUser.userId };
                } else {
                    let adminRole = await AppDataSource.getRepository(Role).findOneBy({name: "admin"});
                    if (!adminRole) {
                        adminRole = await AppDataSource.getRepository(Role).save({name: "admin"});
                    }
                    defaultUser = await AppDataSource.getRepository(User).save({
                        name: "Default User",
                        email: "default@example.com",
                        idNumber: "000000",
                        role: adminRole
                    });
                }

                // Set the session user to the default user
                session.passport = { user: defaultUser.userId };
            }

            // Go to the endpoint logic
            return cb();
        }

        /**
         * Redirect the user to the Google login page
         */
        function login(): void {
            const redirectLink = (process.env.SERVER_URL ?? "http://localhost:3000") + "/login/google";

            // Check if the referer is the swagger UI
            if(req.headers.referer && req.headers.referer.includes("api-docs")){
                res.status(401).json({
                    message: "Unauthorized: log in. (This message is only visible on the Swagger UI in other cases you would be redirected)", 
                    loginUrl: redirectLink
                });
                return;
            }

            // Typical redirect to login
            res.redirect(redirectLink);
        }

        // Get the user ID from the session
        if (!session || session.passport === undefined || session.passport.user === undefined) {
            login();
            return;
        }
        const userId = session.passport.user;

        // Check if the user exists
        const user = await AppDataSource.getRepository(User).findOneBy({userId: userId});
        if(user == null){
            login();
            return;
        }

        // Get the user's role
        let userRole = user?.role;

        // If the user has no role, assign the 'user' role
        if(!userRole){
            const roleUser = await AppDataSource.getRepository(Role).findOneBy({name: "user"});
            if(roleUser){
                userRole = roleUser;
                user.role = roleUser;
                await AppDataSource.getRepository(User).save(user);
            
            // Could not find 'user' role, create it
            } else {
                console.error("\x1b[31m[ERROR] Default 'user' role not found in database.\x1b[0m");
                userRole = await AppDataSource.getRepository(Role).save({name: "user"});
                user.role = userRole;

                // Assign role and save
                await AppDataSource.getRepository(User).save(user);
                console.log("\x1b[32m[WARNING] Created default 'user' role in database.\x1b[0m");
            }
        }

        // Check if the user is allowed to access the resource
        if(authorizedRoles.includes(userRole.name)){
            return cb();
        } else {
            console.warn(`\x1b[33m[WARNING] User ${user.email} with role ${userRole.name} attempted to access a restricted resource.\x1b[0m`);
            res.status(403).json({message: "Forbidden: You don't have permission to access this resource."});
            return;
        }
    };
};