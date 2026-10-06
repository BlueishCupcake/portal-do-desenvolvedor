import { Button, ButtonIcon, TitleV2 } from '@poliedro/tamentai/web';
import type { CSSProperties } from 'react';

import { EmptyState } from '@/components/EmptyState/EmptyState.tsx';
import styles from '@/components/Todos/TodosBoard.module.css';
import { useTodos } from '@/hooks/useTodos.ts';
import { noteTilt } from '@/utils/todosStorage.ts';

export function TodosBoard() {
  const { todos, addTodo, updateTodo, removeTodo } = useTodos();

  return (
    <section className={styles.board} aria-label="To Do's">
      <div className={styles.toolbar}>
        <TitleV2 variant="h2">To Do&apos;s</TitleV2>
        <Button type="button" color="primary" onClick={addTodo}>
          Novo post-it
        </Button>
      </div>
      {todos.length === 0 ? (
        <EmptyState
          title="Nenhum post-it ainda"
          message="Crie um post-it para anotar to-dos da sprint."
        />
      ) : (
        <ul className={styles.grid}>
          {todos.map((note, index) => (
            <li key={note.id}>
              <article
                className={styles.note}
                data-color={note.color}
                style={{ '--tilt': noteTilt(note.id) } as CSSProperties}
                aria-label={`Post-it ${String(index + 1)}`}
              >
                <div className={styles.header}>
                  <ButtonIcon
                    type="button"
                    variant="ghost"
                    color="secondary"
                    icon="X"
                    aria-label={
                      note.text.trim()
                        ? `Excluir post-it ${note.text}`
                        : `Excluir post-it ${String(index + 1)}`
                    }
                    onClick={() => {
                      removeTodo(note.id);
                    }}
                  />
                </div>
                <textarea
                  className={styles.text}
                  value={note.text}
                  placeholder="Escreva um to-do..."
                  aria-label={`Texto do post-it ${String(index + 1)}`}
                  onChange={(event) => {
                    updateTodo(note.id, event.target.value);
                  }}
                />
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
