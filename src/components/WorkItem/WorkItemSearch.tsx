import { Icon, Input } from '@poliedro/tamentai/web';

import styles from '@/components/WorkItem/WorkItemSearch.module.css';

interface WorkItemSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function WorkItemSearch({ value, onChange }: WorkItemSearchProps) {
  return (
    <div className={styles.field}>
      <Input
        id="work-item-search"
        type="search"
        label="Buscar tarefa"
        placeholder="Buscar tarefa..."
        value={value}
        startIcon={<Icon name="Search" size={16} />}
        onChangeValue={onChange}
      />
    </div>
  );
}
