const result = JSON.parse(sessionStorage.getItem("lastResult") || "null");
const box = document.getElementById("resultBox");
if (!result) box.textContent = "No recent result found. Go to your dashboard.";
else box.innerHTML = `<h2>${escapeHtml(result.title)}</h2><p class="score">${result.score} / ${result.total} marks</p><p>Browser activity warnings: ${result.warnings}</p><p>${result.message || "Your result has been saved."}</p>`;
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }