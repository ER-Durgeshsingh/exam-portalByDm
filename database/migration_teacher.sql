-- Run this ONCE on an existing mcq_anticheat database.
USE mcq_anticheat;
ALTER TABLE users MODIFY role ENUM('student','teacher','admin') DEFAULT 'student';
ALTER TABLE exams ADD COLUMN created_by INT NULL;
ALTER TABLE exams ADD CONSTRAINT fk_exams_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
