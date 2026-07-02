/* ══════════════════════════════════════════════════════════
   LXWYER UP — SERVER.JS
   Node.js/Express backend
   • MongoDB Atlas when MONGODB_URI is set (production/Vercel)
   • JSON file fallback for local development
══════════════════════════════════════════════════════════ */

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3005;

/* ─── Config ─────────────────────────────────────────────── */
const LOCAL_DATA_FILE = path.join('/tmp', 'signups.json');
const DEV_DATA_FILE   = path.join(__dirname, 'data', 'signups.json');
const DATA_FILE       = process.env.VERCEL ? LOCAL_DATA_FILE : DEV_DATA_FILE;
const MAX_SIGNUPS     = parseInt(process.env.MAX_SIGNUPS) || 500;
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD || 'lxwyer2025';
const ADMIN_TOKEN     = process.env.ADMIN_SECRET_KEY || 'lxwyerup_admin_2025_secret';

/* ─── MongoDB ────────────────────────────────────────────── */
let _mongoDb     = null;
let _mongoClient = null;

async function getDb() {
  if (!process.env.MONGODB_URI) return null;
  if (_mongoDb) return _mongoDb;
  try {
    const { MongoClient } = require('mongodb');
    _mongoClient = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await _mongoClient.connect();
    _mongoDb = _mongoClient.db('lxwyerup');
    console.log('✅ Connected to MongoDB Atlas');
    return _mongoDb;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    return null;
  }
}

/* ─── Data helpers (JSON file) ───────────────────────────── */
function _fileLoadData() {
  try {
    const file = fs.existsSync(DATA_FILE) ? DATA_FILE : DEV_DATA_FILE;
    if (!fs.existsSync(file)) return { signups: [] };
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { signups: [] };
  }
}

function _fileSaveData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('File save error:', e.message);
  }
}

/* ─── Unified async data API ─────────────────────────────── */
async function getAllSignups() {
  const db = await getDb();
  if (db) {
    return await db.collection('signups').find({}).sort({ signupDate: -1 }).toArray();
  }
  return _fileLoadData().signups;
}

async function findSignupByEmail(email) {
  const db = await getDb();
  if (db) {
    return await db.collection('signups').findOne({ email: email.toLowerCase() });
  }
  const data = _fileLoadData();
  return data.signups.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
}

async function countSignups() {
  const db = await getDb();
  if (db) {
    return await db.collection('signups').countDocuments();
  }
  return _fileLoadData().signups.length;
}

async function insertSignup(user) {
  const db = await getDb();
  if (db) {
    await db.collection('signups').insertOne(user);
    return;
  }
  const data = _fileLoadData();
  data.signups.push(user);
  _fileSaveData(data);
}

async function updateSignupById(id, fields) {
  const db = await getDb();
  if (db) {
    await db.collection('signups').updateOne({ id }, { $set: fields });
    return;
  }
  const data = _fileLoadData();
  const idx = data.signups.findIndex(s => s.id === id);
  if (idx !== -1) Object.assign(data.signups[idx], fields);
  _fileSaveData(data);
}

async function findSignupById(id) {
  const db = await getDb();
  if (db) {
    return await db.collection('signups').findOne({ id });
  }
  const data = _fileLoadData();
  return data.signups.find(s => s.id === id) || null;
}

async function findSignupByReferralCode(code) {
  const db = await getDb();
  if (db) {
    return await db.collection('signups').findOne({ referralCode: code });
  }
  const data = _fileLoadData();
  return data.signups.find(s => s.referralCode === code) || null;
}

async function countReferrals(referralCode) {
  if (!referralCode) return 0;
  const db = await getDb();
  if (db) {
    return await db.collection('signups').countDocuments({ referredBy: referralCode });
  }
  const data = _fileLoadData();
  return data.signups.filter(s => s.referredBy === referralCode).length;
}

