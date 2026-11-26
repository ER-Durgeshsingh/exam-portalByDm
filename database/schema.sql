CREATE DATABASE IF NOT EXISTS mcq_anticheat;
USE mcq_anticheat;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student','teacher','admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  duration INT NOT NULL,
  total_questions INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question TEXT NOT NULL,
  option_a VARCHAR(255) NOT NULL,
  option_b VARCHAR(255) NOT NULL,
  option_c VARCHAR(255) NOT NULL,
  option_d VARCHAR(255) NOT NULL,
  correct_answer CHAR(1) NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exam_id INT NOT NULL,
  score INT DEFAULT 0,
  warnings INT DEFAULT 0,
  status ENUM('in_progress','submitted') DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);

CREATE TABLE IF NOT EXISTS cheating_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  activity VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES attempts(id)
);

INSERT INTO exams (title, duration, total_questions, is_active)
SELECT 'Computer Fundamentals Test', 10, 5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Computer Fundamentals Test');

SET @exam_id = (SELECT id FROM exams WHERE title = 'Computer Fundamentals Test' ORDER BY id LIMIT 1);

INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT @exam_id, 'What is the full form of CPU?', 'Central Processing Unit', 'Computer Personal Unit', 'Central Program Unit', 'Control Processing Unit', 'A'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE exam_id=@exam_id AND question='What is the full form of CPU?');

INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT @exam_id, 'Which language is used for web styling?', 'HTML', 'CSS', 'Python', 'SQL', 'B'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE exam_id=@exam_id AND question='Which language is used for web styling?');

INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT @exam_id, 'Which one is a database?', 'HTML', 'CSS', 'MySQL', 'JavaScript', 'C'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE exam_id=@exam_id AND question='Which one is a database?');

INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT @exam_id, 'Which company originally developed JavaScript?', 'Microsoft', 'Netscape', 'Google', 'Apple', 'B'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE exam_id=@exam_id AND question='Which company originally developed JavaScript?');

INSERT INTO questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer)
SELECT @exam_id, 'Which symbol starts a single-line JavaScript comment?', '//', '##', '<!-- -->', '**', 'A'
WHERE NOT EXISTS (SELECT 1 FROM questions WHERE exam_id=@exam_id AND question='Which symbol starts a single-line JavaScript comment?');

UPDATE exams SET total_questions=(SELECT COUNT(*) FROM questions WHERE exam_id=@exam_id) WHERE id=@exam_id;
