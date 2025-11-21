/**
 * Checks if the UUID is valid
 * @param id - The  UUID
 * @returns The UUID if valid, undefined otherwise
 */
export function checkUUID(id: unknown): string | void {
    if (typeof id !== "string") return;

    // Trim the string
    const newId = id.trim();

    // Check if the ID has content
    if (newId == "") return;
    
    // Check if the ID is a valid UUID
    if (!RegExp(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/).test(newId)) return;
    
    // Return the ID
    return newId;
}