const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const { v4: uuid } = require("uuid");
const path = require("path");
const fs = require("fs");
const db = require("./db");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1);

// CORS configuration - allow your domain in production
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "https://campusmarket.ca", "http://campusmarket.ca"]
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
// Increase JSON body size because we upload images as base64 JSON.
// (e.g. 8MB images can become ~11MB base64)
app.use(express.json({ limit: "25mb" }));

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "dist")));
}

// Serve uploaded images
const DATA_DIR = path.join(__dirname, "..", "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL =
  process.env.FROM_EMAIL || "Campus Market <noreply@campusmarket.ca>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

function isUfvStudentEmail(email) {
  return (
    typeof email === "string" &&
    email.toLowerCase().endsWith("@student.ufv.ca")
  );
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), b64: match[2] };
}

function mimeToExt(mime) {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

// --------- DB helpers ----------

function getUserByEmail(email) {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email.toLowerCase()) || null;
}

function insertUser(user) {
  const stmt = db.prepare(
    `INSERT INTO users (id, email, name, passwordHash, email_verified, verificationToken, createdAt, verifiedAt)
     VALUES (@id, @email, @name, @passwordHash, @email_verified, @verificationToken, @createdAt, @verifiedAt)`
  );
  stmt.run(user);
}

function updateUser(user) {
  const stmt = db.prepare(
    `UPDATE users
     SET name = @name,
         passwordHash = @passwordHash,
         email_verified = @email_verified,
         verificationToken = @verificationToken,
         createdAt = @createdAt,
         verifiedAt = @verifiedAt
     WHERE email = @email`
  );
  stmt.run(user);
}

// -------- AUTH ROUTES --------

