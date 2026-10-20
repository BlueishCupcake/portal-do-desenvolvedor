import { Button, Checkbox, Input } from '@poliedro/tamentai/web';
import { useState } from 'react';

import styles from '@/components/Sprint/SprintMultiSelect.module.css';
import type { Sprint } from '@/types/sprint.ts';
import { sprintValue } from '@/utils/sprint.ts';

interface SprintMultiSelectProps {
  sprints: Sprint[];
  selected: string[];
  onChange: (sprintIds: string[]) => void;
}

function matchesQuery(name: string, query: string): boolean {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

export function SprintMultiSelect({
  sprints,
  selected,
  onChange,
}: SprintMultiSelectProps) {
  const [query, setQuery] = useState('');
  const selectedSprints = sprints.filter((sprint) =>
    selected.includes(sprintValue(sprint)),
  );
  const visibleSprints = query.trim()
    ? sprints.filter((sprint) => matchesQuery(sprint.name, query))
    : sprints;
  const summary =
    selectedSprints.length === 0
      ? 'Selecione as sprints'
      : selectedSprints.length === 1
        ? (selectedSprints[0]?.name ?? 'Sprint')
        : `${String(selectedSprints.length)} sprints selecionadas`;

  return (
    <div className={styles.field}>
      <span className={styles.label} id="sprint-multiselect-label">
        Sprint
      </span>
      <details
        className={styles.details}
        onToggle={(event) => {
          if (!event.currentTarget.open) {
            setQuery('');
          }
        }}
      >
        <summary aria-labelledby="sprint-multiselect-label" aria-label="Sprint">
          {summary}
        </summary>
        <div className={styles.menu}>
          <Input
            type="search"
            label="Buscar sprint"
            placeholder="Buscar sprint..."
            value={query}
            onChangeValue={setQuery}
          />
          <div className={styles.options}>
            {visibleSprints.map((sprint) => {
              const value = sprintValue(sprint);
              return (
                <div key={value} className={styles.option}>
                  <Checkbox
                    label={sprint.name}
                    checked={selected.includes(value)}
                    onCheckedChange={(checked) => {
                      const next =
                        checked === true
                          ? [...selected, value]
                          : selected.filter((item) => item !== value);
                      if (next.length > 0) {
                        onChange(next);
                      }
                    }}
                  />
                </div>
              );
            })}
            {visibleSprints.length === 0 ? (
              <p className={styles.empty}>Nenhuma sprint encontrada</p>
            ) : null}
          </div>
          {selected.length > 1 ? (
            <Button
              type="button"
              variant="link"
              color="primary"
              onClick={() => {
                const first = selected[0];
                if (first) {
                  onChange([first]);
                }
              }}
            >
              Manter só a primeira
            </Button>
          ) : null}
        </div>
      </details>
    </div>
  );
}
