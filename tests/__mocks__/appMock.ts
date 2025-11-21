
// Minimal uploader mock used only for tests; returns middleware that immediately calls next
const uploader = {
    array: (fieldName: string) => {
        return (req: any, res: any, cb: (err?: any) => void) => {
            // simulate no files uploaded
            // attach empty files array
            req.files = [];
            cb();
        };
    },
    any: () => {
        return (req: any, res: any, cb: (err?: any) => void) => { req.files = []; cb(); };
    }
};

export { uploader };
