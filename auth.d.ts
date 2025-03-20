import { Express } from "express";
export type AuthUser = {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: "user" | "hr" | "admin";
    active: boolean;
};
declare global {
    namespace Express {
        interface User extends AuthUser {
        }
    }
}
export declare function hashPassword(password: string): Promise<string>;
export declare function setupAuth(app: Express): void;
//# sourceMappingURL=auth.d.ts.map