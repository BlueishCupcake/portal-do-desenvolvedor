import {
  Avatar,
  Badge,
  Button,
  ButtonIcon,
  Tabs,
  Text,
  TitleV2,
} from '@poliedro/tamentai/web';

import type { WorkspaceView } from '@/app/providers/workspaceViewContext.ts';
import styles from '@/components/Header/Header.module.css';
import { useLeadMode } from '@/hooks/useLeadMode.ts';
import { useTheme } from '@/hooks/useTheme.ts';
import { useTodoCount } from '@/hooks/useTodoCount.ts';
import { useWorkspaceView } from '@/hooks/useWorkspaceView.ts';
import type { Developer } from '@/types/developer.ts';

interface HeaderProps {
  user?: Developer;
}

function toInitials(name?: string): string {
  if (!name) {
    return '?';
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Header({ user }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { leadMode, toggleLeadMode } = useLeadMode();
  const { view, setView } = useWorkspaceView();
  const todoCount = useTodoCount();
  const isDark = theme === 'dark';

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Text variant="overline" color="muted">
          Azure DevOps
        </Text>
        <TitleV2 variant="h1">Portal do Desenvolvedor</TitleV2>
      </div>
      <div className={styles.actions}>
        <Tabs
          className={styles.tabs}
          aria-label="Área do portal"
          variant="segment"
          size="sm"
          tabs={[
            { value: 'tasks', label: 'Tasks', active: view === 'tasks' },
            {
              value: 'todos',
              label: (
                <span className={styles.tabLabel}>
                  To Do&apos;s
                  <Badge
                    className={styles.todoCount}
                    variant="solid"
                    color="red"
                    size="sm"
                    shape="pilled"
                    aria-hidden="true"
                    title={`${String(todoCount)} post-it${todoCount === 1 ? '' : 's'}`}
                  >
                    {todoCount}
                  </Badge>
                </span>
              ),
              active: view === 'todos',
            },
            {
              value: 'pipelines',
              label: 'Pipelines',
              active: view === 'pipelines',
            },
          ]}
          onChange={(value) => {
            if (
              value === 'tasks' ||
              value === 'todos' ||
              value === 'pipelines'
            ) {
              setView(value satisfies WorkspaceView);
            }
          }}
        />
        <Button
          type="button"
          variant={leadMode ? 'solid' : 'outline'}
          color="secondary"
          aria-pressed={leadMode}
          aria-label={leadMode ? 'Desativar Lead Mode' : 'Ativar Lead Mode'}
          onClick={toggleLeadMode}
        >
          Lead Mode
        </Button>
        <ButtonIcon
          type="button"
          variant="ghost"
          color="secondary"
          icon={isDark ? 'Sun' : 'Moon'}
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          aria-pressed={isDark}
          onClick={toggleTheme}
        />
        <div
          className={styles.user}
          aria-label={`Usuário atual: ${user?.displayName ?? 'carregando'}`}
        >
          <Avatar
            size="sm"
            shape="circular"
            variant="soft"
            color="blue"
            initials={toInitials(user?.displayName)}
            alt={user?.displayName ?? 'Usuário'}
          />
          <Text variant="label">{user?.displayName ?? 'Carregando usuário...'}</Text>
        </div>
      </div>
    </header>
  );
}
