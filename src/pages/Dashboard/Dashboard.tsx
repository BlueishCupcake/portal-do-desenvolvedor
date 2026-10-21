import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAzureDevOpsService } from '@/app/providers/azureDevOpsContext.ts';
import { WorkItemBoard } from '@/components/Board/WorkItemBoard.tsx';
import { EmptyState } from '@/components/EmptyState/EmptyState.tsx';
import { ErrorState } from '@/components/ErrorState/ErrorState.tsx';
import { Header } from '@/components/Header/Header.tsx';
import { IntegrationNotice } from '@/components/IntegrationNotice/IntegrationNotice.tsx';
import { DashboardSkeleton } from '@/components/Loading/DashboardSkeleton.tsx';
import { MetricsBoard } from '@/components/Metrics/MetricsBoard.tsx';
import { PipelinesBoard } from '@/components/Pipelines/PipelinesBoard.tsx';
import { SprintSummary } from '@/components/Sprint/SprintSummary.tsx';
import { TodosBoard } from '@/components/Todos/TodosBoard.tsx';
import { WorkItemFilters } from '@/components/WorkItem/WorkItemFilters.tsx';
import { WorkItemSearch } from '@/components/WorkItem/WorkItemSearch.tsx';
import { WorkItemSort } from '@/components/WorkItem/WorkItemSort.tsx';
import { WorkItemDetails } from '@/components/WorkItemDetails/WorkItemDetails.tsx';
import { useAttachTasksToDeployCard } from '@/hooks/useAttachTasksToDeployCard.ts';
import { useCreateDeployCard } from '@/hooks/useCreateDeployCard.ts';
import { useCurrentSprint } from '@/hooks/useCurrentSprint.ts';
import { useCurrentUser } from '@/hooks/useCurrentUser.ts';
import { useDashboardFilters } from '@/hooks/useDashboardFilters.ts';
import { useDeployCards } from '@/hooks/useDeployCards.ts';
import { useLeadMode } from '@/hooks/useLeadMode.ts';
import { usePipelineNotifications } from '@/hooks/usePipelineNotifications.ts';
import { usePipelines } from '@/hooks/usePipelines.ts';
import { useSprints } from '@/hooks/useSprints.ts';
import { useWorkItemDetails } from '@/hooks/useWorkItemDetails.ts';
import { useWorkItems } from '@/hooks/useWorkItems.ts';
import { useWorkspaceView } from '@/hooks/useWorkspaceView.ts';
import styles from '@/pages/Dashboard/Dashboard.module.css';
import { countAssignedSprintCards } from '@/utils/countAssignedSprintCards.ts';
import { readEnv } from '@/utils/env.ts';
import { findSprint, mergeSprints, sprintValue } from '@/utils/sprint.ts';
import { sumAssignedStoryPoints } from '@/utils/sumAssignedStoryPoints.ts';

function readErrorMessage(error: Error | null): string | null {
  return error ? error.message : null;
}

