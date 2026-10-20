#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client/web';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('\n❌ Lỗi: Chưa cung cấp TURSO_DATABASE_URL!');
  console.error('Cách chạy:\n');
  console.error('  TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/setup-db.js [email_admin] [mat_khau]\n');
  console.error('Hoặc trên Windows PowerShell:\n');
  console.error('  $env:TURSO_DATABASE_URL="libsql://..."');
  console.error('  $env:TURSO_AUTH_TOKEN="..."');
  console.error('  node scripts/setup-db.js admin@example.com matkhau123\n');
  process.exit(1);
}

const db = createClient({ url, authToken });

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const dk = crypto.scryptSync(pw, Buffer.from(salt, 'hex'), 32, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${dk}`;
}

async function main() {
  console.log('🔄 Đang kết nối tới Turso database...');

  // 1. Tạo bảng
  console.log('📦 Đang khởi tạo các bảng (schema)...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      url         TEXT NOT NULL UNIQUE,
      cover_url   TEXT,
      title_en    TEXT,
      aliases     TEXT,
      added_at    TEXT,
      category    TEXT,
      hidden      INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plays (
      game_url    TEXT PRIMARY KEY,
      game_name   TEXT,
      play_count  INTEGER NOT NULL DEFAULT 0,
      updated_at  TEXT NOT NULL
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS visitors (
      visitor_id  TEXT PRIMARY KEY,
      first_seen  TEXT NOT NULL,
      last_seen   TEXT NOT NULL
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      email       TEXT PRIMARY KEY,
      pw_hash     TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash  TEXT PRIMARY KEY,
      email       TEXT NOT NULL REFERENCES admins(email) ON DELETE CASCADE,
      expires_at  INTEGER NOT NULL
    );
  `);

  console.log('✅ Đã tạo bảng thành công!');

  // 2. Nhập danh sách game dự phòng từ games-seed.js
  const seedFile = path.join(rootDir, 'web', 'games-seed.js');
  if (fs.existsSync(seedFile)) {
    console.log('📥 Đang nạp danh sách 60+ game từ games-seed.js...');
    const content = fs.readFileSync(seedFile, 'utf-8');
    const match = content.match(/=\s*(\[[\s\S]*\])\s*;/);
    if (match) {
      const seedGames = JSON.parse(match[1]);
      let inserted = 0;
      const now = new Date().toISOString();

      for (const g of seedGames) {
        if (!g.url || !g.name) continue;
        try {
          await db.execute({
            sql: `INSERT OR IGNORE INTO games (name, url, cover_url, title_en, aliases, added_at, category, hidden, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
            args: [
              g.name.trim(),
              g.url.trim(),
              g.cover_url || null,
              g.title_en || null,
              g.aliases || null,
              g.added_at || now.slice(0, 10),
              g.category || 'other',
              now,
              now
            ]
          });
          inserted++;
        } catch (e) {
          // Bỏ qua trùng lặp
        }
      }
      console.log(`✅ Đã nạp thành công các game vào cơ sở dữ liệu!`);
    }
  }

  // 3. Tạo tài khoản Admin
  const adminEmail = process.argv[2];
  const adminPassword = process.argv[3];

  if (adminEmail && adminPassword) {
    console.log(`👤 Đang tạo tài khoản Admin cho: ${adminEmail}...`);
    const pwHash = hashPassword(adminPassword);
    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO admins (email, pw_hash, created_at) VALUES (?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET pw_hash = excluded.pw_hash`,
      args: [adminEmail.trim().toLowerCase(), pwHash, now]
    });
    console.log(`✅ Đã tạo/cập nhật tài khoản Admin: ${adminEmail}`);
  } else {
    console.log('\n💡 Gợi ý: Bạn chưa truyền email/mật khẩu admin.');
    console.log('   Để tạo admin, chạy lại lệnh: node scripts/setup-db.js your-email@gmail.com matkhau123\n');
  }

  console.log('\n🎉 Chúc mừng! Database Turso đã sẵn sàng 100% để kết nối với Vercel!\n');
}

main().catch(err => {
  console.error('❌ Lỗi khi khởi tạo database:', err);
  process.exit(1);
});
