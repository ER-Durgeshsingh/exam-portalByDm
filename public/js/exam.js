const token = localStorage.getItem("token");
const attempt = JSON.parse(sessionStorage.getItem("currentExam") || "null");
if (!token || !attempt) location.href = "login.html";
const answers = {};
let warnings = 0;
let remaining = attempt ? attempt.exam.duration * 60 : 0;
let submitted = false;
const area = document.getElementById("questionArea");
const message = document.getElementById("examMessage");

if (attempt) {
  area.innerHTML = attempt.questions.map((q, i) => `<section class="question"><h3>${i+1}. ${escapeHtml(q.question)}</h3>${["A","B","C","D"].map((letter)=>`<label class="option"><input type="radio" name="q${q.id}" value="${letter}"> ${letter}. ${escapeHtml(q["option_"+letter.toLowerCase()])}</label>`).join("")}</section>`).join("");
  area.addEventListener("change", e => {
    if (e.target.matches('input[type="radio"]')) answers[e.target.name.slice(1)] = e.target.value;
  });
  updateTimer();
  const timerId = setInterval(() => {
    if (submitted) return clearInterval(timerId);
    remaining--;
    updateTimer();
    if (remaining <= 0) submitExam("Time is up. Your test was submitted.");
  }, 1000);
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function updateTimer() {
  document.getElementById("timer").textContent = `Time: ${String(Math.floor(remaining/60)).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`;
  document.getElementById("warningCount").textContent = `Warnings: ${warnings}/3`;
}
async function recordWarning(activity) {
  if (submitted) return;
  try {
    const res = await fetch(`/api/exams/attempt/${attempt.attemptId}/warning`, {
      method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body:JSON.stringify({activity})
    });
    const data = await res.json();
    if (!res.ok) return;
    warnings = data.warnings;
    updateTimer();
    alert(`Warning ${warnings}/3: ${activity}`);
    if (data.autoSubmit) submitExam("Three browser activity warnings were recorded. Test auto-submitted.");
  } catch { message.textContent = "Could not save warning. Check your connection."; }
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) recordWarning("Student switched tab or minimized browser");
});
window.addEventListener("blur", () => {
  // visibilitychange is the primary signal; blur alone is not counted to avoid duplicate alerts.
});
document.getElementById("submitExam").addEventListener("click", () => {
  if (confirm("Are you sure you want to submit the test?")) submitExam("Test submitted.");
});
async function submitExam(reason) {
  if (submitted) return;
  submitted = true;
  document.getElementById("submitExam").disabled = true;
  try {
    const res = await fetch(`/api/exams/attempt/${attempt.attemptId}/submit`, {
      method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
      body:JSON.stringify({answers})
    });
    const data = await res.json();
    if (!res.ok) { message.textContent = data.message; submitted = false; return; }
    sessionStorage.setItem("lastResult", JSON.stringify({...data, warnings, title:attempt.exam.title}));
    sessionStorage.removeItem("currentExam");
    location.href = "result.html";
  } catch {
    message.textContent = "Submission failed. Please check your internet/server and try again.";
    submitted = false;
    document.getElementById("submitExam").disabled = false;
  }
}
