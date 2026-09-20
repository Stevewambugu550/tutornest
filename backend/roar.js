const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    ssl: process.env.PGSSLMODE === 'require' || process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
});
const secret = process.env.ROAR_JWT_SECRET || process.env.JWT_SECRET;
const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const statuses = new Set(['new', 'reviewing', 'contacted', 'proposal_sent', 'won', 'lost']);

function rateLimit(windowMs, max) {
    const attempts = new Map();
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const entry = attempts.get(key);
        if (!entry || entry.resetAt <= now) {
            attempts.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        entry.count += 1;
        if (entry.count > max) return res.status(429).json({ message: 'Too many requests. Please try again later.' });
        next();
    };
}

const registerLimit = rateLimit(60 * 60 * 1000, 10);
const loginLimit = rateLimit(15 * 60 * 1000, 20);
const leadLimit = rateLimit(60 * 60 * 1000, 10);

async function sendVerificationEmail(email, firstName, verificationUrl) {
    if (process.env.NODE_ENV !== 'production') return;
    const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
    if (required.some(key => !process.env[key])) throw new Error('Verification email service is not configured');
    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify your Roar East Africa account',
        text: `Hello ${firstName}, verify your account: ${verificationUrl}`,
        html: `<p>Please verify your Roar East Africa account:</p><p><a href="${verificationUrl}">Verify my email</a></p><p>This link expires in 24 hours.</p>`,
    });
}

async function init() {
    await pool.query(`
        create table if not exists public.roar_customers (
            id uuid primary key default gen_random_uuid(),
            email text not null unique,
            password_hash text not null,
            first_name text not null,
            last_name text not null,
            role text not null default 'customer' check (role in ('customer','admin')),
            email_verified boolean not null default false,
            verification_token_hash text,
            verification_expires_at timestamptz,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
        create table if not exists public.roar_leads (
            id uuid primary key default gen_random_uuid(),
            client_name text not null check (char_length(client_name) between 1 and 150),
            client_email text not null check (char_length(client_email) between 3 and 254),
            target_dates text check (char_length(target_dates) <= 200),
            total_guests integer not null default 1 check (total_guests between 1 and 30),
            tier_preference text check (char_length(tier_preference) <= 150),
            primary_objective text check (char_length(primary_objective) <= 200),
            notes text check (char_length(notes) <= 3000),
            terms_accepted boolean not null default false,
            marketing_consent boolean not null default false,
            status text not null default 'new' check (status in ('new','reviewing','contacted','proposal_sent','won','lost')),
            estimated_value numeric(12,2),
            source text not null default 'website',
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
        );
        alter table public.roar_leads add column if not exists customer_id uuid references public.roar_customers(id) on delete set null;
        alter table public.roar_leads add column if not exists launch_offer_claimed boolean not null default false;
        alter table public.roar_leads add column if not exists launch_offer_percent integer;
        create table if not exists public.roar_launch_claims (
            id bigserial primary key,
            lead_id uuid not null unique references public.roar_leads(id) on delete cascade,
            customer_id uuid not null references public.roar_customers(id) on delete cascade,
            discount_percent integer not null default 10 check (discount_percent = 10),
            claimed_at timestamptz not null default now()
        );
        create index if not exists roar_leads_customer_idx on public.roar_leads(customer_id);
    `);
}

function signCustomer(customer) {
    return jwt.sign({ id: customer.id, role: customer.role, app: 'roar' }, secret, { expiresIn: '7d' });
}

function requireCustomer(req, res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Customer login required.' });
    try {
        const decoded = jwt.verify(token, secret);
        if (decoded.app !== 'roar') throw new Error('Wrong application token');
        req.roarUser = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Session invalid or expired.' });
    }
}

function requireRoarAdmin(req, res, next) {
    requireCustomer(req, res, async () => {
        try {
            const { rows } = await pool.query('select role,email_verified from public.roar_customers where id=$1', [req.roarUser.id]);
            if (rows[0]?.role !== 'admin' || !rows[0]?.email_verified) {
                return res.status(403).json({ message: 'Roar administrator access required.' });
            }
            next();
        } catch {
            res.status(500).json({ message: 'Unable to verify administrator access.' });
        }
    });
}

router.post('/auth/register', registerLimit, async (req, res) => {
    try {
        const email = clean(req.body.email, 254).toLowerCase();
        const password = String(req.body.password || '');
        const firstName = clean(req.body.firstName, 80);
        const lastName = clean(req.body.lastName, 80);
        if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || !firstName || !lastName) {
            return res.status(400).json({ message: 'Name, valid email, and a password of at least 10 characters are required.' });
        }
        const development = process.env.NODE_ENV !== 'production';
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = development ? null : crypto.createHash('sha256').update(rawToken).digest('hex');
        const passwordHash = await bcrypt.hash(password, 12);
        const { rows } = await pool.query(`
            insert into public.roar_customers
                (email, password_hash, first_name, last_name, email_verified, verification_token_hash, verification_expires_at)
            values ($1,$2,$3,$4,$5,$6,case when $5 then null else now() + interval '24 hours' end)
            returning id, email, first_name, last_name, role, email_verified
        `, [email, passwordHash, firstName, lastName, development, tokenHash]);
        const base = process.env.ROAR_CLIENT_URL || 'http://127.0.0.1:4173';
        const verificationUrl = development ? null : `${base}/account.html?verify=${rawToken}`;
        try {
            await sendVerificationEmail(email, firstName, verificationUrl);
        } catch (error) {
            await pool.query('delete from public.roar_customers where id=$1', [rows[0].id]);
            throw error;
        }
        const customer = rows[0];
        res.status(201).json({
            message: development ? 'Account created and signed in.' : 'Account created. Verify your email before signing in.',
            verificationUrl: development ? undefined : verificationUrl,
            token: development ? signCustomer(customer) : undefined,
            user: {
                id: customer.id,
                email: customer.email,
                firstName: customer.first_name,
                lastName: customer.last_name,
                role: customer.role,
            },
        });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ message: 'An account with that email already exists.' });
        console.error('Roar registration error:', error.message);
        res.status(500).json({ message: 'Unable to create account.' });
    }
});

