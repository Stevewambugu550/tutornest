// ============================================================
//  TutorNest storage layer — Supabase PostgreSQL (tutornest_all)
//  Falls back to local JSON files if the database is unavailable.
//  Exposes synchronous read()/write() backed by an in-memory
//  cache with async write-through persistence.
// ============================================================

const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

const SCHEMA = (process.env.DATABASE_SCHEMA || 'tutornest_all').replace(/[^a-z0-9_]/gi, '');

const COLLECTIONS = {
    users: {
        table: 'app_users',
        columns: ['email', 'role'],
        values: i => [i.email || null, i.role || null],
    },
    tutors: {
        table: 'tutors',
        columns: ['name', 'email'],
        values: i => [i.name || null, i.email || null],
        wrap: items => ({ tutors: items }),
        unwrap: val => (Array.isArray(val) ? val : val.tutors || []),
    },
    bookings: {
        table: 'bookings',
        columns: ['student_id', 'tutor_id', 'status'],
        values: i => [i.studentId || null, i.tutorId || null, i.status || null],
    },
    messages: {
        table: 'messages',
        columns: ['sender_id', 'receiver_id'],
        values: i => [i.senderId || null, i.receiverId || null],
    },
};

let FILES = {};
let pool = null;
let dbReady = false;
const cache = {};
const writeQueue = new Map();

function fileFor(key) {
    return FILES[key];
}

function fileRead(key, fallback) {
    try {
        return JSON.parse(fs.readFileSync(fileFor(key), 'utf8'));
    } catch {
        return fallback;
    }
}

function fileWrite(key, data) {
    const file = fileFor(key);
    if (file) fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function itemsOf(key, val) {
    const cfg = COLLECTIONS[key];
    return cfg && cfg.unwrap ? cfg.unwrap(val) : (Array.isArray(val) ? val : []);
}

async function persist(key) {
    const cfg = COLLECTIONS[key];
    if (!cfg || !dbReady) return;
    const items = itemsOf(key, cache[key]);
    const cols = ['id', ...cfg.columns, 'data'];
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL search_path TO "${SCHEMA}"`);
        const ids = items.map(i => String(i.id));
        await client.query(
            `DELETE FROM "${SCHEMA}".${cfg.table} WHERE NOT (id = ANY($1::text[]))`,
            [ids]
        );
        for (const item of items) {
            const params = [String(item.id), ...cfg.values(item), JSON.stringify(item)];
            const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
            const updates = cols.slice(1).map(c => `${c} = EXCLUDED.${c}`).join(', ');
            await client.query(
                `INSERT INTO "${SCHEMA}".${cfg.table} (${cols.join(', ')})
                 VALUES (${placeholders})
                 ON CONFLICT (id) DO UPDATE SET ${updates}`,
                params
            );
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`[db] persist ${key} failed:`, err.message);
    } finally {
        client.release();
    }
}

function enqueuePersist(key) {
    if (!dbReady || writeQueue.has(key)) return;
    writeQueue.set(key, persist(key).finally(() => {
        writeQueue.delete(key);
        if (writeQueue.size === 0) return;
    }));
}

async function createTables(client) {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${SCHEMA}"`);
    const defs = {
        app_users: `(
            id    text PRIMARY KEY,
            email text,
            role  text,
            data  jsonb NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )`,
        tutors: `(
            id    text PRIMARY KEY,
            name  text,
            email text,
            data  jsonb NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )`,
        bookings: `(
            id         text PRIMARY KEY,
            student_id text,
            tutor_id   text,
            status     text,
            data       jsonb NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )`,
        messages: `(
            id          text PRIMARY KEY,
            sender_id   text,
            receiver_id text,
            data        jsonb NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now()
        )`,
    };
    for (const [table, def] of Object.entries(defs)) {
        await client.query(`CREATE TABLE IF NOT EXISTS "${SCHEMA}".${table} ${def}`);
    }
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_student ON "${SCHEMA}".bookings (student_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bookings_tutor   ON "${SCHEMA}".bookings (tutor_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_pair    ON "${SCHEMA}".messages (sender_id, receiver_id)`);
}

async function seedIfEmpty(client, key) {
    const cfg = COLLECTIONS[key];
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${SCHEMA}".${cfg.table}`);
    if (rows[0].n > 0) return;
    const raw = fileRead(key, cfg.wrap ? cfg.wrap([]) : []);
    const items = itemsOf(key, raw);
    if (!items.length) return;
    for (const item of items) {
        const params = [String(item.id), ...cfg.values(item), JSON.stringify(item)];
        const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
        await client.query(
            `INSERT INTO "${SCHEMA}".${cfg.table} (id, ${cfg.columns.join(', ')}, data)
             VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
            params
        );
    }
    console.log(`[db] migrated ${items.length} ${key} record(s) from JSON`);
}

async function loadCache(client) {
    for (const [key, cfg] of Object.entries(COLLECTIONS)) {
        const { rows } = await client.query(`SELECT data FROM "${SCHEMA}".${cfg.table} ORDER BY created_at`);
        const items = rows.map(r => r.data);
        cache[key] = cfg.wrap ? cfg.wrap(items) : items;
    }
}

async function init(files) {
    FILES = files;
    const hasPgConfig = process.env.PGHOST || process.env.DATABASE_URL;
    if (!hasPgConfig) {
        console.log('[db] no PostgreSQL config found — using JSON file storage');
        return;
    }
    pool = new Pool({
        connectionString: process.env.DATABASE_URL || undefined,
        ssl: process.env.PGSSLMODE === 'require' || process.env.DATABASE_URL
            ? { rejectUnauthorized: false }
            : false,
        connectionTimeoutMillis: 10000,
    });
    try {
        const client = await pool.connect();
        try {
            await createTables(client);
            for (const key of Object.keys(COLLECTIONS)) {
                await seedIfEmpty(client, key);
            }
            await loadCache(client);
        } finally {
            client.release();
        }
        dbReady = true;
        console.log(`[db] connected to PostgreSQL, schema "${SCHEMA}" ready`);
    } catch (err) {
        console.error('[db] PostgreSQL unavailable, falling back to JSON files:', err.message);
        dbReady = false;
    }
}

function read(key, fallback = []) {
    if (dbReady && key in cache) return cache[key];
    return fileRead(key, fallback);
}

function write(key, data) {
    if (dbReady && COLLECTIONS[key]) {
        cache[key] = data;
        enqueuePersist(key);
    }
    try { fileWrite(key, data); } catch (err) {
        console.error(`[db] JSON backup write for ${key} failed:`, err.message);
    }
}

module.exports = { init, read, write, isReady: () => dbReady };
