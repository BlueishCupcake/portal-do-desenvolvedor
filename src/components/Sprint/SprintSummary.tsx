import { Card, Text, TitleV2 } from '@poliedro/tamentai/web';

import { SprintMultiSelect } from '@/components/Sprint/SprintMultiSelect.tsx';
import styles from '@/components/Sprint/SprintSummary.module.css';
import type { Sprint } from '@/types/sprint.ts';
import { formatDateRange, formatShortDateRange } from '@/utils/formatDate.ts';
import { sprintValue } from '@/utils/sprint.ts';

interface SprintSummaryProps {
  sprint?: Sprint;
  sprints?: Sprint[];
  selectedSprintValues?: string[];
  userPoints?: number;
  pulledCards?: number;
  closedCards?: number;
  onSprintsChange?: (sprintIds: string[]) => void;
}

function selectedSprintsFrom(
  sprints: Sprint[],
  selectedValues: string[] | undefined,
  fallback?: Sprint,
): Sprint[] {
  const selected = sprints.filter((item) =>
    (selectedValues ?? []).includes(sprintValue(item)),
  );
  if (selected.length > 0) {
    return selected;
  }

  return fallback ? [fallback] : [];
}

export function SprintSummary({
  sprint,
  sprints = [],
  selectedSprintValues,
  userPoints,
  pulledCards,
  closedCards,
  onSprintsChange,
}: SprintSummaryProps) {
  const selectedSprints = selectedSprintsFrom(sprints, selectedSprintValues, sprint);
  const periodStart = selectedSprints
    .map((item) => item.startDate)
    .filter((value) => value.length > 0)
    .sort()[0];
  const periodEnd = selectedSprints
    .map((item) => item.endDate)
    .filter((value) => value.length > 0)
    .sort()
    .at(-1);

  if (!sprint && selectedSprints.length === 0) {
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
          <div className={styles.row}>
            {sprints.length > 0 && onSprintsChange ? (
              <div className={styles.selector}>
                <SprintMultiSelect
                  sprints={sprints}
                  selected={selectedSprints.map((item) => sprintValue(item))}
                  onChange={onSprintsChange}
                />
              </div>
            ) : (
              <div>
                <Text variant="overline" color="muted">
                  Sprint atual
                </Text>
                <TitleV2 variant="h2">
                  {selectedSprints.map((item) => item.name).join(', ') || sprint?.name}
                </TitleV2>
              </div>
            )}
            {userPoints !== undefined ||
            pulledCards !== undefined ||
            closedCards !== undefined ? (
              <div className={styles.metrics}>
                {userPoints !== undefined ? (
                  <p
                    className={styles.metric}
                    aria-label={`Pontos do usuário na sprint: ${String(userPoints)}`}
                  >
                    <Text as="span" color="muted">
                      Pontos produzidos: {userPoints}
                    </Text>
                  </p>
                ) : null}
                {pulledCards !== undefined ? (
                  <p
                    className={styles.metric}
                    aria-label={`Cards puxados na sprint: ${String(pulledCards)}`}
                  >
                    <Text as="span" color="muted">
                      Cards puxados: {pulledCards}
                    </Text>
                  </p>
                ) : null}
                {closedCards !== undefined ? (
                  <p
                    className={styles.metric}
                    aria-label={`Cards fechados na sprint: ${String(closedCards)}`}
                  >
                    <Text as="span" color="muted">
                      Cards fechados: {closedCards}
                    </Text>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          {periodStart && periodEnd ? (
            <p className={styles.period}>
              <span className={styles.full}>
                <Text as="span" color="muted">
                  Período: {formatDateRange(periodStart, periodEnd)}
                </Text>
              </span>
              <span className={styles.short}>
                <Text as="span" color="muted">
                  {formatShortDateRange(periodStart, periodEnd)}
                </Text>
              </span>
            </p>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
