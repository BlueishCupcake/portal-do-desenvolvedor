import { useMemo, useState } from 'react';

import { WorkItemBoard } from '@/components/Board/WorkItemBoard.tsx';
import { EmptyState } from '@/components/EmptyState/EmptyState.tsx';
import { ErrorState } from '@/components/ErrorState/ErrorState.tsx';
import { Header } from '@/components/Header/Header.tsx';
import { IntegrationNotice } from '@/components/IntegrationNotice/IntegrationNotice.tsx';
import { DashboardSkeleton } from '@/components/Loading/DashboardSkeleton.tsx';
import { SprintSummary } from '@/components/Sprint/SprintSummary.tsx';
import { WorkItemFilters } from '@/components/WorkItem/WorkItemFilters.tsx';
import { WorkItemSearch } from '@/components/WorkItem/WorkItemSearch.tsx';
import { WorkItemSort } from '@/components/WorkItem/WorkItemSort.tsx';
import { WorkItemDetails } from '@/components/WorkItemDetails/WorkItemDetails.tsx';
import { useCurrentSprint } from '@/hooks/useCurrentSprint.ts';
import { useCurrentUser } from '@/hooks/useCurrentUser.ts';
import { useDashboardFilters } from '@/hooks/useDashboardFilters.ts';
import { useLeadMode } from '@/hooks/useLeadMode.ts';
import { useSprints } from '@/hooks/useSprints.ts';
import { useWorkItemDetails } from '@/hooks/useWorkItemDetails.ts';
import { useWorkItems } from '@/hooks/useWorkItems.ts';
import styles from '@/pages/Dashboard/Dashboard.module.css';
import { readEnv } from '@/utils/env.ts';
import { findSprint, mergeSprints, sprintValue } from '@/utils/sprint.ts';

function readErrorMessage(error: Error | null): string | null {
  return error ? error.message : null;
}

export function Dashboard() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedSprintValue, setSelectedSprintValue] = useState<string | null>(
    null,
  );
  const { leadMode } = useLeadMode();
  const userQuery = useCurrentUser();
  const sprintQuery = useCurrentSprint();
  const sprintsQuery = useSprints();
  const availableSprints = useMemo(
    () => mergeSprints(sprintsQuery.data ?? [], sprintQuery.data),
    [sprintsQuery.data, sprintQuery.data],
  );
  const selectedSprint =
    findSprint(availableSprints, selectedSprintValue) ??
    sprintQuery.data ??
    availableSprints[0];
  const workItemsQuery = useWorkItems({
    sprintId: selectedSprint ? sprintValue(selectedSprint) : undefined,
    userId: userQuery.data?.id,
    leadMode,
  });
  const provider = readEnv('VITE_AZURE_DEVOPS_PROVIDER', 'mock');
  const detailsQuery = useWorkItemDetails(selectedId);
  const filters = useDashboardFilters(workItemsQuery.data ?? []);

  const isLoading =
    userQuery.isLoading ||
    sprintQuery.isLoading ||
    (workItemsQuery.isLoading && !workItemsQuery.data);
  const errorMessage =
    readErrorMessage(userQuery.error) ??
    readErrorMessage(sprintQuery.error) ??
    readErrorMessage(workItemsQuery.error);

  function retryDashboard() {
    void userQuery.refetch();
    void sprintQuery.refetch();
    void sprintsQuery.refetch();
    void workItemsQuery.refetch();
  }

  const workItems = workItemsQuery.data ?? [];

  return (
    <div className={styles.page}>
      <Header user={userQuery.data} />
      <main className={styles.main}>
        <SprintSummary
          sprint={selectedSprint}
          sprints={availableSprints}
          onSprintChange={(value) => {
            setSelectedId(null);
            setSelectedSprintValue(value);
          }}
        />
        <IntegrationNotice provider={provider} />
        {isLoading ? <DashboardSkeleton /> : null}
        {errorMessage ? (
          <ErrorState
            title="Não foi possível carregar sua Sprint"
            message={errorMessage}
            onRetry={retryDashboard}
          />
        ) : null}
        {!isLoading && !errorMessage ? (
          <>
            <section className={styles.toolbar} aria-label="Filtros da Sprint">
              <WorkItemSearch value={filters.search} onChange={filters.setSearch} />
              <WorkItemFilters
                type={filters.type}
                state={filters.state}
                boardColumn={filters.boardColumn}
                states={filters.states}
                boardColumns={filters.boardColumns}
                onTypeChange={filters.setType}
                onStateChange={filters.setState}
                onBoardColumnChange={filters.setBoardColumn}
              />
              <WorkItemSort
                sortBy={filters.sortBy}
                sortDirection={filters.sortDirection}
                onSortByChange={filters.setSortBy}
                onSortDirectionChange={filters.setSortDirection}
              />
            </section>
            {workItems.length === 0 ? (
              <EmptyState
                title="Nenhuma tarefa encontrada"
                message={
                  leadMode
                    ? 'Nenhuma tarefa encontrada nesta Sprint.'
                    : 'Você não possui tarefas atribuídas nesta Sprint.'
                }
              />
            ) : null}
            {workItems.length > 0 && filters.visibleItems.length === 0 ? (
              <EmptyState
                title="Nenhum resultado encontrado"
                message="Tente alterar ou remover os filtros."
                filtered
              />
            ) : null}
            {filters.visibleItems.length > 0 ? (
              <WorkItemBoard
                workItems={filters.visibleItems}
                catalog={workItems}
                leadMode={leadMode}
                onSelect={setSelectedId}
              />
            ) : null}
          </>
        ) : null}
      </main>
      <WorkItemDetails
        isOpen={selectedId !== null}
        details={detailsQuery.data ?? null}
        isLoading={detailsQuery.isLoading}
        errorMessage={readErrorMessage(detailsQuery.error)}
        onClose={() => {
          setSelectedId(null);
        }}
        onRetry={() => {
          void detailsQuery.refetch();
        }}
      />
    </div>
  );
}
