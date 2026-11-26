const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!token || !user || user.role !== 'admin') location.href = 'login.html';
const headers = { Authorization: `Bearer ${token}` };
const jsonHeaders = { ...headers, 'Content-Type': 'application/json' };
const $ = id => document.getElementById(id);
const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = value => Number(value || 0).toLocaleString('en-IN');
let usersData = [], examsData = [], resultsData = [];

const displayName = user.name || 'Admin';
$('adminName').textContent = displayName;
$('welcomeName').textContent = displayName.split(' ')[0];
$('adminEmail').textContent = user.email || 'Administrator';
$('adminAvatar').textContent = displayName.charAt(0).toUpperCase();
$('todayLabel').textContent = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
$('topAvatar')?.textContent;
$('logoutBtn').addEventListener('click', () => { localStorage.removeItem('token'); localStorage.removeItem('user'); location.href = 'login.html'; });
$('menuBtn').addEventListener('click', () => $('adminSidebar').classList.toggle('open'));
document.querySelectorAll('.side-link[href^="#"]').forEach(link => link.addEventListener('click', () => {
  document.querySelectorAll('.side-link').forEach(item => item.classList.remove('active'));
  link.classList.add('active'); $('adminSidebar').classList.remove('open');
}));
$('sideSearch').addEventListener('input', e => {
  const query = e.target.value.trim().toLowerCase();
  document.querySelectorAll('.side-link').forEach(link => link.hidden = query && !link.textContent.toLowerCase().includes(query));
});

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: options.body ? jsonHeaders : headers });
  let data;
  try { data = await response.json(); } catch { data = { message: 'Unexpected server response.' }; }
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
function message(id, text, error = false) { const el = $(id); el.textContent = text; el.classList.toggle('error', error); }
function emptyRow(cols, text) { return `<tr><td colspan="${cols}" class="empty-cell">${safe(text)}</td></tr>`; }

