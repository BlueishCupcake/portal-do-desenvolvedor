import { Button, Select, Tabs, Text, TitleV2 } from '@poliedro/tamentai/web';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/EmptyState/EmptyState.tsx';
import { ErrorState } from '@/components/ErrorState/ErrorState.tsx';
import { MetricsTabSkeleton } from '@/components/Loading/MetricsTabSkeleton.tsx';
import { MetricCard } from '@/components/Metrics/MetricCard.tsx';
import styles from '@/components/Metrics/MetricsBoard.module.css';
import { MetricsBreakdown } from '@/components/Metrics/MetricsBreakdown.tsx';
import { MetricsTable } from '@/components/Metrics/MetricsTable.tsx';
import { DeveloperMultiSelect } from '@/components/WorkItem/DeveloperMultiSelect.tsx';
import { useCurrentSprint } from '@/hooks/useCurrentSprint.ts';
import { useMetrics } from '@/hooks/useMetrics.ts';
import type { MetricPeriod, MetricScope } from '@/types/metrics.ts';
import { readEnv } from '@/utils/env.ts';
import { uniqueSortedValues } from '@/utils/filterWorkItems.ts';
import { formatDate } from '@/utils/formatDate.ts';
import { filterMetricItems } from '@/utils/metrics/filterMetricItems.ts';
import { filterMetricsByDevelopers } from '@/utils/metrics/filterMetricsByDevelopers.ts';
import { isQuerySkeletonLoading } from '@/utils/isQuerySkeletonLoading.ts';
import { sprintValue } from '@/utils/sprint.ts';

const PERIOD_OPTIONS: Array<{ value: MetricPeriod; label: string }> = [
  { value: 'current-sprint', label: 'Sprint atual' },
  { value: '7-days', label: '7 dias' },
  { value: '30-days', label: '30 dias' },
  { value: '90-days', label: '90 dias' },
];

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function isMetricScope(value: string): value is MetricScope {
  return value === 'personal' || value === 'team' || value === 'project';
}

function isMetricPeriod(value: string): value is MetricPeriod {
  return (
    value === 'current-sprint' ||
    value === '7-days' ||
    value === '30-days' ||
    value === '90-days'
  );
}

