require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./config/db");
const authRoutes = require("./routes/auth");
const examRoutes = require("./routes/exam");
const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, message: "Server and MySQL are connected." });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Database connection failed." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teacher", teacherRoutes);

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Smart MCQ app running at http://localhost:${port}`));
