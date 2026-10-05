import { Card, Icon, Text, TitleV2 } from '@poliedro/tamentai/web';

import styles from '@/components/EmptyState/EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  message: string;
  filtered?: boolean;
}

export function EmptyState({ title, message, filtered = false }: EmptyStateProps) {
  return (
    <section className={styles.empty} role="status">
      <Card centered>
        <div className={styles.content}>
          <Icon name={filtered ? 'Search' : 'PartyPopper'} size={32} color="muted" />
          <TitleV2 variant="h3">{title}</TitleV2>
          <Text color="muted">{message}</Text>
        </div>
      </Card>
    </section>
  );
}
