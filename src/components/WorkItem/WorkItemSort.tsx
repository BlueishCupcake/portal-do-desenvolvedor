import { ButtonIcon, Select } from '@poliedro/tamentai/web';

import styles from '@/components/WorkItem/WorkItemSort.module.css';
import { SORT_FIELD_OPTIONS } from '@/constants/workItem.ts';
import type { SortDirection, SortField } from '@/types/workItem.ts';

interface WorkItemSortProps {
  sortBy: SortField;
  sortDirection: SortDirection;
  onSortByChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
}

function isSortField(value: string): value is SortField {
  return SORT_FIELD_OPTIONS.some((option) => option.id === value);
}

export function WorkItemSort({
  sortBy,
  sortDirection,
  onSortByChange,
  onSortDirectionChange,
}: WorkItemSortProps) {
  return (
    <div className={styles.sort}>
      <Select
        label="Ordenar"
        value={sortBy}
        options={SORT_FIELD_OPTIONS.map((option) => ({
          value: option.id,
          label: option.label,
        }))}
        onValueChange={(value) => {
          if (typeof value === 'string' && isSortField(value)) {
            onSortByChange(value);
          }
        }}
      />
      <ButtonIcon
        type="button"
        variant="outline"
        color="secondary"
        icon={sortDirection === 'asc' ? 'ArrowUpAZ' : 'ArrowDownAZ'}
        aria-label={
          sortDirection === 'asc' ? 'Ordenação crescente' : 'Ordenação decrescente'
        }
        onClick={() => {
          onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
        }}
      />
    </div>
  );
}
