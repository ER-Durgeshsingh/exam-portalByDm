const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");
if (!token || !user) location.href = "login.html";
document.getElementById("welcome").textContent = user ? `Hi, ${user.name}` : "";
document.getElementById("logout").onclick = () => { localStorage.clear(); location.href = "login.html"; };

async function loadDashboard() {
  const headers = { Authorization: `Bearer ${token}` };
  const examRes = await fetch("/api/exams", { headers });
  if (examRes.status === 401) { localStorage.clear(); location.href = "login.html"; return; }
  const exams = await examRes.json();
  const list = document.getElementById("examList");
  list.innerHTML = exams.length ? exams.map(e => `<article class="exam-card"><h3>${escapeHtml(e.title)}</h3><p>${e.total_questions} questions · ${e.duration} minutes</p><button class="btn" onclick="startExam(${e.id})">Start exam</button></article>`).join("") : '<div class="empty">No active exams are available.</div>';
  const resultRes = await fetch("/api/exams/results/mine", { headers });
  const results = await resultRes.json();
  document.getElementById("results").innerHTML = results.length ? `<table><thead><tr><th>Exam</th><th>Score</th><th>Warnings</th><th>Status</th></tr></thead><tbody>${results.map(r=>`<tr><td>${escapeHtml(r.title)}</td><td>${r.score}/${r.total_questions}</td><td>${r.warnings}</td><td>${r.status}</td></tr>`).join("")}</tbody></table>` : '<div class="empty">No attempts yet.</div>';
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
async function startExam(id) {
  const res = await fetch(`/api/exams/${id}/start`, { method:"POST", headers:{Authorization:`Bearer ${token}`} });
  const body = await res.json();
  if (!res.ok) return alert(body.message);
  sessionStorage.setItem("currentExam", JSON.stringify(body));
  location.href = "exam.html";
}
loadDashboard().catch(() => alert("Unable to load dashboard."));
