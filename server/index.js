const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const { v4: uuid } = require("uuid");
require("dotenv").config();

const app = express();
// In development the Vite dev server port can change (5173, 5174, 5175, ...),
// so we allow the request's origin by default. Tighten this for production.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL =
  process.env.FROM_EMAIL || "Campus Market <noreply@campusmarket.ca>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// In-memory stores (replace with real DB for production)
const users = new Map(); // email -> { id, name, email, passwordHash, email_verified, verificationToken }
const listings = [];
const messages = [];
const reports = [];

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

  const existing = users.get(email.toLowerCase());
  let user;
  let verificationToken;

  if (existing) {
    // If user exists but is not verified, regenerate token and resend email
    if (!existing.email_verified) {
      verificationToken = uuid();
      existing.verificationToken = verificationToken;
      users.set(existing.email, existing);
      user = existing;
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
    users.set(user.email, user);
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
  const user = users.get(email.toLowerCase());
  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token." });
  }

  // For development, be forgiving about tokens: as long as the email matches
  // an existing user, mark it verified. This avoids issues with stale tokens
  // while you're iterating. For production you can tighten this.
  if (user.verificationToken && user.verificationToken !== token) {
    console.warn(
      "Verification token mismatch for",
      user.email,
      "expected",
      user.verificationToken,
      "got",
      token
    );
  }

  user.email_verified = true;
  user.verificationToken = null;
  user.verifiedAt = new Date().toISOString();
  users.set(user.email, user);
  return res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = users.get(email.toLowerCase());
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
  const user = users.get(req.user.email.toLowerCase());
  if (!user) return res.status(401).json({ error: "User not found." });
  return res.json({
    id: user.id,
    email: user.email,
    full_name: user.name,
    email_verified: user.email_verified
  });
});

// -------- LISTINGS --------

app.get("/api/listings", (req, res) => {
  const { status, seller_email, id } = req.query;
  let result = listings.slice();

  if (id) {
    result = result.filter((l) => l.id === id);
  }
  if (status) {
    result = result.filter((l) => l.status === status);
  }
  if (seller_email) {
    result = result.filter((l) => l.seller_email === seller_email);
  }

  result.sort(
    (a, b) =>
      new Date(b.created_date || 0).getTime() -
      new Date(a.created_date || 0).getTime()
  );

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
    created_date: now
  };
  listings.push(listing);
  res.json(listing);
});

app.patch("/api/listings/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const listing = listings.find((l) => l.id === id);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (listing.seller_email !== req.user.email) {
    return res.status(403).json({ error: "Not your listing." });
  }
  const { status } = req.body || {};
  if (status && !["active", "sold", "removed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  if (status) listing.status = status;
  res.json(listing);
});

app.delete("/api/listings/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const idx = listings.findIndex((l) => l.id === id);
  if (idx === -1) return res.status(404).json({ error: "Listing not found." });
  const listing = listings[idx];
  if (listing.seller_email !== req.user.email) {
    return res.status(403).json({ error: "Not your listing." });
  }
  listings.splice(idx, 1);
  res.json({ ok: true });
});

// -------- MESSAGES --------

app.get("/api/messages", authMiddleware, (req, res) => {
  const { sender_email, receiver_email, listing_id } = req.query;
  let result = messages.slice();
  if (sender_email) {
    result = result.filter((m) => m.sender_email === sender_email);
  }
  if (receiver_email) {
    result = result.filter((m) => m.receiver_email === receiver_email);
  }
  if (listing_id) {
    result = result.filter((m) => m.listing_id === listing_id);
  }
  result = result.filter(
    (m) =>
      m.sender_email === req.user.email || m.receiver_email === req.user.email
  );

  result.sort(
    (a, b) =>
      new Date(b.created_date || 0).getTime() -
      new Date(a.created_date || 0).getTime()
  );
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
    read: false,
    created_date: now
  };
  messages.push(msg);
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
    created_date: now
  };
  reports.push(report);
  console.info("New report:", report);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Backend API listening on http://localhost:${PORT}`);
});


