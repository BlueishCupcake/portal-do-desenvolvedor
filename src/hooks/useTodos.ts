import { useCallback, useEffect, useState } from 'react';

import type { TodoNote } from '@/types/todo.ts';
import { createTodo, readTodos, writeTodos } from '@/utils/todosStorage.ts';

export function useTodos() {
  const [todos, setTodos] = useState<TodoNote[]>(readTodos);

  useEffect(() => {
    writeTodos(todos);
  }, [todos]);

  const addTodo = useCallback(() => {
    setTodos((current) => [...current, createTodo(current)]);
  }, []);

  const updateTodo = useCallback((id: string, text: string) => {
    setTodos((current) =>
      current.map((note) => (note.id === id ? { ...note, text } : note)),
    );
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((current) => current.filter((note) => note.id !== id));
  }, []);

  return { todos, addTodo, updateTodo, removeTodo };
}
