/**
 * Small D1 helpers around prepared statements.
 */

function assertDb(db) {
  if (!db) {
    throw new Error('Missing D1 binding: DB');
  }
}

export function getDb(env) {
  assertDb(env?.DB);
  return env.DB;
}

export async function run(env, sql, params = []) {
  const db = getDb(env);
  return db.prepare(sql).bind(...params).run();
}

export async function first(env, sql, params = []) {
  const db = getDb(env);
  return db.prepare(sql).bind(...params).first();
}

export async function all(env, sql, params = []) {
  const db = getDb(env);
  return db.prepare(sql).bind(...params).all();
}
