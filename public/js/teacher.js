const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!token || !user || !["teacher", "admin"].includes(user.role)) location.href = "login.html";
const headers = { Authorization: `Bearer ${token}` };
const jsonHeaders = { ...headers, "Content-Type": "application/json" };
const safe = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
document.getElementById("logoutBtn").onclick = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); location.href="login.html"; };
async function loadExams(){
 const res=await fetch("/api/teacher/exams",{headers}); const rows=await res.json();
 document.getElementById("teacherExams").innerHTML=res.ok?`<table><thead><tr><th>ID</th><th>Exam</th><th>Duration</th><th>Questions</th><th>Attempts</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.id}</td><td>${safe(x.title)}</td><td>${x.duration} min</td><td>${x.total_questions}</td><td>${x.attempts}</td><td>${x.is_active?'Active':'Inactive'}</td></tr>`).join("")}</tbody></table>`:safe(rows.message);
}
async function loadResults(){
 const res=await fetch("/api/teacher/results",{headers}); const rows=await res.json();
 document.getElementById("teacherResults").innerHTML=res.ok?`<table><thead><tr><th>Student</th><th>Email</th><th>Exam</th><th>Score</th><th>Warnings</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${safe(r.name)}</td><td>${safe(r.email)}</td><td>${safe(r.title)}</td><td>${r.score}/${r.total_questions}</td><td>${r.warnings}</td><td>${safe(r.status)}</td></tr>`).join("")}</tbody></table>`:safe(rows.message);
}
document.getElementById("examForm").addEventListener("submit",async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const res=await fetch("/api/teacher/exams",{method:"POST",headers:jsonHeaders,body:JSON.stringify(data)});const body=await res.json();document.getElementById("examMessage").textContent=res.ok?`${body.message} Exam ID: ${body.examId}`:body.message;if(res.ok){e.target.reset();loadExams();}});
document.getElementById("questionForm").addEventListener("submit",async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const res=await fetch("/api/teacher/questions",{method:"POST",headers:jsonHeaders,body:JSON.stringify(data)});const body=await res.json();document.getElementById("questionMessage").textContent=body.message;if(res.ok){e.target.reset();loadExams();}});
loadExams();loadResults();
