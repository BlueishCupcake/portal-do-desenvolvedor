import { Links, Text } from '@poliedro/tamentai/web';

import styles from '@/components/Metrics/MetricsTable.module.css';
import { formatWorkItemType } from '@/constants/workItem.ts';
import type { MetricWorkItemRow } from '@/types/metrics.ts';
import { formatDate } from '@/utils/formatDate.ts';

interface MetricsTableProps {
  items: MetricWorkItemRow[];
}

export function MetricsTable({ items }: MetricsTableProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          <Text variant="label">Detalhes dos itens de trabalho</Text>
        </caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Título</th>
            <th scope="col">Tipo</th>
            <th scope="col">Estado</th>
            <th scope="col">Responsável</th>
            <th scope="col">Atualizado</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.url ? (
                  <Links href={item.url} target="_blank" rel="noreferrer">
                    {item.id}
                  </Links>
                ) : (
                  item.id
                )}
              </td>
              <td>{item.title}</td>
              <td>{formatWorkItemType(item.type)}</td>
              <td>{item.state}</td>
              <td>{item.assignedTo}</td>
              <td>{item.updatedAt ? formatDate(item.updatedAt) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
