const express = require("express");
const db = require("../config/db");
const { requireAuth, requireTeacher } = require("../middleware/authMiddleware");
const router = express.Router();

router.use(requireAuth, requireTeacher);

router.get("/exams", async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.id, e.title, e.duration, e.total_questions, e.is_active,
            (SELECT COUNT(*) FROM attempts a WHERE a.exam_id=e.id) AS attempts
     FROM exams e WHERE e.created_by=? ORDER BY e.id DESC`, [req.user.id]);
  res.json(rows);
});

router.post("/exams", async (req, res) => {
  const title = String(req.body.title || "").trim();
  const duration = Number(req.body.duration);
  if (!title || !Number.isInteger(duration) || duration < 1 || duration > 300)
    return res.status(400).json({ message: "Exam title and duration (1–300 minutes) are required." });
  const [result] = await db.query(
    "INSERT INTO exams (title, duration, total_questions, is_active, created_by) VALUES (?, ?, 0, 1, ?)",
    [title, duration, req.user.id]);
  res.status(201).json({ message: "Exam created successfully.", examId: result.insertId });
});

router.post("/questions", async (req, res) => {
  const { exam_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
  const answer = String(correct_answer || "").toUpperCase();
  if (!exam_id || !question || !option_a || !option_b || !option_c || !option_d || !["A", "B", "C", "D"].includes(answer))
    return res.status(400).json({ message: "Please fill every question field and select the correct answer." });
  const [owned] = await db.query("SELECT id FROM exams WHERE id=? AND created_by=?", [Number(exam_id), req.user.id]);
  if (!owned.length) return res.status(403).json({ message: "You can add questions only to your own exams." });
  await db.query(
    `INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [Number(exam_id), question.trim(), option_a.trim(), option_b.trim(), option_c.trim(), option_d.trim(), answer]);
  await db.query("UPDATE exams SET total_questions=(SELECT COUNT(*) FROM questions WHERE exam_id=?) WHERE id=?", [Number(exam_id), Number(exam_id)]);
  res.status(201).json({ message: "Question added successfully." });
});

router.get("/results", async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.name, u.email, e.id AS exam_id, e.title, a.score, e.total_questions,
            a.warnings, a.status, a.submitted_at
     FROM attempts a JOIN users u ON u.id=a.user_id JOIN exams e ON e.id=a.exam_id
     WHERE e.created_by=? ORDER BY a.id DESC`, [req.user.id]);
  res.json(rows);
});

module.exports = router;
