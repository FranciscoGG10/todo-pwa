// app.js - ToDo PWA mejorada con editar, filtros y tema
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const installBtn = document.getElementById('installBtn');
const themeToggle = document.getElementById('themeToggle');
const filters = document.querySelectorAll('.filter');
const leftCount = document.getElementById('leftCount');
const clearCompleted = document.getElementById('clearCompleted');

let tasks = []; // { id, text, done }
const STORAGE_KEY = 'todo-pwa-tasks-v2';
const THEME_KEY = 'todo-pwa-theme-v1';

// --- Persistencia ---
function loadTasks(){ try { const raw = localStorage.getItem(STORAGE_KEY); tasks = raw ? JSON.parse(raw) : []; } catch(e){ tasks = []; } }
function saveTasks(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }

// --- Theme ---
function loadTheme(){
  const t = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(t);
}
function setTheme(t){
  if(t === 'dark'){ document.body.classList.remove('theme-light'); document.body.classList.add('theme-dark'); themeToggle.textContent = '☀️'; }
  else { document.body.classList.remove('theme-dark'); document.body.classList.add('theme-light'); themeToggle.textContent = '🌙'; }
  localStorage.setItem(THEME_KEY, t);
}
themeToggle.addEventListener('click', ()=> {
  const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
  setTheme(next);
});

// --- Render ---
let currentFilter = 'all';
function render(){
  taskList.innerHTML = '';
  const filtered = tasks.filter(t => currentFilter === 'all' ? true : (currentFilter === 'active' ? !t.done : t.done));
  if(filtered.length === 0){
    const el = document.createElement('div');
    el.style.opacity = '0.7';
    el.textContent = 'No hay tareas en esta vista.';
    taskList.appendChild(el);
  } else {
    filtered.forEach(t => {
      const row = document.createElement('div');
      row.className = 'task' + (t.done ? ' completed' : '');

      const chk = document.createElement('div');
      chk.className = 'checkbox';
      chk.setAttribute('role','button');
      chk.title = t.done ? 'Marcar como no hecha' : 'Marcar como hecha';
      chk.addEventListener('click', () => toggleDone(t.id));
      chk.innerHTML = t.done ? '✔' : '';

      const txt = document.createElement('div');
      txt.className = 'text';
      txt.textContent = t.text;
      txt.title = 'Doble clic para editar';
      txt.addEventListener('dblclick', () => startEdit(t.id, txt));

      const editBtn = document.createElement('button');
      editBtn.className = 'action-btn';
      editBtn.title = 'Editar';
      editBtn.innerHTML = '✏️';
      editBtn.addEventListener('click', () => startEdit(t.id, txt));

      const rem = document.createElement('button');
      rem.className = 'action-btn';
      rem.title = 'Eliminar';
      rem.innerHTML = '🗑';
      rem.addEventListener('click', () => removeTask(t.id));

      row.appendChild(chk);
      row.appendChild(txt);
      row.appendChild(editBtn);
      row.appendChild(rem);

      taskList.appendChild(row);
    });
  }
  updateCounts();
}

function updateCounts(){
  const left = tasks.filter(t => !t.done).length;
  leftCount.textContent = left + (left === 1 ? ' pendiente' : ' pendientes');
}

// --- Acciones ---
function addTask(text){
  const t = text.trim();
  if(!t) return;
  tasks.unshift({ id: Date.now().toString(), text: t, done: false });
  saveTasks();
  render();
  taskInput.value = '';
  taskInput.focus();
}

function toggleDone(id){
  const idx = tasks.findIndex(x=>x.id===id);
  if(idx >= 0){ tasks[idx].done = !tasks[idx].done; saveTasks(); render(); }
}

function removeTask(id){
  tasks = tasks.filter(x=>x.id!==id);
  saveTasks();
  render();
}

function startEdit(id, txtEl){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = t.text;
  input.className = 'edit-input';
  input.style.width = '100%';
  txtEl.replaceWith(input);
  input.focus();
  input.select();

  function finish(save){
    if(save){
      const v = input.value.trim();
      if(v) t.text = v;
    }
    saveTasks();
    render();
  }

  input.addEventListener('blur', () => finish(true));
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') finish(true);
    if(e.key === 'Escape') finish(false);
  });
}

// --- Filters ---
filters.forEach(f => f.addEventListener('click', () => {
  filters.forEach(x=>x.classList.remove('active'));
  f.classList.add('active');
  currentFilter = f.dataset.filter;
  render();
}));

clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  saveTasks();
  render();
});

// --- Eventos DOM ---
addBtn.addEventListener('click', ()=> addTask(taskInput.value));
taskInput.addEventListener('keydown', (e)=> { if(e.key === 'Enter') addTask(taskInput.value); });

// --- Inicializar ---
loadTasks();
loadTheme();
render();

// --- Instalación PWA: mostrar botón de instalación ---
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('Resultado prompt instalacion:', outcome);
  installBtn.hidden = true;
  deferredPrompt = null;
});
window.addEventListener('appinstalled', () => {
  console.log('Aplicación instalada');
  installBtn.hidden = true;
});
