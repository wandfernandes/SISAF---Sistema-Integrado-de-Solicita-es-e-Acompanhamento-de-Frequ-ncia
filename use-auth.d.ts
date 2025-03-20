import { ReactNode } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "../../shared/schema";
type AuthContextType = {
    user: SelectUser | null;
    isLoading: boolean;
    error: Error | null;
    loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
    logoutMutation: UseMutationResult<void, Error, void>;
    registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};
type LoginData = {
    username: string;
    password: string;
};
export declare const AuthContext: import("react").Context<AuthContextType | null>;
export declare function AuthProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
//# sourceMappingURL=use-auth.d.ts.map