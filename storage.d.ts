import session from "express-session";
import { type User, type NewUser, type MedicalLeave, type NewMedicalLeave, type Notification, type NewNotification } from "../shared/schema.js";
interface IStorage {
    sessionStore: session.Store;
    getUser(id: number): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    createUser(userData: NewUser): Promise<User>;
    updateUser(id: number, updates: Partial<User>): Promise<User | null>;
    listUsers(filter?: {
        role?: string;
    }): Promise<User[]>;
    getAllUsers(): Promise<User[]>;
    createMedicalLeave(leaveData: NewMedicalLeave): Promise<MedicalLeave>;
    getAllRequests(filter?: {
        status?: string;
    }): Promise<MedicalLeave[]>;
    updateMedicalLeave(id: number, updates: Partial<MedicalLeave>): Promise<MedicalLeave>;
    createNotification(notification: NewNotification): Promise<Notification>;
}
export declare class DatabaseStorage implements IStorage {
    sessionStore: session.Store;
    constructor();
    getUser(id: number): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    createUser(userData: NewUser): Promise<User>;
    updateUser(id: number, updates: Partial<User>): Promise<User | null>;
    listUsers(filter?: {
        role?: string;
    }): Promise<User[]>;
    getAllUsers(): Promise<User[]>;
    createMedicalLeave(leaveData: NewMedicalLeave): Promise<MedicalLeave>;
    getAllRequests(filter?: {
        status?: string;
    }): Promise<MedicalLeave[]>;
    updateMedicalLeave(id: number, updates: Partial<MedicalLeave>): Promise<MedicalLeave>;
    createNotification(notification: NewNotification): Promise<Notification>;
}
export declare const storage: DatabaseStorage;
export {};
//# sourceMappingURL=storage.d.ts.map