export function Dashboard() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedSprintValues, setSelectedSprintValues] = useState<string[]>([]);
  const [selectedWorkItemIds, setSelectedWorkItemIds] = useState<number[]>([]);
  const { leadMode } = useLeadMode();
  const { view } = useWorkspaceView();
  const pipelinesQuery = usePipelines();
  const azureDevOpsService = useAzureDevOpsService();
  const createDeployCard = useCreateDeployCard();
  const attachTasksToDeployCard = useAttachTasksToDeployCard();
  const pipelineNotifications = usePipelineNotifications(pipelinesQuery.data ?? []);
  const userQuery = useCurrentUser();
  const sprintQuery = useCurrentSprint();
  const sprintsQuery = useSprints();
  const availableSprints = useMemo(
    () => mergeSprints(sprintsQuery.data ?? [], sprintQuery.data),
    [sprintsQuery.data, sprintQuery.data],
  );
  const defaultSprint = sprintQuery.data ?? availableSprints[0];
  const effectiveSprintValues =
    selectedSprintValues.length > 0
      ? selectedSprintValues
      : defaultSprint
        ? [sprintValue(defaultSprint)]
        : [];
  const selectedSprints = effectiveSprintValues.flatMap((value) => {
    const sprint = findSprint(availableSprints, value);
    return sprint ? [sprint] : [];
  });
  const selectedSprint = selectedSprints[0] ?? defaultSprint;
  const workItemsQuery = useWorkItems({
    sprintIds: effectiveSprintValues,
    userId: userQuery.data?.id,
    leadMode,
  });
  const deployCardsQuery = useDeployCards(effectiveSprintValues, leadMode);
  const loadDeployCardRelatedIds = useCallback(
    async (deployCardId: number) => {
      const details = await azureDevOpsService.getWorkItemDetails(deployCardId);
      return details.relatedIds ?? [];
    },
    [azureDevOpsService],
  );
  const provider = readEnv('VITE_AZURE_DEVOPS_PROVIDER', 'mock');
  const detailsQuery = useWorkItemDetails(selectedId);
  const filters = useDashboardFilters(workItemsQuery.data ?? []);
  const { setSelectedDevelopers } = filters;

  useEffect(() => {
    if (!leadMode) {
      setSelectedWorkItemIds([]);
      setSelectedDevelopers([]);
    }
  }, [leadMode, setSelectedDevelopers]);

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
  const userPoints = sumAssignedStoryPoints(workItems, userQuery.data);
  const userCardCounts = countAssignedSprintCards(workItems, userQuery.data);

  return (
    <div className={styles.page}>
      <Header user={userQuery.data} />
      {view === 'todos' ? (
        <main className={styles.main}>
          <TodosBoard />
        </main>
      ) : view === 'pipelines' ? (
        <main className={styles.main}>
          <PipelinesBoard
            runs={pipelinesQuery.data ?? []}
            isLoading={pipelinesQuery.isLoading}
            errorMessage={readErrorMessage(pipelinesQuery.error)}
            notifications={pipelineNotifications}
            onRetry={() => {
              void pipelinesQuery.refetch();
            }}
          />
        </main>
      ) : view === 'metrics' ? (
        <main className={styles.main}>
          <MetricsBoard />
        </main>
      ) : (
        <>
          <main className={styles.main}>
            <SprintSummary
              sprint={selectedSprint}
              sprints={availableSprints}
              selectedSprintValues={effectiveSprintValues}
              userPoints={userPoints}
              pulledCards={userCardCounts.pulled}
              closedCards={userCardCounts.closed}
              onSprintsChange={(values) => {
                setSelectedId(null);
                setSelectedWorkItemIds([]);
                setSelectedDevelopers([]);
                setSelectedSprintValues(values);
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
                  <WorkItemSearch
                    value={filters.search}
                    onChange={filters.setSearch}
                  />
                  <WorkItemFilters
                    type={filters.type}
                    state={filters.state}
                    boardColumn={filters.boardColumn}
                    states={filters.states}
                    boardColumns={filters.boardColumns}
                    onTypeChange={filters.setType}
                    onStateChange={filters.setState}
                    onBoardColumnChange={filters.setBoardColumn}
                    developers={leadMode ? filters.developers : undefined}
                    selectedDevelopers={filters.selectedDevelopers}
                    onDevelopersChange={
                      leadMode ? filters.setSelectedDevelopers : undefined
                    }
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
                    selectedIds={selectedWorkItemIds}
                    onSelectedIdsChange={setSelectedWorkItemIds}
                    onSelect={setSelectedId}
                    onCreateDeployCard={createDeployCard.mutateAsync}
                    sprintIterationPath={selectedSprint?.path}
                    onRefreshDeployCards={() => {
                      void deployCardsQuery.refetch();
                    }}
                    onDeployCardsChanged={() => {
                      void deployCardsQuery.refetch();
                    }}
                    deployCards={deployCardsQuery.data ?? []}
                    isLoadingDeployCards={deployCardsQuery.isLoading}
                    deployCardsError={readErrorMessage(deployCardsQuery.error)}
                    onLoadDeployCardRelatedIds={loadDeployCardRelatedIds}
                    onAttachTasksToDeployCard={(deployCardId, input) =>
                      attachTasksToDeployCard.mutateAsync({ deployCardId, input })
                    }
                    onAttachedToDeployCard={() => {
                      void workItemsQuery.refetch();
                      void deployCardsQuery.refetch();
                    }}
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
        </>
      )}
    </div>
  );
}
