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
 * Gets the local and remote commit hashes
 * @returns The hashes or if there was an error
 */
function getCommits(): [string, string] | false {
    const localHash = run("git rev-parse HEAD");
    const remoteHash = run("git rev-parse @{u}");

    // Check if the remote branch exists
    if (!remoteHash) {
        console.error("[ERROR] Could not find upstream branch. Is it set?");
        return false;
    }

    return [localHash, remoteHash];
}

/**
 * Checks if the local branch is ahead or behind the remote branch
 */
function isAheadOrBehind(): void {
    const status = run("git rev-list --left-right --count HEAD").split("\t");
    const [isAhead, isBehind] = status;

    if (Number(isBehind) > 0) {
        console.warn(`[WARNING] Your local branch is behind by ${isBehind} commits.`);
    } else if (Number(isAhead) > 0) {
        console.warn(`[WARNING] Your local branch is ahead by ${isAhead} commits.`);
    }
}

/**
 * Used to check if an update is available
 * @returns Weather an update is available or not
 */
export function checkIfUpdateAvailable(): boolean {
    // Check if we are in a git repo
    if (!isGitRepository()) {
        console.error("[ERROR] Not a git repository. Cannot check for updates.");
        return false;
    }

    // Get the metadata of the repo
    const _metadata = run("git fetch");

    // Identify local and remote commits
    const commits = getCommits();
    if (commits == false) return false;

    const [localHash, remoteHash] = commits;

    if (localHash === remoteHash) {
        console.log("[NOTICE] No updates available.");
        return true;
    }
    
    // Check if we're ahead or behind
    isAheadOrBehind();

    console.log("Updates are available.");
    return false;
}