export function MetricsBoard() {
  const [scope, setScope] = useState<MetricScope>('personal');
  const [period, setPeriod] = useState<MetricPeriod>('current-sprint');
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const sprintQuery = useCurrentSprint();
  const sprintId = sprintQuery.data ? sprintValue(sprintQuery.data) : undefined;
  const metricsQuery = useMetrics({
    scope,
    period,
    sprintId,
  });
  const project =
    metricsQuery.data?.context.project ||
    readEnv('VITE_AZURE_DEVOPS_PROJECT') ||
    '—';
  const team =
    metricsQuery.data?.context.team || readEnv('VITE_AZURE_DEVOPS_TEAM') || '—';
  const data = metricsQuery.data;
  const developers = useMemo(
    () => uniqueSortedValues((data?.metrics?.items ?? []).map((item) => item.assignedTo)),
    [data?.metrics?.items],
  );
  const visibleDevelopers = selectedDevelopers.filter((developer) =>
    developers.includes(developer),
  );
  const periodRange = {
    startDate: data?.context.periodStart,
    endDate: data?.context.periodEnd,
  };
  const metrics = data?.metrics
    ? filterMetricsByDevelopers(data.metrics, visibleDevelopers, {
        scope,
        period,
        sprint: periodRange,
        now: data.generatedAt ? new Date(data.generatedAt) : undefined,
      })
    : undefined;
  const visibleItems = metrics
    ? filterMetricItems(metrics.items, selectedKpi, period, periodRange)
    : [];
  const selectedKpiLabel = metrics?.kpis.find((kpi) => kpi.id === selectedKpi)?.label;
  const showDeveloperFilter = scope !== 'personal' && developers.length > 0;
  const needsSprint = period === 'current-sprint';
  const metricsQueryEnabled = !needsSprint || Boolean(sprintId);
  const waitingSprint =
    period === 'current-sprint' && !sprintId && sprintQuery.isLoading;
  const isMetricsLoading = isQuerySkeletonLoading(
    metricsQuery,
    metricsQueryEnabled,
  );
  const isLoading = isMetricsLoading || waitingSprint;
  const errorMessage =
    metricsQuery.error?.message ??
    (period === 'current-sprint' && !sprintId ? sprintQuery.error?.message : undefined);
  const isRefreshing = metricsQuery.isFetching && Boolean(metricsQuery.data);

  return (
    <section className={styles.section} aria-label="Métricas">
      <div className={styles.heading}>
        <div>
          <TitleV2 variant="h2">Métricas</TitleV2>
          <Text color="muted">
            Projeto: {project} · Time: {team}
          </Text>
          {data?.vdm ? (
            <p
              aria-label={`Objetivo VDM ${String(data.vdm.objective)} / Cards fechados no mês: ${String(data.vdm.closedInMonth)}`}
            >
              <Text as="span">
                Objetivo VDM {data.vdm.objective} / Cards fechados no mês:{' '}
                {data.vdm.closedInMonth}
              </Text>
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          color="secondary"
          variant="outline"
          disabled={isRefreshing || isLoading}
          onClick={() => {
            void metricsQuery.refetch();
          }}
        >
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className={styles.toolbar}>
        <Select
          label="Período"
          value={period}
          options={PERIOD_OPTIONS}
          onValueChange={(value) => {
            if (typeof value === 'string' && isMetricPeriod(value)) {
              setSelectedKpi(null);
              setPeriod(value);
            }
          }}
        />
        {showDeveloperFilter ? (
          <div className={styles.developerFilter}>
            <DeveloperMultiSelect
              developers={developers}
              selected={visibleDevelopers}
              onChange={(next) => {
                setSelectedKpi(null);
                setSelectedDevelopers(next);
              }}
            />
          </div>
        ) : null}
        <div>
          <Text variant="overline" color="muted">
            Atualizado
          </Text>
          <Text>
            {data?.generatedAt ? formatUpdatedAt(data.generatedAt) : '—'}
          </Text>
        </div>
        {data?.context.periodStart && data.context.periodEnd ? (
          <div>
            <Text variant="overline" color="muted">
              Intervalo
            </Text>
            <Text>
              {formatDate(data.context.periodStart)} → {formatDate(data.context.periodEnd)}
            </Text>
          </div>
        ) : null}
      </div>

      <Tabs
        className={styles.tabs}
        aria-label="Escopo das métricas"
        variant="segment"
        size="sm"
        tabs={[
          { value: 'personal', label: 'Minhas métricas', active: scope === 'personal' },
          { value: 'team', label: 'Métricas do time', active: scope === 'team' },
          { value: 'project', label: 'Métricas do projeto', active: scope === 'project' },
        ]}
        onChange={(value) => {
          if (isMetricScope(value)) {
            setSelectedKpi(null);
            setScope(value);
            if (value === 'personal') {
              setSelectedDevelopers([]);
            }
          }
        }}
      />

      {isLoading ? <MetricsTabSkeleton /> : null}

      {errorMessage ? (
        <ErrorState
          title="Não foi possível carregar as métricas"
          message={errorMessage}
          onRetry={() => {
            void sprintQuery.refetch();
            void metricsQuery.refetch();
          }}
        />
      ) : null}

      {data && data.errors.length > 0 ? (
        <div className={styles.partial} role="status">
          <Text>
            Dados parciais: {data.errors.map((error) => error.message).join(' ')}
          </Text>
        </div>
      ) : null}

      {data?.context.permissionNote ? (
        <Text color="muted">{data.context.permissionNote}</Text>
      ) : null}

      {!isLoading && !errorMessage && metrics ? (
        <>
          <div className={styles.kpis}>
            {metrics.kpis.map((kpi) => (
              <MetricCard
                key={kpi.id}
                kpi={kpi}
                selected={selectedKpi === kpi.id}
                onSelect={(id) => {
                  setSelectedKpi((current) => (current === id ? null : id));
                }}
              />
            ))}
          </div>

          {metrics.sprintProgress ? (
            <div
              className={styles.progress}
              aria-label={`Progresso da sprint: ${String(metrics.sprintProgress.completed)} de ${String(metrics.sprintProgress.total)} itens concluídos, ${String(metrics.sprintProgress.percent)} por cento`}
            >
              <Text>
                Progresso da sprint: {metrics.sprintProgress.completed}/
                {metrics.sprintProgress.total} ({metrics.sprintProgress.percent}%)
              </Text>
            </div>
          ) : null}

          <Text color="muted">
            Tendências históricas exigem Azure DevOps Analytics e não estão
            disponíveis nesta versão.
          </Text>

          <div className={styles.charts}>
            <MetricsBreakdown title="Por tipo" items={metrics.byType} />
            <MetricsBreakdown title="Por estado" items={metrics.byState} />
            {metrics.byAssignee ? (
              <MetricsBreakdown title="Por responsável" items={metrics.byAssignee} />
            ) : null}
          </div>

          {metrics.items.length === 0 ? (
            <EmptyState
              title="Nenhum item de trabalho encontrado"
              message="Nenhum item de trabalho corresponde aos filtros e ao período atuais."
            />
          ) : null}

          {metrics.items.length > 0 && visibleItems.length === 0 ? (
            <EmptyState
              title="Nenhum resultado encontrado"
              message={
                selectedKpiLabel
                  ? `Nenhum item de trabalho corresponde ao KPI ${selectedKpiLabel}.`
                  : 'Nenhum item de trabalho corresponde aos filtros atuais.'
              }
              filtered
            />
          ) : null}

          <MetricsTable items={visibleItems} />
        </>
      ) : null}
    </section>
  );
}
