import { Button, ButtonGroup, Select } from '@poliedro/tamentai/web';

import { DeveloperMultiSelect } from '@/components/WorkItem/DeveloperMultiSelect.tsx';
import styles from '@/components/WorkItem/WorkItemFilters.module.css';
import { WORK_ITEM_TYPE_FILTERS } from '@/constants/workItem.ts';
import type { WorkItemTypeFilter } from '@/types/workItem.ts';

interface WorkItemFiltersProps {
  type: WorkItemTypeFilter;
  state: string;
  boardColumn: string;
  states: string[];
  boardColumns: string[];
  developers?: string[];
  selectedDevelopers?: string[];
  onTypeChange: (type: WorkItemTypeFilter) => void;
  onStateChange: (state: string) => void;
  onBoardColumnChange: (boardColumn: string) => void;
  onDevelopersChange?: (developers: string[]) => void;
}

export function WorkItemFilters({
  type,
  state,
  boardColumn,
  states,
  boardColumns,
  developers,
  selectedDevelopers = [],
  onTypeChange,
  onStateChange,
  onBoardColumnChange,
  onDevelopersChange,
}: WorkItemFiltersProps) {
  return (
    <div className={styles.filters}>
      <ButtonGroup aria-label="Filtrar por tipo" variant="joined">
        {WORK_ITEM_TYPE_FILTERS.map((filter) => (
          <Button
            key={filter.id}
            type="button"
            color="primary"
            variant={type === filter.id ? 'solid' : 'outline'}
            aria-pressed={type === filter.id}
            onClick={() => {
              onTypeChange(filter.id);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </ButtonGroup>
      <div className={styles.selects}>
        <Select
          label="Status do item"
          value={state}
          options={[
            { value: 'all', label: 'Todos os status' },
            ...states.map((item) => ({ value: item, label: item })),
          ]}
          onValueChange={(value) => {
            if (typeof value === 'string') {
              onStateChange(value);
            }
          }}
        />
        <Select
          label="Coluna do board"
          value={boardColumn}
          options={[
            { value: 'all', label: 'Todas as colunas do board' },
            ...boardColumns.map((item) => ({ value: item, label: item })),
          ]}
          onValueChange={(value) => {
            if (typeof value === 'string') {
              onBoardColumnChange(value);
            }
          }}
        />
        {developers && onDevelopersChange ? (
          <DeveloperMultiSelect
            developers={developers}
            selected={selectedDevelopers}
            onChange={onDevelopersChange}
          />
        ) : null}
      </div>
    </div>
  );
}
