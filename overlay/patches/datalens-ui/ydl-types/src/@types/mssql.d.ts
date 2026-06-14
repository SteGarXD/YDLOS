declare module 'mssql' {
    export namespace sql {
        export class ConnectionPool {
            constructor(config: string);
            connect(): Promise<void>;
            request(): Request;
        }
        export class Request {
            input(name: string, type: unknown, value: unknown): Request;
            query(command: string): Promise<{recordset: unknown[]}>;
        }
        export function NVarChar(length: number): unknown;
        export function Int(): unknown;
    }
    const sql: typeof import('mssql').sql;
    export default sql;
}
