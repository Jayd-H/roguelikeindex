import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client, type ResultSet, type InStatement } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const logQueryStats = (type: string, sql: string, duration: number, result: unknown) => {
  const rs = result as ResultSet;
  const returned = rs.rows ? rs.rows.length : 0;
  const affected = rs.rowsAffected ?? 0;

  console.log(
    `\x1b[36m[db]\x1b[0m ${type.padEnd(4)} \x1b[90m(${duration.toFixed(0)}ms)\x1b[0m ` +
    `\x1b[32mRet:${returned}\x1b[0m \x1b[33mAzu:${affected}\x1b[0m ` +
    `- \x1b[37m${sql.substring(0, 60)}${sql.length > 60 ? '...' : ''}\x1b[0m`
  );
};

let dbClient = client;

if (process.env.NODE_ENV === 'development') {
  dbClient = new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (prop === 'execute') {
        return async (...args: [InStatement, ...unknown[]]) => {
          const start = performance.now();
          const result = await value.apply(target, args) as ResultSet;
          const end = performance.now();

          const sql = typeof args[0] === 'string' ? args[0] : args[0].sql;
          logQueryStats('EXEC', sql, end - start, result);

          return result;
        };
      }

      if (prop === 'batch') {
        return async (...args: [InStatement[], ...unknown[]]) => {
          const start = performance.now();
          const result = await value.apply(target, args) as ResultSet[];
          const end = performance.now();

          const count = Array.isArray(args[0]) ? args[0].length : 0;
          logQueryStats('BATCH', `${count} statements`, end - start, result);

          return result;
        };
      }

      if (prop === 'transaction') {
        return async (...args: unknown[]) => {
          const tx = await value.apply(target, args) as Client;

          return new Proxy(tx, {
            get(txTarget, txProp, txReceiver) {
              const txValue = Reflect.get(txTarget, txProp, txReceiver);

              if (txProp === 'execute') {
                return async (...txArgs: [InStatement, ...unknown[]]) => {
                  const start = performance.now();
                  const result = await txValue.apply(txTarget, txArgs) as ResultSet;
                  const end = performance.now();

                  const sql = typeof txArgs[0] === 'string' ? txArgs[0] : txArgs[0].sql;
                  logQueryStats('TX', sql, end - start, result);

                  return result;
                };
              }
              return txValue;
            }
          });
        };
      }

      return value;
    }
  });
}

export const db = drizzle(dbClient, { schema });