import express from "express";
import cors from "cors";
import multer from "multer";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
const upload = multer(); // memory storage

// --------------------
// CORS (OPEN)
// --------------------
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// --------------------
// PostgreSQL
// --------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --------------------
// HEALTH API
// --------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --------------------
// CREATE API (MATCHES FRONTEND)
// --------------------
app.post("/api/submit", upload.single("photo"), async (req, res) => {
  try {
    const { name, roll } = req.body;
    const photo = req.file ? req.file.buffer : null;

    if (!name || !roll) {
      return res.status(400).json({ error: "name and roll required" });
    }

    await pool.query(
      `INSERT INTO students (name, roll_no, photo)
       VALUES ($1, $2, $3)`,
      [name, parseInt(roll), photo]
    );

    res.json({ success: true });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Name already exists" });
    }

    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
