# Smart MCQ Examination System with Anti-Cheating

Beginner-friendly student project using HTML, CSS, JavaScript, Node.js, Express and MySQL.

## Features
- Student registration and login (passwords are hashed with bcrypt).
- Active MCQ test list, timed test, scoring and result history.
- Tab switching / browser minimization visibility warnings.
- Warning count is stored in MySQL; at 3 warnings the test auto-submits.
- Admin results view and add-question form.

**Important limitation:** A browser page can detect `document.visibilitychange` (for example, tab switching or minimizing). It cannot reliably prove cheating, detect every device, or stop all forms of cheating. Treat warnings as review indicators, not proof. This starter project does not include webcam or Python AI.

## Requirements
- Node.js LTS and npm
- MySQL Server (Workbench is only the GUI)
- VS Code

## Setup on Windows / VS Code

1. Extract `mcq-anticheat.zip` to `D:\\2k26\\mcq-anticheat`.
2. Open VS Code > File > Open Folder and select that folder.
3. Open Terminal > New Terminal.
4. Install packages:
   ```powershell
   npm install
   ```
5. In MySQL Workbench, connect to your local MySQL Server. Open `database/schema.sql`, select all, and click the lightning bolt to execute. This creates the database, tables, a sample exam and five questions.
6. In VS Code, copy `.env.example` and name the copy `.env`. Set `DB_PASSWORD` to your MySQL root password. If your MySQL root account has no password, leave it empty:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_actual_password
   DB_NAME=mcq_anticheat
   JWT_SECRET=use_a_long_random_secret
   PORT=3000
   ```
7. Start the server:
   ```powershell
   npm run dev
   ```
   Or use `npm start`.
8. Open http://localhost:3000 in Chrome or Edge.

## Test the project
1. Register a student account.
2. Log in; dashboard should show "Computer Fundamentals Test".
3. Start the test, answer questions and submit.
4. To test warnings, switch to another browser tab and return. Three visibility warnings submit the exam.
5. Check results in the student dashboard.

## Create an admin account
1. Register normally through the website.
2. In MySQL Workbench run:
   ```sql
   USE mcq_anticheat;
   UPDATE users SET role='admin' WHERE email='your-admin-email@example.com';
   ```
3. Log out and log in again. The admin account opens `admin.html`.
4. Admin can view all attempts and add questions to an existing exam (use its numeric ID).

## Troubleshooting
- `Access denied for user 'root'`: check `DB_USER` and `DB_PASSWORD` in `.env`.
- `Unknown database 'mcq_anticheat'`: execute `database/schema.sql` in Workbench.
- `ECONNREFUSED 127.0.0.1:3306`: start the MySQL Server service; Workbench alone is not the database server.
- `npm is not recognized`: install Node.js LTS, close and reopen VS Code, then check `node -v` and `npm -v`.
- Port 3000 busy: change `PORT=3001` in `.env` and open http://localhost:3001.
- If the browser shows an error, inspect the VS Code terminal for the server message.

## Python AI
Python AI is intentionally not part of this basic version. The selected project level uses browser tab-visibility warnings and does not require Python. A later version can add optional OpenCV webcam-based face-presence checks with clear student consent.

## Teacher aur Admin roles (updated build)
- Student registration public hai. Teacher account ko pehle normal registration page se banayein, phir Admin Dashboard ke Users section se uska role `teacher` set karein.
- Role change ke baad teacher ko logout karke dobara login karna hoga.
- Teacher: apne exams create karega, apne exams mein MCQ add karega aur apne exams ke student results dekhega.
- Admin: all users ke roles manage/delete, all exams activate/deactivate, kisi bhi exam mein question add, exam create aur all student results dekh sakta hai.
- Sab roles same `login.html` se login karte hain. Login ke baad role ke hisaab se page open hota hai.

### Existing database ko update karna
Agar aapne pehle `schema.sql` run kar diya hai, MySQL Workbench mein `database/migration_teacher.sql` ko open karke execute karein. Is migration ko sirf ek baar run karein. Fresh database ke liye updated `schema.sql` use karein.


## Admin se Teacher account banana
1. Admin account se `admin.html` mein login karein.
2. `Create teacher account` form mein teacher ka naam, email/Login ID aur initial password (minimum 8 characters) set karein.
3. `Create teacher account` click karein. Account direct `teacher` role ke saath banega; student role change karne ki zarurat nahi.
4. Teacher ko login email aur initial password securely dein. Teacher `login.html` par in credentials se login karega aur Teacher Dashboard khulega.
5. Password ko plain text mein kahin save/share na karein; teacher ko first login ke baad password change karne ki salah dein. (Password-change feature alag se add karna hoga.)
