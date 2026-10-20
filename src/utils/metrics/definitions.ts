/**
 * Definições dos KPIs da aba Metrics.
 *
 * Tipos incluídos: todos os work items retornados pela consulta WIQL
 * (Task, Bug, User Story, Product Backlog Item, Feature e demais).
 *
 * Estados:
 * - Concluído: o estado corresponde a resolvido/fechado/pronto
 *   (mesma regra de `isResolvedWorkItemState`). Um item atribuído
 *   não é tratado como concluído só por estar atribuído.
 * - Inativo: Removed, Cancelled e equivalentes.
 * - Ativo: qualquer outro estado.
 *
 * Datas: comparações em UTC. Períodos de 7/30/90 dias começam à
 * meia-noite UTC de (hoje − N dias) e vão até o instante da consulta.
 * A sprint atual usa as datas da iteração quando existirem; se a
 * data de início não existir, os itens já vieram filtrados pela WIQL
 * da sprint e os concluídos do conjunto contam no período.
 *
 * Conclusão no período: item concluído cuja `closedAt`
 * (`Microsoft.VSTS.Common.ClosedDate`) ou, se ausente, `updatedAt`
 * (`System.ChangedDate`) está no intervalo.
 *
 * Atraso: só é calculado quando `Microsoft.VSTS.Scheduling.DueDate`
 * existe, é uma data válida e o item ainda está ativo. Sem esse
 * campo o KPI não é exibido.
 *
 * Escopos:
 * - Personal: `[System.AssignedTo] = @Me` resolvido pelo PAT no
 *   servidor. O cliente não envia um user id como prova de identidade.
 * - Team: itens da sprint/consulta do time autenticado.
 * - Project: WIQL do projeto. A visão é permission-filtered.
 *
 * Deduplicação: id estável do work item.
 * Tendências históricas: omitidas (exigem Analytics).
 * Falha de API nunca vira zero: a fonte fica `error` ou `unavailable`.
 */
export const METRIC_PERMISSION_NOTES = {
  personal:
    'Métricas pessoais do usuário autenticado pelo PAT. Work items sem permissão de leitura não aparecem.',
  team: 'Itens do time acessíveis ao usuário autenticado. A consulta usa o contexto do time configurado.',
  project:
    'Visão do projeto limitada aos work items visíveis para o usuário autenticado. Itens sem permissão não estão incluídos e a ausência deles não significa que não existam.',
} as const;

export const KPI_DEFINITIONS = {
  assigned:
    'Work items atualmente atribuídos ao usuário autenticado no conjunto consultado.',
  active:
    'Work items cujo estado não é concluído nem removido/cancelado.',
  completed:
    'Work items concluídos cuja data de fechamento (ClosedDate) ou, se ausente, ChangedDate está no período selecionado.',
  overdue:
    'Work items ativos com Microsoft.VSTS.Scheduling.DueDate anterior ao dia UTC atual.',
  bugs: 'Work items do tipo Bug no conjunto consultado.',
  pullRequests:
    'Pull requests do projeto cujo criador é o id estável do usuário autenticado. Contagem limitada à página retornada pela API.',
  pipelines:
    'Execuções recentes de build solicitadas em nome do usuário autenticado (mesmo recorte da aba Pipelines, até 50).',
  unassigned: 'Work items sem responsável no conjunto consultado.',
  sprintProgress:
    'Itens concluídos ÷ total de itens da sprint no conjunto consultado. Não é a média dos percentuais individuais.',
} as const;