async function getRecentSignups(limit = 5) {
  const db = await getDb();
  if (db) {
    return await db.collection('signups').find({}, { projection: { name: 1, city: 1, signupDate: 1 } }).sort({ signupDate: -1 }).limit(limit).toArray();
  }
  const data = _fileLoadData();
  return data.signups.slice(-limit).reverse().map(s => ({ name: s.name, city: s.city, signupDate: s.signupDate }));
}

function generateReferralCode(name) {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'ADV';
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}

/* ─── Middleware ─────────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* ─── Gmail transporter ──────────────────────────────────── */
let _transporter = null;

function getTransporter() {
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;
  if (!_transporter && process.env.GMAIL_USER && gmailPass) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: gmailPass,
      },
    });
  }
  return _transporter;
}

/* ─── Email: Confirmation ────────────────────────────────── */
function buildConfirmationEmail(name, memberNumber, email) {
  const firstName = name.split(' ')[0];
  return {
    from: `"Lxwyer Up" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `You're on the list, ${firstName} — Lxwyer Up Early Access`,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0f1e;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#1e40af,#3b82f6,#c9a227);"></td></tr>
        <tr>
          <td style="padding:40px 48px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);">
            <p style="font-size:22px;font-weight:800;color:#f8fafc;letter-spacing:-0.03em;margin:16px 0 4px;">Lxwyer <span style="color:#3b82f6;">Up</span></p>
            <p style="font-size:12px;color:#64748b;letter-spacing:0.15em;text-transform:uppercase;margin:0;">India's Legal Operating System</p>
          </td>
        </tr>
        <tr>
          <td style="padding:48px 48px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr><td align="center">
                <div style="display:inline-block;background:linear-gradient(135deg,rgba(30,64,175,0.2),rgba(59,130,246,0.1));border:1px solid rgba(201,162,39,0.35);border-radius:100px;padding:10px 28px;">
                  <span style="font-size:12px;color:#c9a227;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">✦ Founding Member #${memberNumber} ✦</span>
                </div>
              </td></tr>
            </table>
            <h1 style="font-size:28px;font-weight:800;color:#f8fafc;margin:0 0 16px;line-height:1.2;letter-spacing:-0.02em;">You're in, ${firstName}.</h1>
            <p style="font-size:16px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">We've received your early access application for <strong style="color:#f8fafc;">Lxwyer Up</strong> and we're reviewing it personally.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:16px;margin-bottom:32px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Application Status</p>
                <p style="margin:0;font-size:18px;font-weight:700;color:#f59e0b;">Under Review</p>
                <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">We're carefully reviewing applications to build the best community of Indian lawyers. You'll receive a personal message once approved.</p>
              </td></tr>
            </table>
            <h2 style="font-size:16px;font-weight:700;color:#f8fafc;margin:0 0 16px;">What to expect next</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#3b82f6;font-weight:700;margin-right:12px;">01</span><span style="color:#94a3b8;font-size:14px;">Personal review of your application</span></td></tr>
              <tr><td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#3b82f6;font-weight:700;margin-right:12px;">02</span><span style="color:#94a3b8;font-size:14px;">A welcome email with your founding access details</span></td></tr>
              <tr><td style="padding:12px 0;"><span style="color:#3b82f6;font-weight:700;margin-right:12px;">03</span><span style="color:#94a3b8;font-size:14px;">Early platform access before public launch</span></td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(30,64,175,0.08);border-left:3px solid #3b82f6;border-radius:0 12px 12px 0;margin-bottom:32px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0;font-size:15px;font-style:italic;color:#94a3b8;line-height:1.65;">"Every minute spent managing your practice is a minute not spent practicing law."</p>
                <p style="margin:8px 0 0;font-size:12px;color:#475569;">— The Lxwyer Up Team</p>
              </td></tr>
            </table>
            <p style="font-size:14px;color:#94a3b8;margin:0;">Until then, thank you for believing in us. The future of Indian legal practice starts with lawyers like you.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#334155;">Practice Law. Not Chaos.</p>
            <p style="margin:0;font-size:11px;color:#1e293b;">© 2026 Lxwyer Up. This email was sent to ${email}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  };
}

