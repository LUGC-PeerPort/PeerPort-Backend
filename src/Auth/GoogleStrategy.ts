import passport from "passport";
// @ts-expect-error Needed as there are no types available for this package
import GoogleStrategy from "passport-google-oidc";
import type express from "express";
import {Role} from "../Database/entities/Role.js";
import {User} from "../Database/entities/User.js";
import type {DataSource} from "typeorm";
import session from "express-session";

export const GoogleStrategySetup = (app: express.Express, AppDataSource:DataSource) => {

    // session must be registered before passport.session()
    app.use(session({
        secret: process.env.SESSION_SECRET || "dev-secret",
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

        if(process.env.IS_PRODUCTION === "false") {
            // In non-production environments, skip auth for easier testing
            return cb();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (req.session as any).passport.user;

        if(!userId) {
            res.redirect("/login");
            console.log("WTF");
            return;
        }

        const user = await AppDataSource.getRepository(User).findOne({ where : {userId: userId}, relations: ["role"]});
        if(user == null){
            res.redirect("/login");
            console.log("TWF");
            return;
        }

        let userRole = user?.role;
        if(!userRole){
            const roleUser = await AppDataSource.getRepository(Role).findOneBy({name: "user"});
            if(roleUser){
                userRole = roleUser;
                user.role = roleUser;
                await AppDataSource.getRepository(User).save(user);
            } else {
                console.error("User not found");
                res.json({error: "User Role not found"}).status(500);
            }
        }
        if(authorizedRoles.includes(userRole?.name)){
            return cb();
        } else {
            res.status(403).json({message: "Forbidden: You don't have permission to access this resource."});
            return;
        }
    };
};