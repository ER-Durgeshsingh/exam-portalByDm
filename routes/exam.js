const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const [rows] = await db.query("SELECT id, title, duration, total_questions FROM exams WHERE is_active = 1 ORDER BY id DESC");
  res.json(rows);
});

router.post("/:id/start", requireAuth, async (req, res) => {
  const examId = Number(req.params.id);
  const [exams] = await db.query("SELECT id, title, duration FROM exams WHERE id = ? AND is_active = 1", [examId]);
  if (!exams.length) return res.status(404).json({ message: "Exam not found." });

  const [existing] = await db.query(
    "SELECT id, status FROM attempts WHERE user_id = ? AND exam_id = ? AND status = 'in_progress' ORDER BY id DESC LIMIT 1",
    [req.user.id, examId]
  );
  let attemptId;
  if (existing.length) attemptId = existing[0].id;
  else {
    const [result] = await db.query("INSERT INTO attempts (user_id, exam_id) VALUES (?, ?)", [req.user.id, examId]);
    attemptId = result.insertId;
  }
  const [questions] = await db.query(
    "SELECT id, question, option_a, option_b, option_c, option_d FROM questions WHERE exam_id = ? ORDER BY id",
    [examId]
  );
  res.json({ attemptId, exam: exams[0], questions });
});

router.post("/attempt/:attemptId/warning", requireAuth, async (req, res) => {
  const attemptId = Number(req.params.attemptId);
  const activity = String(req.body.activity || "Tab visibility changed").slice(0, 100);
  const [rows] = await db.query("SELECT id, warnings, status FROM attempts WHERE id = ? AND user_id = ?",
    [attemptId, req.user.id]);
  if (!rows.length) return res.status(404).json({ message: "Attempt not found." });
  if (rows[0].status !== "in_progress") return res.status(409).json({ message: "This test is already submitted." });

  await db.query("INSERT INTO cheating_logs (attempt_id, activity) VALUES (?, ?)", [attemptId, activity]);
  const warnings = rows[0].warnings + 1;
  await db.query("UPDATE attempts SET warnings = ? WHERE id = ?", [warnings, attemptId]);
  res.json({ warnings, limit: 3, autoSubmit: warnings >= 3 });
});

router.post("/attempt/:attemptId/submit", requireAuth, async (req, res) => {
  const attemptId = Number(req.params.attemptId);
  const answers = req.body.answers || {};
  const [attempts] = await db.query(
    "SELECT id, exam_id, status FROM attempts WHERE id = ? AND user_id = ?",
    [attemptId, req.user.id]
  );
  if (!attempts.length) return res.status(404).json({ message: "Attempt not found." });
  if (attempts[0].status === "submitted") return res.status(409).json({ message: "This test has already been submitted." });

  const [questions] = await db.query("SELECT id, correct_answer FROM questions WHERE exam_id = ?", [attempts[0].exam_id]);
  let score = 0;
  for (const q of questions) {
    if (String(answers[q.id] || "").toUpperCase() === q.correct_answer.toUpperCase()) score++;
  }
  await db.query("UPDATE attempts SET score = ?, status = 'submitted', submitted_at = NOW() WHERE id = ?",
    [score, attemptId]);
  res.json({ message: "Test submitted successfully.", score, total: questions.length });
});

router.get("/results/mine", requireAuth, async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.id, e.title, a.score, e.total_questions, a.warnings, a.status, a.submitted_at
     FROM attempts a JOIN exams e ON e.id = a.exam_id
     WHERE a.user_id = ? ORDER BY a.id DESC`, [req.user.id]);
  res.json(rows);
});

module.exports = router;
