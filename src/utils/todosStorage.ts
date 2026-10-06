import type { TodoNote } from '@/types/todo.ts';

export const TODOS_STORAGE_KEY = 'portal-todos';
export const TODOS_CHANGED_EVENT = 'portal-todos-changed';

function isTodoNote(value: unknown): value is TodoNote {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const note = value as Partial<TodoNote>;
  return (
    typeof note.id === 'string' &&
    typeof note.text === 'string' &&
    typeof note.color === 'number' &&
    typeof note.createdAt === 'string'
  );
}

export function readTodos(): TodoNote[] {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(TODOS_STORAGE_KEY) ?? '[]',
    );
    return Array.isArray(parsed) ? parsed.filter(isTodoNote) : [];
  } catch {
    return [];
  }
}

export function writeTodos(todos: readonly TodoNote[]): void {
  window.localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  window.dispatchEvent(
    new CustomEvent<number>(TODOS_CHANGED_EVENT, { detail: todos.length }),
  );
}

export function createTodo(existing: readonly TodoNote[]): TodoNote {
  return {
    id: crypto.randomUUID(),
    text: '',
    color: existing.length % 4,
    createdAt: new Date().toISOString(),
  };
}

export function noteTilt(id: string): number {
  const hash = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return (hash % 7) - 3;
}