router.post('/auth/verify', async (req, res) => {
    const rawToken = clean(req.body.token, 128);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const { rows } = await pool.query(`
        update public.roar_customers set email_verified=true, verification_token_hash=null,
            verification_expires_at=null, updated_at=now()
        where verification_token_hash=$1 and verification_expires_at > now()
        returning id
    `, [tokenHash]);
    if (!rows.length) return res.status(400).json({ message: 'Verification link is invalid or expired.' });
    res.json({ message: 'Email verified. You can now sign in.' });
});

router.post('/auth/login', loginLimit, async (req, res) => {
    const email = clean(req.body.email, 254).toLowerCase();
    const { rows } = await pool.query('select * from public.roar_customers where email=$1 limit 1', [email]);
    const customer = rows[0];
    if (!customer || !await bcrypt.compare(String(req.body.password || ''), customer.password_hash)) {
        return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!customer.email_verified) return res.status(403).json({ message: 'Verify your email before signing in.' });
    res.json({ token: signCustomer(customer), user: { id: customer.id, email: customer.email, firstName: customer.first_name, lastName: customer.last_name, role: customer.role } });
});

router.get('/auth/me', requireCustomer, async (req, res) => {
    const { rows } = await pool.query('select id,email,first_name,last_name,role,email_verified from public.roar_customers where id=$1', [req.roarUser.id]);
    if (!rows.length) return res.status(404).json({ message: 'Account not found.' });
    const u = rows[0];
    res.json({ id:u.id, email:u.email, firstName:u.first_name, lastName:u.last_name, role:u.role, emailVerified:u.email_verified });
});

router.post('/leads', leadLimit, requireCustomer, async (req, res) => {
    const clientName = clean(req.body.clientName, 150);
    const totalGuests = Number(req.body.totalGuests);
    if (!clientName || !Number.isInteger(totalGuests) || totalGuests < 1 || totalGuests > 30 || req.body.termsAccepted !== true) {
        return res.status(400).json({ message: 'Complete the required inquiry fields.' });
    }
    const customerResult = await pool.query('select email,email_verified from public.roar_customers where id=$1', [req.roarUser.id]);
    if (!customerResult.rows[0]?.email_verified) return res.status(403).json({ message: 'Verify your email before submitting an inquiry.' });
    const clientEmail = customerResult.rows[0].email;
    const { rows } = await pool.query(`
        insert into public.roar_leads
            (customer_id,client_name,client_email,target_dates,total_guests,tier_preference,primary_objective,notes,terms_accepted,marketing_consent,estimated_value,source)
        values ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,'website') returning *
    `, [req.roarUser.id, clientName, clientEmail, clean(req.body.targetDates,200)||null, totalGuests,
        clean(req.body.tierPreference,150)||null, clean(req.body.primaryObjective,200)||null,
        clean(req.body.notes,3000)||null, req.body.marketingConsent===true,
        Number.isFinite(Number(req.body.estimatedValue)) ? Number(req.body.estimatedValue) : null]);
    res.status(201).json({ success:true, lead:rows[0] });
});

router.get('/admin/leads', requireRoarAdmin, async (req, res) => {
    const { rows } = await pool.query('select * from public.roar_leads order by created_at desc limit 500');
    res.json({ leads:rows });
});

router.patch('/admin/leads/:id', requireRoarAdmin, async (req, res) => {
    const status = clean(req.body.status, 30);
    if (!statuses.has(status)) return res.status(400).json({ message: 'Invalid lead status.' });
    const client = await pool.connect();
    try {
        await client.query('begin');
        const { rows } = await client.query('update public.roar_leads set status=$1,updated_at=now() where id=$2 returning *', [status, req.params.id]);
        if (!rows.length) { await client.query('rollback'); return res.status(404).json({ message:'Lead not found.' }); }
        let lead = rows[0];
        if (status === 'won' && lead.customer_id && !lead.launch_offer_claimed) {
            await client.query("select pg_advisory_xact_lock(hashtext('roar-first-five-offer'))");
            const count = Number((await client.query('select count(*)::int n from public.roar_launch_claims')).rows[0].n);
            if (count < 5) {
                await client.query('insert into public.roar_launch_claims (lead_id,customer_id) values ($1,$2) on conflict do nothing', [lead.id, lead.customer_id]);
                lead = (await client.query('update public.roar_leads set launch_offer_claimed=true,launch_offer_percent=10 where id=$1 returning *', [lead.id])).rows[0];
            }
        }
        await client.query('commit');
        res.json({ lead });
    } catch (error) {
        await client.query('rollback');
        console.error('Roar lead update error:', error.message);
        res.status(500).json({ message:'Unable to update lead.' });
    } finally { client.release(); }
});

router.get('/promotion', async (_req, res) => {
    const claimed = Number((await pool.query('select count(*)::int n from public.roar_launch_claims')).rows[0].n);
    res.json({ total:5, claimed, remaining:Math.max(0,5-claimed), discountPercent:10 });
});

module.exports = { router, init };