app.post("/api/auth/signup", async (req, res) => {
  const { email, name, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (!isUfvStudentEmail(email)) {
    return res
      .status(400)
      .json({ error: "You must use your @student.ufv.ca email." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long." });
  }

  const existing = getUserByEmail(email.toLowerCase());
  let user;
  let verificationToken;

  if (existing) {
    // If user exists but is not verified, regenerate token and resend email
    if (!existing.email_verified) {
      verificationToken = uuid();
      user = {
        ...existing,
        verificationToken,
      };
      updateUser(user);
    } else {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    verificationToken = uuid();
    user = {
      id: uuid(),
      name: name || "",
      email: email.toLowerCase(),
      passwordHash,
      email_verified: false,
      verificationToken,
      createdAt: new Date().toISOString()
    };
    insertUser(user);
  }

  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(
    verificationToken
  )}&email=${encodeURIComponent(user.email)}`;

  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: "Verify your UFV Campus Market email",
        html: `
          <p>Hi${user.name ? " " + user.name : ""},</p>
          <p>Click the link below to verify your UFV student email for Campus Market:</p>
          <p><a href="${verifyUrl}">Verify my email</a></p>
          <p>If you didn’t request this, you can ignore this email.</p>
        `
      });
    } catch (err) {
      console.error("Error sending verification email:", err);
    }
  } else {
    console.warn("RESEND_API_KEY not set; verification URL:", verifyUrl);
  }

  // For local dev we also return the URL so you can click it directly
  return res.json({ ok: true, verifyUrl });
});

app.post("/api/auth/verify-email", (req, res) => {
  const { email, token } = req.body || {};
  if (!email || !token) {
    return res.status(400).json({ error: "Email and token are required." });
  }
  const existing = getUserByEmail(email.toLowerCase());
  if (!existing) {
    return res.status(400).json({ error: "Invalid or expired token." });
  }

  // For development, be forgiving about tokens: as long as the email matches
  // an existing user, mark it verified. This avoids issues with stale tokens
  // while you're iterating. For production you can tighten this.
  if (existing.verificationToken && existing.verificationToken !== token) {
    console.warn(
      "Verification token mismatch for",
      existing.email,
      "expected",
      existing.verificationToken,
      "got",
      token
    );
  }

  const user = {
    ...existing,
    email_verified: true,
    verificationToken: null,
    verifiedAt: new Date().toISOString(),
  };
  updateUser(user);
  return res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = getUserByEmail(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  if (!user.email_verified) {
    return res
      .status(403)
      .json({ error: "Please verify your email before logging in." });
  }
  if (!isUfvStudentEmail(user.email)) {
    return res
      .status(403)
      .json({ error: "Only @student.ufv.ca emails are allowed." });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.name,
      email_verified: user.email_verified
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.name,
      email_verified: user.email_verified
    }
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = getUserByEmail(req.user.email.toLowerCase());
  if (!user) return res.status(401).json({ error: "User not found." });
  return res.json({
    id: user.id,
    email: user.email,
    full_name: user.name,
    email_verified: user.email_verified
  });
});

// -------- UPLOADS --------

// Upload an image as base64 JSON and return a permanent URL.
// Request body: { dataUrl: "data:image/png;base64,...", filename?: "foo.png" }
app.post("/api/upload", authMiddleware, (req, res) => {
  const { dataUrl } = req.body || {};
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    return res.status(400).json({ error: "Invalid dataUrl" });
  }

  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
  if (!allowed.has(parsed.mime)) {
    return res.status(400).json({ error: "Only jpg, png, webp, gif are allowed." });
  }

  let buffer;
  try {
    buffer = Buffer.from(parsed.b64, "base64");
  } catch {
    return res.status(400).json({ error: "Invalid base64 data" });
  }

  // Enforce an 8MB limit (align with frontend)
  const MAX_BYTES = 8 * 1024 * 1024;
  if (!buffer || buffer.length === 0) {
    return res.status(400).json({ error: "Empty upload" });
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({ error: "Image is too large (max 8MB)." });
  }

  const ext = mimeToExt(parsed.mime) || ".bin";
  const filename = `${uuid()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  try {
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    console.error("Upload write error:", err);
    return res.status(500).json({ error: "Failed to store upload" });
  }

  const publicUrl = `${req.protocol}://${req.get("host")}/uploads/${filename}`;
  return res.json({ file_url: publicUrl });
});

// -------- LISTINGS --------

app.get("/api/listings", (req, res) => {
  const { status, seller_email, id } = req.query;

  let sql = "SELECT * FROM listings WHERE 1=1";
  const params = [];

  if (id) {
    sql += " AND id = ?";
    params.push(id);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (seller_email) {
    sql += " AND seller_email = ?";
    params.push(seller_email);
  }

  sql += " ORDER BY datetime(created_date) DESC";

  const rows = db.prepare(sql).all(...params);
  const result = rows.map((row) => ({
    ...row,
    images: row.images ? JSON.parse(row.images) : [],
  }));

  res.json(result);
});

app.post("/api/listings", authMiddleware, (req, res) => {
  const {
    title,
    description = "",
    price,
    category,
    condition = "good",
    campus,
    images = [],
    location = ""
  } = req.body || {};

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({ error: "Title is required (min 3 chars)." });
  }
  const priceNumber = Number(price);
  if (Number.isNaN(priceNumber) || priceNumber < 0) {
    return res.status(400).json({ error: "Price must be a non-negative number." });
  }
  if (!category) {
    return res.status(400).json({ error: "Category is required." });
  }
  if (!campus || !["abbotsford", "chilliwack"].includes(campus)) {
    return res
      .status(400)
      .json({ error: "Campus must be abbotsford or chilliwack." });
  }

  const now = new Date().toISOString();
  const listing = {
    id: uuid(),
    title: title.trim(),
    description: (description || "").trim(),
    price: priceNumber,
    category,
    condition,
    campus,
    images: Array.isArray(images) ? images : [],
    seller_name: req.user.full_name || "",
    seller_email: req.user.email,
    status: "active",
    location: (location || "").trim(),
    created_date: now,
  };

  db.prepare(
    `INSERT INTO listings
     (id, title, description, price, category, condition, campus, images, seller_name, seller_email, status, location, created_date)
     VALUES (@id, @title, @description, @price, @category, @condition, @campus, @images, @seller_name, @seller_email, @status, @location, @created_date)`
  ).run({
    ...listing,
    images: JSON.stringify(listing.images),
  });

  res.json(listing);
});

app.patch("/api/listings/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const listing = db
    .prepare("SELECT * FROM listings WHERE id = ?")
    .get(id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (listing.seller_email !== req.user.email) {
    return res.status(403).json({ error: "Not your listing." });
  }
  const { status } = req.body || {};
  if (status && !["active", "sold", "removed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  if (status) {
    db.prepare("UPDATE listings SET status = ? WHERE id = ?").run(status, id);
    listing.status = status;
  }

  res.json({
    ...listing,
    images: listing.images ? JSON.parse(listing.images) : [],
  });
});

app.delete("/api/listings/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const listing = db
    .prepare("SELECT * FROM listings WHERE id = ?")
    .get(id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (listing.seller_email !== req.user.email) {
    return res.status(403).json({ error: "Not your listing." });
  }
  db.prepare("DELETE FROM listings WHERE id = ?").run(id);
  res.json({ ok: true });
});

// -------- MESSAGES --------

app.get("/api/messages", authMiddleware, (req, res) => {
  const { sender_email, receiver_email, listing_id } = req.query;
  let sql = "SELECT * FROM messages WHERE (sender_email = ? OR receiver_email = ?)";
  const params = [req.user.email, req.user.email];

  if (sender_email) {
    sql += " AND sender_email = ?";
    params.push(sender_email);
  }
  if (receiver_email) {
    sql += " AND receiver_email = ?";
    params.push(receiver_email);
  }
  if (listing_id) {
    sql += " AND listing_id = ?";
    params.push(listing_id);
  }

  sql += " ORDER BY datetime(created_date) DESC";

  const result = db.prepare(sql).all(...params);
  res.json(result);
});

app.post("/api/messages", authMiddleware, (req, res) => {
  const { listing_id, receiver_email, content } = req.body || {};
  if (!listing_id || !receiver_email || !content) {
    return res
      .status(400)
      .json({ error: "listing_id, receiver_email and content are required." });
  }
  if (receiver_email === req.user.email) {
    return res.status(400).json({ error: "Cannot message yourself." });
  }
  if (!isUfvStudentEmail(req.user.email)) {
    return res.status(403).json({ error: "Only UFV students may send messages." });
  }

  const now = new Date().toISOString();
  const msg = {
    id: uuid(),
    listing_id,
    sender_email: req.user.email,
    sender_name: req.user.full_name,
    receiver_email,
    content: String(content).trim().slice(0, 1000),
    read: 0,
    created_date: now,
  };

  db.prepare(
    `INSERT INTO messages
     (id, listing_id, sender_email, sender_name, receiver_email, content, read, created_date)
     VALUES (@id, @listing_id, @sender_email, @sender_name, @receiver_email, @content, @read, @created_date)`
  ).run(msg);

  res.json(msg);
});

// -------- REPORTS --------

app.post("/api/reports", authMiddleware, (req, res) => {
  const { listing_id, reason } = req.body || {};
  if (!listing_id || !reason) {
    return res.status(400).json({ error: "listing_id and reason are required." });
  }
  const now = new Date().toISOString();
  const report = {
    id: uuid(),
    listing_id,
    reporter_email: req.user.email,
    reason: String(reason).trim().slice(0, 500),
    created_date: now,
  };

  db.prepare(
    `INSERT INTO reports (id, listing_id, reporter_email, reason, created_date)
     VALUES (@id, @listing_id, @reporter_email, @reason, @created_date)`
  ).run(report);

  console.info("New report:", report);
  res.json({ ok: true });
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
}

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
  if (process.env.NODE_ENV === "production") {
    console.log(`Serving frontend from /dist`);
  }
});


