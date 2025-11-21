import { execSync } from "child_process";

/**
 * Used to run a command in the shell
 * @param cmd - The command to run
 * @returns The command result if successful or an empty string if error
 */
function run(cmd: string): string {
    try {
        return execSync(cmd, { encoding: "utf-8" }).trim();
    } catch (_) {
        return "";
    }
}

/**
 * Checks if we are in a git repository
 * @returns Weather we are in a git repo or not
 */
function isGitRepository(): boolean {
    const result = run("git rev-parse --is-inside-work-tree");
    return result === "true";
}

/**
 * Checks if the local branch is ahead or behind the remote branch
 * @param main - Whether to check against the main branch or not
 * @returns Returns true if behind, false if ahead or equal
 */
function isAheadOrBehind(main: boolean=false): boolean {
    const targetRef = main ? "origin/main" : "@{u}";
    const aheadCmd = `git rev-list --left-only --count HEAD...${targetRef}`;
    const behindCmd = `git rev-list --right-only --count HEAD...${targetRef}`;

    const name = run(`git rev-parse --abbrev-ref ${targetRef}`);
    console.log(`\x1b[34m[INFO] Comparing local branch to ${name}...\x1b[0m`);

    const isAhead = Number(run(aheadCmd)) || 0;
    const isBehind = Number(run(behindCmd)) || 0;
    const refLabel = main ? "remote main (origin/main)" : "upstream";

    if (isBehind > 0 && isAhead > 0) {
        console.warn(`\x1b[33m[SEVERE WARNING] Your local and ${refLabel} have diverged. ${isAhead} ahead, ${isBehind} behind.\x1b[0m`);
        if (main) console.warn("\x1b[33m[FIX] Run `git pull origin main` then re-run.\x1b[0m");
        else console.warn("\x1b[33m[FIX] Run `git pull` then re-run.\x1b[0m");
        return false;
    } else if (isBehind > 0) {
        console.warn(`\x1b[33m[WARNING] Your local branch is behind ${refLabel} by ${isBehind} commits.\x1b[0m`);
        if (main) console.warn("\x1b[33m[FIX] Run `git pull origin main` then re-run.\x1b[0m");
        else console.warn("\x1b[33m[FIX] Run `git pull` then re-run.\x1b[0m");
        return true;
    } else if (isAhead > 0) {
        console.warn(`\x1b[33m[WARNING] Your local branch is ahead of ${refLabel} by ${isAhead} commits.\x1b[0m`);
        return false;
    } else {
        console.log("\x1b[32m[NOTICE] No updates available.\x1b[0m");
        return false;
    }
}

/**
 * Used to check if an update is available
 * @returns Weather an update is available or not
 */
export function checkIfUpdateAvailable(): boolean {    
    // Check if we are in a git repo
    if (!isGitRepository()) {
        console.error("\x1b[31m[ERROR] Not a git repository. Cannot check for updates.\x1b[0m");
        return false;
    }

    // Get the updated metadata of the repo
    run("git fetch");

    // Check if we're ahead or behind
    if (isAheadOrBehind()) return false;
    if (isAheadOrBehind(true)) return false;

    // No updates available
    return true;
}