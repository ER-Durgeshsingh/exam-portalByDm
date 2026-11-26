const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { requireAuth, requireAdmin } = require("../middleware/authMiddleware");
const router = express.Router();
router.use(requireAuth, requireAdmin);

router.post("/teachers", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 8) {
      return res.status(400).json({ message: "Name, valid email and password (minimum 8 characters) are required." });
    }
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(409).json({ message: "This email is already registered." });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'teacher')",
      [name, email, hash]
    );
    res.status(201).json({ message: "Teacher account created successfully.", teacher: { id: result.insertId, name, email, role: "teacher" } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create teacher account." });
  }
});

router.get("/results", async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.name, u.email, e.title, a.score, e.total_questions, a.warnings, a.status, a.submitted_at
     FROM attempts a JOIN users u ON u.id=a.user_id JOIN exams e ON e.id=a.exam_id ORDER BY a.id DESC`);
  res.json(rows);
});
router.get("/users", async (req, res) => {
  const [rows] = await db.query("SELECT id, name, email, role, created_at FROM users ORDER BY id DESC");
  res.json(rows);
});
router.patch("/users/:id/role", async (req, res) => {
  const role = String(req.body.role || "");
  if (!["student", "teacher", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role." });
  if (Number(req.params.id) === req.user.id && role !== "admin") return res.status(400).json({ message: "You cannot remove your own admin access." });
  const [result] = await db.query("UPDATE users SET role=? WHERE id=?", [role, Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({ message: "User not found." });
  res.json({ message: "User role updated. Ask that user to log in again." });
});
router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ message: "You cannot delete your own account." });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM cheating_logs WHERE attempt_id IN (SELECT id FROM attempts WHERE user_id=?)", [id]);
    await conn.query("DELETE FROM attempts WHERE user_id=?", [id]);
    const [result] = await conn.query("DELETE FROM users WHERE id=?", [id]);
    await conn.commit();
    if (!result.affectedRows) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User and their attempt history deleted. Exams created by this teacher remain unassigned." });
  } catch (err) {
    await conn.rollback(); throw err;
  } finally { conn.release(); }
});
router.get("/exams", async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.id, e.title, e.duration, e.total_questions, e.is_active, u.name AS teacher
     FROM exams e LEFT JOIN users u ON u.id=e.created_by ORDER BY e.id DESC`);
  res.json(rows);
});
router.post("/exams", async (req, res) => {
  const title = String(req.body.title || "").trim();
  const duration = Number(req.body.duration);
  if (!title || !Number.isInteger(duration) || duration < 1 || duration > 300)
    return res.status(400).json({ message: "Exam title and duration (1–300 minutes) are required." });
  const [result] = await db.query("INSERT INTO exams (title,duration,total_questions,is_active,created_by) VALUES (?,?,0,1,?)", [title,duration,req.user.id]);
  res.status(201).json({ message: "Exam created.", examId: result.insertId });
});
router.post("/questions", async (req, res) => {
  const { exam_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
  const answer = String(correct_answer || "").toUpperCase();
  if (!exam_id || !question || !option_a || !option_b || !option_c || !option_d || !["A","B","C","D"].includes(answer))
    return res.status(400).json({ message: "Please provide all question fields and a valid correct answer." });
  await db.query("INSERT INTO questions (exam_id,question,option_a,option_b,option_c,option_d,correct_answer) VALUES (?,?,?,?,?,?,?)",
    [Number(exam_id),question.trim(),option_a.trim(),option_b.trim(),option_c.trim(),option_d.trim(),answer]);
  await db.query("UPDATE exams SET total_questions=(SELECT COUNT(*) FROM questions WHERE exam_id=?) WHERE id=?", [Number(exam_id),Number(exam_id)]);
  res.status(201).json({ message: "Question added." });
});
router.patch("/exams/:id/status", async (req,res) => {
  const active = req.body.is_active ? 1 : 0;
  const [result] = await db.query("UPDATE exams SET is_active=? WHERE id=?", [active,Number(req.params.id)]);
  if (!result.affectedRows) return res.status(404).json({message:"Exam not found."});
  res.json({message:"Exam status updated."});
});
module.exports = router;
