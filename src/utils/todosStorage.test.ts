import { describe, expect, it } from 'vitest';

import {
  createTodo,
  noteTilt,
  readTodos,
  TODOS_STORAGE_KEY,
  writeTodos,
} from '@/utils/todosStorage.ts';

describe('todosStorage', () => {
  it('reads an empty list when storage is empty or invalid', () => {
    expect(readTodos()).toEqual([]);

    window.localStorage.setItem(TODOS_STORAGE_KEY, '{not-json');
    expect(readTodos()).toEqual([]);
  });

  it('writes and reads valid notes only', () => {
    const note = createTodo([]);
    writeTodos([note, { id: 1 } as never]);

    expect(readTodos()).toEqual([note]);
    expect(noteTilt(note.id)).toBeGreaterThanOrEqual(-3);
    expect(noteTilt(note.id)).toBeLessThanOrEqual(3);
  });
});
