import { QueryClient } from "@tanstack/react-query";
async function throwIfResNotOk(res) {
    if (!res.ok) {
        try {
            const errorData = await res.json();
            throw new Error(errorData.message || `${res.status}: ${res.statusText}`);
        }
        catch (e) {
            throw new Error(`${res.status}: ${res.statusText}`);
        }
    }
}
export async function apiRequest(method, url, data) {
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
    });
    await throwIfResNotOk(res);
    return res;
}
export const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
    const res = await fetch(queryKey[0], {
        credentials: "include",
        headers: {
            "Accept": "application/json"
        }
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
};
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false,
        },
        mutations: {
            retry: false,
        },
    },
});
//# sourceMappingURL=queryClient.js.map