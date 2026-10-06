import { useEffect, useState } from 'react';

import {
  readTodos,
  TODOS_CHANGED_EVENT,
  TODOS_STORAGE_KEY,
} from '@/utils/todosStorage.ts';

export function useTodoCount(): number {
  const [count, setCount] = useState(() => readTodos().length);

  useEffect(() => {
    function updateCount() {
      setCount(readTodos().length);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === TODOS_STORAGE_KEY) {
        updateCount();
      }
    }

    window.addEventListener(TODOS_CHANGED_EVENT, updateCount);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(TODOS_CHANGED_EVENT, updateCount);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return count;
}
