import { STORAGE_KEY, createTask, editTask, toggleTask, removeTask, filterTasks, statistics, parseStoredTasks, localDate } from './tasks.js';

const $ = id => document.getElementById(id);
let tasks = [], filter = 'all', editingId = null, pendingDeleteId = null, storageHealthy = true;
let toastTimer;
const warning = message => { $('storage-warning').textContent = message; $('storage-warning').hidden = false; };
try { tasks = parseStoredTasks(localStorage.getItem(STORAGE_KEY)); }
catch (error) { storageHealthy = false; warning(`${error.message} 为保护已有数据，编辑已停用。请备份浏览器中的本地数据后修复，勿直接清除存储。`); }

function notify(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3000);
}
function save(nextTasks, message) {
  if (!storageHealthy) { notify('本地存储异常，暂时无法编辑。'); return false; }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks)); }
  catch { warning('保存失败，任务未修改。浏览器存储可能已满或被禁用，请先释放空间或允许本地存储。'); notify('未保存，请稍后重试。'); return false; }
  tasks = nextTasks;
  render();
  notify(message);
  return true;
}
function resetForm() {
  editingId = null;
  $('task-form').reset();
  $('form-title').textContent = '下一个小目标';
  $('submit-task').textContent = '＋ 添加到清单';
  $('cancel-edit').hidden = true;
  $('form-error').hidden = true;
}
function focusForm() { resetForm(); $('title').scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); $('title').focus({ preventScroll: true }); }
function startEdit(task) {
  editingId = task.id;
  $('title').value = task.title;
  $('subject').value = task.subject;
  $('due-date').value = task.dueDate;
  $('priority').value = task.priority;
  $('form-title').textContent = '调整这个小目标';
  $('submit-task').textContent = '保存修改';
  $('cancel-edit').hidden = false;
  $('form-error').hidden = true;
  $('title').scrollIntoView({ block: 'center' });
  $('title').focus({ preventScroll: true });
}
function render() {
  const today = localDate();
  const stats = statistics(tasks, today);
  $('remaining-count').textContent = stats.remaining;
  $('overdue-count').textContent = stats.overdue;
  $('total-count').textContent = stats.total;
  $('filter-all').textContent = stats.total;
  $('filter-pending').textContent = stats.remaining;
  $('filter-completed').textContent = stats.completed;
  $('progress-percent').textContent = `${stats.percent}%`;
  $('progress-text').textContent = stats.total ? `已完成 ${stats.completed} / ${stats.total} 项任务，按自己的节奏来。` : '从你的第一个小目标开始。';
  $('progress-fill').style.width = `${stats.percent}%`;
  $('progress-fill').parentElement.setAttribute('aria-valuenow', stats.percent);
  $('progress-ring').style.background = `conic-gradient(#65885c ${stats.percent * 3.6}deg, #d6e2cd 0deg)`;
  const visible = filterTasks(tasks, filter, $('search').value);
  $('task-list').replaceChildren();
  for (const task of visible) {
    const row = $('task-template').content.firstElementChild.cloneNode(true);
    row.dataset.id = task.id;
    row.classList.toggle('completed', task.completed);
    const checkbox = row.querySelector('.task-check');
    checkbox.checked = task.completed;
    checkbox.disabled = !storageHealthy;
    checkbox.setAttribute('aria-label', `${task.completed ? '标为未完成' : '完成任务'}：${task.title}`);
    checkbox.addEventListener('change', () => { if (!save(toggleTask(tasks, task.id), task.completed ? '任务已恢复为待完成。' : '又完成一步，做得不错。')) checkbox.checked = task.completed; });
    row.querySelector('.task-title').textContent = task.title;
    const subject = row.querySelector('.subject-tag');
    subject.textContent = task.subject || '未分类';
    const due = row.querySelector('.due-label');
    const overdue = !task.completed && task.dueDate && task.dueDate < today;
    due.classList.toggle('overdue', !!overdue);
    due.textContent = task.dueDate ? `${task.dueDate.slice(5).replace('-', '月')}日${overdue ? ' · 已逾期' : task.dueDate === today ? ' · 今天截止' : '截止'}` : '无截止日期';
    const priority = row.querySelector('.priority-tag');
    priority.textContent = { high: '● 重要', normal: '● 普通', low: '● 低优先级' }[task.priority];
    priority.classList.toggle('high', task.priority === 'high');
    row.querySelector('.edit-button').setAttribute('aria-label', `编辑：${task.title}`);
    row.querySelector('.edit-button').disabled = !storageHealthy;
    row.querySelector('.edit-button').addEventListener('click', () => startEdit(task));
    row.querySelector('.delete-button').setAttribute('aria-label', `删除：${task.title}`);
    row.querySelector('.delete-button').disabled = !storageHealthy;
    row.querySelector('.delete-button').addEventListener('click', () => {
      pendingDeleteId = task.id;
      $('delete-description').textContent = `“${task.title}”将从清单中移除。此操作无法撤销。`;
      $('delete-dialog').showModal();
    });
    $('task-list').append(row);
  }
  $('empty-state').hidden = visible.length > 0;
  $('empty-title').textContent = !tasks.length ? '给学习一个小小的开始' : '这里暂时没有任务';
  $('empty-description').textContent = !tasks.length ? '添加一项任务，把下一步变得清楚。' : $('search').value ? '试试其他关键词，或切换筛选条件。' : filter === 'completed' ? '完成一项任务，它就会出现在这里。' : '清单已经处理完了，给自己一点休息。';
  $('empty-add').hidden = tasks.length > 0 || !storageHealthy;
  $('visible-count').textContent = `显示 ${visible.length} 项 · 共 ${stats.total} 项任务`;
}
$('task-form').addEventListener('submit', event => {
  event.preventDefault();
  const fields = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const next = editingId ? editTask(tasks, editingId, fields) : [createTask(fields), ...tasks];
    if (save(next, editingId ? '修改已保存。' : '任务已加入清单。')) resetForm();
  } catch (error) { $('form-error').textContent = error.message; $('form-error').hidden = false; }
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  render();
}));
$('search').addEventListener('input', render);
$('cancel-edit').addEventListener('click', resetForm);
$('focus-form').addEventListener('click', focusForm);
$('empty-add').addEventListener('click', focusForm);
$('dismiss-delete').addEventListener('click', () => $('delete-dialog').close());
$('delete-dialog').addEventListener('close', () => { pendingDeleteId = null; });
$('confirm-delete').addEventListener('click', () => {
  if (!pendingDeleteId) return;
  if (save(removeTask(tasks, pendingDeleteId), '任务已删除。')) {
    if (editingId === pendingDeleteId) resetForm();
    $('delete-dialog').close();
  }
});
if (!storageHealthy) Array.from($('task-form').elements).forEach(field => { field.disabled = true; });
function refreshDate() { $('today').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date()); render(); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });
setInterval(refreshDate, 60000);
refreshDate();
