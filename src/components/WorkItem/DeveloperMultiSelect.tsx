import { Button, Checkbox } from '@poliedro/tamentai/web';

import styles from '@/components/WorkItem/DeveloperMultiSelect.module.css';

interface DeveloperMultiSelectProps {
  developers: string[];
  selected: string[];
  onChange: (developers: string[]) => void;
}

export function DeveloperMultiSelect({
  developers,
  selected,
  onChange,
}: DeveloperMultiSelectProps) {
  const summary =
    selected.length === 0
      ? 'Todos os desenvolvedores'
      : selected.length === 1
        ? selected[0]
        : `${String(selected.length)} desenvolvedores selecionados`;

  return (
    <div className={styles.field}>
      <span className={styles.label}>Desenvolvedores</span>
      <details className={styles.details}>
        <summary>{summary}</summary>
        <div className={styles.menu}>
          <div className={styles.options}>
            {developers.map((developer) => (
              <Checkbox
                key={developer}
                label={developer}
                checked={selected.includes(developer)}
                onCheckedChange={(checked) => {
                  onChange(
                    checked === true
                      ? [...selected, developer]
                      : selected.filter((item) => item !== developer),
                  );
                }}
              />
            ))}
          </div>
          {selected.length > 0 ? (
            <Button
              type="button"
              variant="link"
              color="primary"
              onClick={() => {
                onChange([]);
              }}
            >
              Limpar seleção
            </Button>
          ) : null}
        </div>
      </details>
    </div>
  );
}
