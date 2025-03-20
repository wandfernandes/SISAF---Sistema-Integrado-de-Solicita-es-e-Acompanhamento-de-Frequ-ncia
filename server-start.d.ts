declare class SISAFServer {
    private app;
    private port;
    private server;
    private isDatabaseConnected;
    constructor();
    private setupMiddleware;
    start(): Promise<void>;
    stop(): Promise<void>;
}
declare const server: SISAFServer;
export default server;
//# sourceMappingURL=server-start.d.ts.map