async function loadUsers() {
  try {
    usersData = await api('/api/admin/users');
    $('userCountPill').textContent = `${usersData.length} users`;
    $('userCountPill').setAttribute('aria-label', `${usersData.length} users`);
    $('studentCount').textContent = number(usersData.filter(u => u.role === 'student').length);
    $('teacherCount').textContent = number(usersData.filter(u => u.role === 'teacher').length);
    $('adminUsers').innerHTML = `<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Update role</th><th>Action</th></tr></thead><tbody>${usersData.length ? usersData.map(u => `<tr><td><b>${safe(u.name)}</b></td><td>${safe(u.email)}</td><td><span class="role-badge ${safe(u.role)}">${safe(u.role)}</span></td><td><select aria-label="Role for ${safe(u.name)}" id="role-${u.id}"><option value="student" ${u.role==='student'?'selected':''}>Student</option><option value="teacher" ${u.role==='teacher'?'selected':''}>Teacher</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select> <button class="btn roleBtn" data-id="${u.id}">Save</button></td><td><button class="btn deleteBtn" data-id="${u.id}">Delete</button></td></tr>`).join('') : emptyRow(5, 'No users registered yet.')}</tbody></table>`;
    document.querySelectorAll('.roleBtn').forEach(button => button.addEventListener('click', async () => {
      const id = button.dataset.id; button.disabled = true;
      try { const result = await api(`/api/admin/users/${id}/role`, {method:'PATCH', body:JSON.stringify({role:$(`role-${id}`).value})}); alert(result.message); await loadUsers(); }
      catch (error) { alert(error.message); } finally { button.disabled = false; }
    }));
    document.querySelectorAll('.deleteBtn').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Delete this user and their attempt history? This cannot be undone.')) return;
      button.disabled = true;
      try { const result = await api(`/api/admin/users/${button.dataset.id}`, {method:'DELETE'}); alert(result.message); await Promise.all([loadUsers(), loadResults()]); }
      catch (error) { alert(error.message); } finally { button.disabled = false; }
    }));
  } catch (error) { $('adminUsers').textContent = error.message; }
}
async function loadExams() {
  try {
    examsData = await api('/api/admin/exams');
    $('examCount').textContent = number(examsData.length);
    $('activeExamCount').textContent = number(examsData.filter(e => !!e.is_active).length);
    $('questionCount').textContent = number(examsData.reduce((sum, e) => sum + Number(e.total_questions || 0), 0));
    $('adminExams').innerHTML = `<table><thead><tr><th>ID</th><th>Examination</th><th>Teacher</th><th>Questions</th><th>Status</th><th>Action</th></tr></thead><tbody>${examsData.length ? examsData.map(exam => `<tr><td>#${exam.id}</td><td><b>${safe(exam.title)}</b><small class="sub-cell">${Number(exam.duration)} min</small></td><td>${safe(exam.teacher || 'Admin / unassigned')}</td><td>${number(exam.total_questions)}</td><td><span class="status-badge ${exam.is_active?'active':'inactive'}">${exam.is_active?'Active':'Inactive'}</span></td><td><button class="btn statusBtn" data-id="${exam.id}" data-active="${exam.is_active?0:1}">${exam.is_active?'Deactivate':'Activate'}</button></td></tr>`).join('') : emptyRow(6, 'No examinations created yet.')}</tbody></table>`;
    document.querySelectorAll('.statusBtn').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { const result = await api(`/api/admin/exams/${button.dataset.id}/status`, {method:'PATCH', body:JSON.stringify({is_active:button.dataset.active === '1'})}); alert(result.message); await loadExams(); }
      catch (error) { alert(error.message); } finally { button.disabled = false; }
    }));
    renderActivity();
  } catch (error) { $('adminExams').textContent = error.message; }
}
async function loadResults() {
  try {
    resultsData = await api('/api/admin/results');
    const submitted = resultsData.filter(r => r.status === 'submitted');
    const percentages = submitted.map(r => Number(r.total_questions) > 0 ? (Number(r.score) / Number(r.total_questions)) * 100 : 0);
    const average = percentages.length ? Math.round(percentages.reduce((a,b)=>a+b,0) / percentages.length) : 0;
    const passed = percentages.filter(p => p >= 50).length;
    $('averageScore').textContent = percentages.length ? `${average}%` : '—';
    $('passedCount').textContent = number(passed);
    $('belowCount').textContent = number(percentages.length - passed);
    $('submittedCount').textContent = number(submitted.length);
    $('scoreRing').style.background = `conic-gradient(#8057eb ${average * 3.6}deg,#eeeaf8 ${average * 3.6}deg 360deg)`;
    $('performanceNote').textContent = submitted.length ? `Average score is calculated from ${submitted.length} submitted attempt${submitted.length===1?'':'s'}.` : 'Performance updates when students submit exams.';
    $('adminResults').innerHTML = `<table id="resultsTable"><thead><tr><th>Student</th><th>Email</th><th>Exam</th><th>Score</th><th>Warnings</th><th>Status</th><th>Submitted</th></tr></thead><tbody>${resultsData.length ? resultsData.slice(0,100).map(r => { const pct = Number(r.total_questions)>0 ? Math.round(Number(r.score)/Number(r.total_questions)*100) : 0; return `<tr><td><b>${safe(r.name)}</b></td><td>${safe(r.email)}</td><td>${safe(r.title)}</td><td><span class="score-pill">${number(r.score)}/${number(r.total_questions)} (${pct}%)</span></td><td><span class="warning-pill">${number(r.warnings)}</span></td><td><span class="status-badge ${r.status==='submitted'?'active':'inactive'}">${safe(r.status)}</span></td><td>${r.submitted_at ? safe(new Date(r.submitted_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})) : '—'}</td></tr>`; }).join('') : emptyRow(7, 'No student attempts found yet.')}</tbody></table>`;
  } catch (error) { $('adminResults').textContent = error.message; }
}
function renderActivity() {
  const list = [...examsData].slice(0,8).reverse();
  if (!list.length) { $('activityChart').innerHTML = '<div class="chart-empty">Create an exam to see activity here.</div>'; return; }
  const max = Math.max(1, ...list.map(e => Number(e.total_questions || 0)));
  $('activityChart').innerHTML = list.map(exam => {
    const questionHeight = Math.max(4, Number(exam.total_questions || 0) / max * 100);
    return `<div class="activity-column" title="${safe(exam.title)}: ${number(exam.total_questions)} questions"><i style="height:${Math.max(10, questionHeight * .72)}%"></i><i style="height:${questionHeight}%"></i><small>${safe(`#${exam.id}`)}</small></div>`;
  }).join('');
}
$('teacherForm').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); button.disabled = true;
  try { const data = await api('/api/admin/teachers', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(form)))}); message('teacherMessage', `${data.message} Teacher ID: ${data.teacher.id}. Login: ${data.teacher.email}. Share the initial password securely.`); form.reset(); await loadUsers(); }
  catch (error) { message('teacherMessage', error.message, true); } finally { button.disabled = false; }
});
$('examForm').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); button.disabled = true;
  try { const data = await api('/api/admin/exams', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(form)))}); message('examMessage', `${data.message} Exam ID: ${data.examId}. Add questions using this ID below.`); form.reset(); await loadExams(); }
  catch (error) { message('examMessage', error.message, true); } finally { button.disabled = false; }
});
$('questionForm').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); button.disabled = true;
  try { const data = await api('/api/admin/questions', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(form)))}); message('questionMessage', data.message); form.reset(); await loadExams(); }
  catch (error) { message('questionMessage', error.message, true); } finally { button.disabled = false; }
});
Promise.all([loadUsers(), loadExams(), loadResults()]);
