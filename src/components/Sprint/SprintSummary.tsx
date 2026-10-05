import { Card, Select, Text, TitleV2 } from '@poliedro/tamentai/web';

import styles from '@/components/Sprint/SprintSummary.module.css';
import type { Sprint } from '@/types/sprint.ts';
import { formatDateRange, formatShortDateRange } from '@/utils/formatDate.ts';
import { sprintValue } from '@/utils/sprint.ts';

interface SprintSummaryProps {
  sprint?: Sprint;
  sprints?: Sprint[];
  onSprintChange?: (sprintId: string) => void;
}

export function SprintSummary({
  sprint,
  sprints = [],
  onSprintChange,
}: SprintSummaryProps) {
  if (!sprint) {
    return (
      <section className={styles.section} aria-label="Sprint atual">
        <Card>
          <Text color="muted">Identificando a Sprint atual...</Text>
        </Card>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-label="Sprint atual">
      <Card>
        <div className={styles.content}>
          {sprints.length > 0 && onSprintChange ? (
            <div className={styles.selector}>
              <Select
                label="Sprint"
                value={sprintValue(sprint)}
                options={sprints.map((item) => ({
                  value: sprintValue(item),
                  label: item.name,
                }))}
                onValueChange={(value) => {
                  if (typeof value === 'string' && value.length > 0) {
                    onSprintChange(value);
                  }
                }}
              />
            </div>
          ) : (
            <>
              <Text variant="overline" color="muted">
                Sprint atual
              </Text>
              <TitleV2 variant="h2">{sprint.name}</TitleV2>
            </>
          )}
          <p className={styles.period}>
            <span className={styles.full}>
              <Text as="span" color="muted">
                Período: {formatDateRange(sprint.startDate, sprint.endDate)}
              </Text>
            </span>
            <span className={styles.short}>
              <Text as="span" color="muted">
                {formatShortDateRange(sprint.startDate, sprint.endDate)}
              </Text>
            </span>
          </p>
        </div>
      </Card>
    </section>
  );
}