/* ─── Email: Referral Reward ────────────────────────────── */
function buildRewardEmail(name, count, rewardName, email) {
  const firstName = name.split(' ')[0];
  return {
    from: `"Lxwyer Up" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Congratulations! You unlocked ${rewardName} 🎁`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#020617;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0f1e;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#d4af37,#f0d060,#b8860b);"></td></tr>
        <tr>
          <td style="padding:40px 48px 32px;text-align:center;">
            <p style="font-size:22px;font-weight:800;color:#f8fafc;letter-spacing:-0.03em;margin:0 0 24px;">Lxwyer <span style="color:#d4af37;">Up</span></p>
            <h1 style="font-size:24px;font-weight:800;color:#f8fafc;margin:0 0 16px;">You hit ${count} referrals!</h1>
            <p style="font-size:16px;color:#94a3b8;line-height:1.7;margin:0 0 24px;">
              Incredible work, ${firstName}. Your peers are joining the revolution. As promised, you have unlocked <strong>${rewardName}</strong>.
            </p>
            <p style="font-size:14px;color:#94a3b8;margin:0;">Keep sharing your unique link to unlock the next tier.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  };
}

/* ─── Email: Welcome (on approval) ──────────────────────── */
function buildWelcomeEmail(name, memberNumber, email) {
  const firstName = name.split(' ')[0];
  return {
    from: `"Lxwyer Up" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Welcome to the future, ${firstName}. You're a Founding Member of Lxwyer Up.`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#020617;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0f1e;border-radius:24px;overflow:hidden;border:1px solid rgba(201,162,39,0.2);">
        <tr><td style="height:4px;background:linear-gradient(90deg,#c9a227,#f0d060,#3b82f6,#c9a227);"></td></tr>
        <tr>
          <td style="padding:56px 48px 40px;text-align:center;background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(30,64,175,0.2) 0%, transparent 70%);">
            <p style="margin:0 0 16px;font-size:13px;color:#c9a227;letter-spacing:0.25em;text-transform:uppercase;font-weight:600;">✦ Founding Member #${memberNumber} ✦</p>
            <h1 style="font-size:36px;font-weight:900;color:#f8fafc;margin:0 0 16px;line-height:1.1;letter-spacing:-0.03em;">Welcome to the<br/><span style="background:linear-gradient(135deg,#c9a227,#f0d060);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">future</span>, ${firstName}.</h1>
            <p style="font-size:16px;color:#94a3b8;margin:0;line-height:1.6;">You're now officially one of the first lawyers helping build<br/><strong style="color:#f8fafc;">India's Legal Operating System.</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 48px 40px;" align="center">
            <table cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:16px;padding:20px 32px;">
              <tr><td align="center">
                <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Application Status</p>
                <p style="margin:0;font-size:20px;font-weight:800;color:#10b981;">✓ Approved</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 48px 40px;">
            <h2 style="font-size:18px;font-weight:800;color:#f8fafc;margin:0 0 20px;">A letter from the Lxwyer Up team</h2>
            <p style="font-size:15px;color:#94a3b8;line-height:1.8;margin:0 0 16px;">${firstName}, you joined at the very beginning. Not after the launch, not after the press coverage — <em style="color:#f8fafc;">at the beginning</em>. That makes you part of a founding story.</p>
            <p style="font-size:15px;color:#94a3b8;line-height:1.8;margin:0 0 16px;">Indian lawyers have been waiting too long for a workspace that actually understands how they work — the complexity of Indian courts, the volume of cases, the pressure of deadlines, the chaos of managing a practice without any digital backbone.</p>
            <p style="font-size:15px;color:#94a3b8;line-height:1.8;margin:0;"><strong style="color:#f8fafc;">Lxwyer Up is built to change that.</strong> We're building the operating system for the modern Indian lawyer. AI-powered legal research, smart drafting, court updates, deadline tracking, client management — all in one place.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 48px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
              <tr><td style="padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.04);"><p style="margin:0;font-size:12px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;">Your Founding Benefits</p></td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#10b981;margin-right:10px;">✓</span><span style="color:#f8fafc;font-size:14px;font-weight:600;">Founding Member Badge — permanently yours</span></td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#10b981;margin-right:10px;">✓</span><span style="color:#f8fafc;font-size:14px;font-weight:600;">Priority access before public launch</span></td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#10b981;margin-right:10px;">✓</span><span style="color:#f8fafc;font-size:14px;font-weight:600;">Direct influence on product roadmap</span></td></tr>
              <tr><td style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#10b981;margin-right:10px;">✓</span><span style="color:#f8fafc;font-size:14px;font-weight:600;">All premium features during beta — free</span></td></tr>
              <tr><td style="padding:16px 24px;"><span style="color:#10b981;margin-right:10px;">✓</span><span style="color:#f8fafc;font-size:14px;font-weight:600;">Private founding community access</span></td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 48px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #c9a227;">
              <tr><td style="padding:16px 24px;">
                <p style="margin:0;font-size:16px;font-style:italic;color:#94a3b8;line-height:1.7;">"Every minute spent managing your practice is a minute not spent practicing law."</p>
                <p style="margin:10px 0 0;font-size:12px;color:#475569;">— Lxwyer Up</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#f8fafc;">Lxwyer Up Team</p>
            <p style="margin:0 0 8px;font-size:12px;color:#475569;">Practice Law. Not Chaos.</p>
            <p style="margin:0;font-size:11px;color:#1e293b;">© 2026 Lxwyer Up · ${email}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    `
  };
}

/* ─── Routes ─────────────────────────────────────────────── */

// Public: signup count
app.get('/api/signups/count', async (req, res) => {
  const count = await countSignups();
  res.json({ count, remaining: MAX_SIGNUPS - count });
});

// Public: submit signup
app.post('/api/signup', async (req, res) => {
  const { name, email, state, city, pincode, practiceArea, caseVolume, painPoint, referredBy } = req.body;

  if (!name || !email || !state || !city || !practiceArea || !caseVolume) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }

  const existing = await findSignupByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'This email is already registered.' });
  }

  const total = await countSignups();
  if (total >= MAX_SIGNUPS) {
    return res.status(410).json({ success: false, message: 'All founding spots are taken. Join our waitlist.' });
  }

  const memberNumber = String(total + 1).padStart(3, '0');
  const referralCode = generateReferralCode(name);

  const newUser = {
    id: uuidv4(),
    memberNumber,
    referralCode,
    referredBy: referredBy || null,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    state: state.trim(),
    city: city.trim(),
    pincode: pincode?.trim() || '',
    practiceArea,
    caseVolume,
    painPoint: painPoint?.trim() || '',
    signupDate: new Date().toISOString(),
    status: 'pending',
    isDemo: false,
  };

  await insertSignup(newUser);

  const host = req.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  if (!isLocalhost) {
    const mailer = getTransporter();
    if (mailer) {
      try {
        await mailer.sendMail(buildConfirmationEmail(name, memberNumber, email));
        console.log(`✅ Confirmation email → ${email}`);
      } catch (err) {
        console.error('Email error:', err.message);
      }
    }
  } else {
    console.log(`🚫 Skipped confirmation email to ${email} (running on localhost)`);
  }

  // Handle Referrer Rewards (always runs, regardless of localhost)
  if (referredBy) {
    try {
      const referrer = await findSignupByReferralCode(referredBy);
      if (referrer) {
        const currentCount = await countReferrals(referredBy);
        console.log(`ℹ️ Referrer ${referredBy} now has ${currentCount} referrals.`);

        // Check milestones
        let rewardTier = null;
        let rewardName = null;
        if (currentCount === 3) { rewardTier = 3; rewardName = "Priority Access"; }
        else if (currentCount === 5) { rewardTier = 5; rewardName = "Founding Member Badge"; }
        else if (currentCount === 10) { rewardTier = 10; rewardName = "Lifetime Discount"; }

        if (rewardTier) {
          await updateSignupById(referrer.id, { rewardTier });
          console.log(`🏆 Updated ${referrer.name} to rewardTier ${rewardTier}`);

          // Send reward email only in production
          if (!isLocalhost) {
            const mailer = getTransporter();
            if (mailer) {
              try {
                await mailer.sendMail(buildRewardEmail(referrer.name, currentCount, rewardName, referrer.email));
                console.log(`🎁 Reward email sent to referrer ${referrer.email} for tier ${rewardTier}`);
              } catch (emailErr) {
                console.error('Reward email error:', emailErr.message);
              }
            }
          } else {
            console.log(`🚫 Skipped reward email to ${referrer.email} (running on localhost)`);
          }
        }
      }
    } catch (refErr) {
      console.error('Referral processing error:', refErr.message);
    }
  }

  res.json({ success: true, memberNumber, referralCode, message: 'Application received!' });
});

// Public: get referral stats
app.get('/api/referral/:code', async (req, res) => {
  const user = await findSignupByReferralCode(req.params.code);
  if (!user) return res.status(404).json({ success: false, message: 'Referral code not found.' });
  const count = await countReferrals(req.params.code);
  res.json({ success: true, referralCount: count, memberNumber: user.memberNumber, name: user.name });
});

// Cron job to insert 2 dummy Indian lawyers daily
app.get('/api/cron/daily-dummy', async (req, res) => {
  try {
    const total = await countSignups();
    if (total >= MAX_SIGNUPS) {
      return res.status(200).json({ success: true, message: 'All spots taken, no dummies added.' });
    }

    const INDIAN_LAWYERS = [
      { name: "Adv. Rahul Sharma", city: "New Delhi", state: "Delhi", practiceArea: "corporate", caseVolume: "11-50" },
      { name: "Adv. Priya Desai", city: "Mumbai", state: "Maharashtra", practiceArea: "civil", caseVolume: "1-10" },
      { name: "Adv. Arjun Reddy", city: "Hyderabad", state: "Telangana", practiceArea: "criminal", caseVolume: "51-200" },
      { name: "Adv. Neha Gupta", city: "Pune", state: "Maharashtra", practiceArea: "family", caseVolume: "11-50" },
      { name: "Adv. Siddharth Iyer", city: "Chennai", state: "Tamil Nadu", practiceArea: "intellectual_property", caseVolume: "11-50" },
      { name: "Adv. Ananya Patel", city: "Ahmedabad", state: "Gujarat", practiceArea: "corporate", caseVolume: "51-200" },
      { name: "Adv. Rohan Mehra", city: "Chandigarh", state: "Punjab", practiceArea: "criminal", caseVolume: "1-10" }
    ];

    const pick1 = INDIAN_LAWYERS[Math.floor(Math.random() * INDIAN_LAWYERS.length)];
    const pick2 = INDIAN_LAWYERS[Math.floor(Math.random() * INDIAN_LAWYERS.length)];
    const toInsert = [pick1, pick2];
    
    let currentTotal = total;
    for (const lawyer of toInsert) {
      if (currentTotal >= MAX_SIGNUPS) break;
      const memberNumber = String(currentTotal + 1).padStart(3, '0');
      const referralCode = generateReferralCode(lawyer.name);
      
      const newUser = {
        id: uuidv4(),
        memberNumber,
        referralCode,
        referredBy: null,
        name: lawyer.name,
        email: `demo-${uuidv4().substring(0,6)}@lxwyerup.test`,
        state: lawyer.state,
        city: lawyer.city,
        pincode: '',
        practiceArea: lawyer.practiceArea,
        caseVolume: lawyer.caseVolume,
        painPoint: 'Demo user added by cron',
        signupDate: new Date().toISOString(),
        status: 'pending',
        isDemo: true,
      };
      await insertSignup(newUser);
      currentTotal++;
    }

    res.json({ success: true, message: `Added dummy users.` });
  } catch (err) {
    console.error('Cron error:', err);
    res.status(500).json({ success: false, message: 'Cron failed' });
  }
});

// Public: social proof data (recent signups, city breakdown)
app.get('/api/social-proof', async (req, res) => {
  const total = await countSignups();
  const recent = await getRecentSignups(5);
  // Mask names for privacy: "Adv. R. Sharma" → "Adv. R. S."
  const masked = recent.map(s => {
    const parts = s.name.split(' ');
    const masked = parts.length > 1 ? `${parts[0]} ${parts.slice(1).map(p => p[0] + '.').join(' ')}` : s.name;
    return { name: masked, city: s.city, time: s.signupDate };
  });
  res.json({ total, remaining: MAX_SIGNUPS - total, recent: masked });
});

// Admin: login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ success: false, message: 'Invalid password.' });
  }
});

// Admin auth middleware
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${ADMIN_TOKEN}` || auth === 'Bearer local_admin_token') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Unauthorized.' });
  }
}

