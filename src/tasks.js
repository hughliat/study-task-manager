export const STORAGE_KEY = 'study-task-manager:v1';
const PRIORITIES = ['normal', 'high', 'low'];

export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function normalizeFields(fields) {
  const title = String(fields.title ?? '').trim();
  const subject = String(fields.subject ?? '').trim();
  const dueDate = String(fields.dueDate ?? '');
  if (!title) throw new Error('请填写任务名称。');
  if (title.length > 100) throw new Error('任务名称最多 100 个字符。');
  if (subject.length > 30) throw new Error('学科最多 30 个字符。');
  if (dueDate && !validDate(dueDate)) throw new Error('请选择有效的截止日期。');
  if (!PRIORITIES.includes(fields.priority)) throw new Error('请选择有效的优先级。');
  return { title, subject, dueDate, priority: fields.priority };
}

export function createTask(fields, id = crypto.randomUUID(), now = new Date().toISOString()) {
  return { id, ...normalizeFields(fields), completed: false, createdAt: now };
}

export function editTask(tasks, id, fields) {
  const normalized = normalizeFields(fields);
  if (!tasks.some(task => task.id === id)) throw new Error('这个任务已不存在。');
  return tasks.map(task => task.id === id ? { ...task, ...normalized } : task);
}

export function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

export function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

export function filterTasks(tasks, status = 'all', query = '') {
  const search = query.trim().toLocaleLowerCase();
  return tasks.filter(task =>
    (status === 'all' || (status === 'completed' ? task.completed : !task.completed)) &&
    `${task.title} ${task.subject}`.toLocaleLowerCase().includes(search)
  );
}

export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function statistics(tasks, today = localDate()) {
  const completed = tasks.filter(task => task.completed).length;
  return {
    total: tasks.length,
    completed,
    remaining: tasks.length - completed,
    overdue: tasks.filter(task => !task.completed && task.dueDate && task.dueDate < today).length,
    percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0
  };
}

export function parseStoredTasks(value) {
  if (value === null) return [];
  let records;
  try { records = JSON.parse(value); } catch { throw new Error('本地数据无法读取，未覆盖原数据。'); }
  if (!Array.isArray(records)) throw new Error('本地数据格式不正确，未覆盖原数据。');
  const ids = new Set();
  return records.map(record => {
    if (!record || typeof record.id !== 'string' || !record.id || ids.has(record.id) ||
        typeof record.completed !== 'boolean' || typeof record.createdAt !== 'string' ||
        Number.isNaN(Date.parse(record.createdAt))) {
      throw new Error('本地数据包含无效任务，未覆盖原数据。');
    }
    ids.add(record.id);
    return { id: record.id, ...normalizeFields(record), completed: record.completed, createdAt: record.createdAt };
  });
}
