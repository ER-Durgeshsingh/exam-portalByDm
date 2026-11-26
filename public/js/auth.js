const msg = document.getElementById("message");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

if (registerForm) registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(registerForm));
  try {
    const res = await fetch("/api/auth/register", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
    const body = await res.json();
    msg.textContent = body.message;
    if (res.ok) setTimeout(() => location.href = "login.html", 900);
  } catch { msg.textContent = "Could not connect to server."; }
});

if (loginForm) loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm));
  try {
    const res = await fetch("/api/auth/login", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
    const body = await res.json();
    if (!res.ok) { msg.textContent = body.message; return; }
    localStorage.setItem("token", body.token);
    localStorage.setItem("user", JSON.stringify(body.user));
    location.href = body.user.role === "admin" ? "admin.html" : body.user.role === "teacher" ? "teacher.html" : "dashboard.html";
  } catch { msg.textContent = "Could not connect to server."; }
});