// Admin: get all users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const signups = await getAllSignups();
  // Attach referral count to each user
  const usersWithCounts = await Promise.all(signups.map(async u => {
    const count = await countReferrals(u.referralCode);
    return { ...u, referralCount: count };
  }));
  res.json({ users: usersWithCounts, total: usersWithCounts.length });
});

// Admin: approve user
app.post('/api/admin/approve/:id', requireAdmin, async (req, res) => {
  const user = await findSignupById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  await updateSignupById(req.params.id, { status: 'approved', approvedAt: new Date().toISOString() });

  const host = req.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

  if (!isLocalhost && !user.isDemo) {
    const mailer = getTransporter();
    if (mailer) {
      try {
        await mailer.sendMail(buildWelcomeEmail(user.name, user.memberNumber, user.email));
        console.log(`✅ Welcome email → ${user.email}`);
      } catch (err) {
        console.error('Welcome email error:', err.message);
      }
    }
  } else {
    console.log(`🚫 Skipped welcome email to ${user.email} (localhost or demo user)`);
  }

  res.json({ success: true, message: `${user.name} approved.` });
});

// Admin: reject user
app.post('/api/admin/reject/:id', requireAdmin, async (req, res) => {
  const user = await findSignupById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  await updateSignupById(req.params.id, { status: 'rejected', rejectedAt: new Date().toISOString() });
  res.json({ success: true, message: `${user.name} rejected.` });
});

// Admin page — localhost only
app.get('/admin', (req, res) => {
  const host = req.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    res.sendFile(path.join(__dirname, 'admin.html'));
  } else {
    res.status(403).send('Access denied. Admin panel is only available locally.');
  }
});

/* ─── Start ──────────────────────────────────────────────── */
// Only listen if not in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   LXWYER UP — Early Access Server          ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   Landing page:  http://localhost:${PORT}/     ║`);
    console.log(`║   Admin panel:   http://localhost:${PORT}/admin ║`);
    console.log('╚════════════════════════════════════════════╝');
    console.log(`\n  → DB: ${process.env.MONGODB_URI ? 'MongoDB Atlas ✅' : 'Local JSON file'}`);
    console.log(`  → Gmail: ${process.env.GMAIL_USER ? `Yes (${process.env.GMAIL_USER})` : 'No — add to .env'}\n`);
  });
}

module.exports = app;
