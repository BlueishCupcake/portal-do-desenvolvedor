import { Links, Text } from '@poliedro/tamentai/web';

import styles from '@/components/Metrics/MetricsTable.module.css';
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
          <Text variant="label">Work item details</Text>
        </caption>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Title</th>
            <th scope="col">Type</th>
            <th scope="col">State</th>
            <th scope="col">Assigned To</th>
            <th scope="col">Updated</th>
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
              <td>{item.type}</td>
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
