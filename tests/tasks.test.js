import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTask, editTask, toggleTask, removeTask, filterTasks, statistics, parseStoredTasks, localDate } from '../src/tasks.js';
const fields = { title: '数据库练习', subject: '数据库', dueDate: '2026-10-06', priority: 'high' };
const task = createTask(fields, 'one', '2026-10-01T00:00:00Z');

test('创建任务清理空格并默认未完成', () => {
  const actual = createTask({ ...fields, title: '  学习 SQL  ' }, 'two', '2026-10-01T00:00:00Z');
  assert.equal(actual.title, '学习 SQL'); assert.equal(actual.completed, false);
});
test('空标题、超长标题、无效日期和优先级被拒绝', () => {
  for (const patch of [{ title: '  ' }, { title: 'x'.repeat(101) }, { dueDate: '2026-02-30' }, { priority: 'urgent' }]) assert.throws(() => createTask({ ...fields, ...patch }));
});
test('编辑保留任务 ID、创建时间和完成状态，不改变原数组', () => {
  const original = [{ ...task, completed: true }];
  const updated = editTask(original, 'one', { ...fields, title: '新标题', dueDate: '' });
  assert.equal(updated[0].title, '新标题'); assert.equal(updated[0].id, 'one');
  assert.equal(updated[0].completed, true); assert.equal(updated[0].createdAt, task.createdAt);
  assert.equal(original[0].title, task.title); assert.throws(() => editTask(original, 'missing', fields));
});
test('完成切换可恢复，不影响其他任务', () => {
  const second = createTask(fields, 'two', task.createdAt);
  const toggled = toggleTask([task, second], 'one');
  assert.equal(toggled[0].completed, true); assert.equal(toggled[1].completed, false);
  assert.equal(toggleTask(toggled, 'one')[0].completed, false);
});
test('删除只移除指定任务', () => { assert.deepEqual(removeTask([task], 'one'), []); assert.deepEqual(removeTask([task], 'missing'), [task]); });
test('状态筛选与标题或学科搜索可以组合', () => {
  const list = [task, createTask({ ...fields, title: 'English', subject: '语言' }, 'two', task.createdAt)];
  list[1].completed = true;
  assert.equal(filterTasks(list, 'pending', '数据库').length, 1);
  assert.equal(filterTasks(list, 'completed', ' english ').length, 1);
  assert.equal(filterTasks(list, 'pending', 'English').length, 0);
  assert.equal(filterTasks(list, 'all', '语言').length, 1);
});
test('截止当天不算逾期，已完成任务不计逾期', () => {
  const old = { ...task, id: 'old', dueDate: '2026-10-05' };
  const done = { ...old, id: 'done', completed: true };
  assert.deepEqual(statistics([task, old, done], '2026-10-06'), { total: 3, remaining: 2, completed: 1, overdue: 1, percent: 33 });
  assert.equal(statistics([], '2026-10-06').percent, 0);
});
test('持久化往返保留任务，无数据时为空', () => { assert.deepEqual(parseStoredTasks(JSON.stringify([task])), [task]); assert.deepEqual(parseStoredTasks(null), []); });
test('损坏数据、重复 ID 与不合法完成状态不会静默覆盖', () => {
  for (const raw of ['bad json', '{}', JSON.stringify([task, task]), JSON.stringify([{ ...task, completed: 'yes' }])]) assert.throws(() => parseStoredTasks(raw));
});
test('任务名称中的 HTML 当作普通文本保留', () => {
  const html = '<img src=x onerror=alert(1)>';
  assert.equal(createTask({ ...fields, title: html }, 'safe', task.createdAt).title, html);
});
test('本地日期使用当地年月日，不切换到 UTC 日界', () => {
  const date = new Date(2026, 9, 6, 0, 1);
  assert.equal(localDate(date), '2026-10-06');
});
