const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "campusmarket.db");

const db = new Database(DB_PATH);

// Some sensible pragmas for a small app
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables if they don't exist
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  passwordHash TEXT NOT NULL,
  email_verified INTEGER DEFAULT 0,
  verificationToken TEXT,
  createdAt TEXT,
  verifiedAt TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  campus TEXT NOT NULL,
  images TEXT,
  seller_name TEXT,
  seller_email TEXT NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  created_date TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  receiver_email TEXT NOT NULL,
  content TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_date TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_date TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_listings_seller_email ON listings (seller_email);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings (status);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON messages (listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages (sender_email, receiver_email);
`);

module.exports = db;




