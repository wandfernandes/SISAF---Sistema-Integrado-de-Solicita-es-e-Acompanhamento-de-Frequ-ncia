import { Pool } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';
declare const pool: Pool;
export declare const db: import("drizzle-orm/neon-serverless").NeonDatabase<typeof schema> & {
    $client: Pool;
};
export declare const checkDatabaseConnection: () => Promise<boolean>;
export { pool };
//# sourceMappingURL=db.d.ts.map