import { Button, Select, Spinner, Tabs, Text, TitleV2 } from '@poliedro/tamentai/web';
import { useState } from 'react';

import { EmptyState } from '@/components/EmptyState/EmptyState.tsx';
import { ErrorState } from '@/components/ErrorState/ErrorState.tsx';
import { MetricCard } from '@/components/Metrics/MetricCard.tsx';
import styles from '@/components/Metrics/MetricsBoard.module.css';
import { MetricsBreakdown } from '@/components/Metrics/MetricsBreakdown.tsx';
import { MetricsTable } from '@/components/Metrics/MetricsTable.tsx';
import { useCurrentSprint } from '@/hooks/useCurrentSprint.ts';
import { useMetrics } from '@/hooks/useMetrics.ts';
import type { MetricPeriod, MetricScope } from '@/types/metrics.ts';
import { readEnv } from '@/utils/env.ts';
import { formatDate } from '@/utils/formatDate.ts';
import { filterMetricItems } from '@/utils/metrics/filterMetricItems.ts';
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
  const metrics = data?.metrics;
  const visibleItems = metrics
    ? filterMetricItems(
        metrics.items,
        selectedKpi,
        period,
        {
          startDate: data.context.periodStart,
          endDate: data.context.periodEnd,
        },
      )
    : [];
  const selectedKpiLabel = metrics?.kpis.find((kpi) => kpi.id === selectedKpi)?.label;
  const waitingSprint =
    period === 'current-sprint' && !sprintId && sprintQuery.isLoading;
  const isLoading = metricsQuery.isLoading || waitingSprint;
  const errorMessage =
    metricsQuery.error?.message ??
    (period === 'current-sprint' && !sprintId ? sprintQuery.error?.message : undefined);
  const isRefreshing = metricsQuery.isFetching && Boolean(metricsQuery.data);

  return (
    <section className={styles.section} aria-label="Metrics">
      <div className={styles.heading}>
        <div>
          <TitleV2 variant="h2">Metrics</TitleV2>
          <Text color="muted">
            Projeto: {project} · Time: {team}
          </Text>
          {data?.vdm ? (
            <p
              aria-label={`VDM Objective ${String(data.vdm.objective)} / Current closed cards: ${String(data.vdm.closedInMonth)}`}
            >
              <Text as="span">
                VDM Objective {data.vdm.objective} / Current closed cards:{' '}
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
          { value: 'personal', label: 'My Metrics', active: scope === 'personal' },
          { value: 'team', label: 'Team Metrics', active: scope === 'team' },
          { value: 'project', label: 'Project Metrics', active: scope === 'project' },
        ]}
        onChange={(value) => {
          if (isMetricScope(value)) {
            setSelectedKpi(null);
            setScope(value);
          }
        }}
      />

      {isLoading ? (
        <div role="status" aria-label="Carregando métricas">
          <Spinner label="Carregando métricas..." showLabel />
        </div>
      ) : null}

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
              title="Nenhum work item encontrado"
              message="Nenhum work item corresponde aos filtros e ao período atuais."
            />
          ) : null}

          {metrics.items.length > 0 && visibleItems.length === 0 ? (
            <EmptyState
              title="Nenhum resultado encontrado"
              message={
                selectedKpiLabel
                  ? `Nenhum work item corresponde ao KPI ${selectedKpiLabel}.`
                  : 'Nenhum work item corresponde aos filtros atuais.'
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
