# Quickstart: Validar "Adicionar tarefas a um card de deploy"

Pré-requisitos, contratos e modelo: [data-model.md](./data-model.md),
[contracts/bff-deploy-cards.md](./contracts/bff-deploy-cards.md),
[contracts/ui-lead-mode-add-to-deploy.md](./contracts/ui-lead-mode-add-to-deploy.md).

## Pré-requisitos

- Node conforme `package.json`
- `.env` com `AZURE_DEVOPS_PAT`, org, project, team (igual create deploy)
- `VITE_AZURE_DEVOPS_PROVIDER=rest` para validação real
- Ao menos um cartão de deploy aberto na Sprint atual (criado via "Criar
  cartão de deploy" ou manualmente no Azure, tipo
  `AZURE_DEVOPS_DEPLOY_WORK_ITEM_TYPE`)

## Desenvolvimento local

```bash
npm install
npm run dev
```

Abrir Modo Lead, selecionar tarefas abertas, usar o novo botão.

## Testes automatizados

Após implementação:

```bash
npm run test -- --run AddToDeployCardDialog
npm run test -- --run handlers.test.ts
npm run test --run
npm run lint
npx tsc --noEmit
```

**Esperado**: suites novas/alteradas verdes; cobertura dos arquivos tocados
≥ limiar do projeto (~90%).

## Cenário manual E2E (rest)

1. Criar ou identificar cartão de deploy **A** na Sprint atual (estado aberto).
2. Selecionar tarefas **T1**, **T2** não fechadas no Modo Lead.
3. Clicar **Adicionar tarefas a um card de deploy**.
4. Escolher **A** na lista; revisar preview da descrição.
5. Confirmar **Adicionar ao cartão**.
6. **Esperado UI**: mensagem de sucesso + link para **A**.
7. **Esperado Azure**:
   - **A**: descrição com seções Aplicações / PRs / Histórias alinhadas ao
     padrão de create; relations Related para **T1**, **T2** (se ainda não
     existiam).
   - **T1**, **T2**: `System.State` = `Closed`.
8. Recarregar Sprint no portal: tarefas aparecem fechadas na grade.

## Cenário mock (sem Azure)

1. `VITE_AZURE_DEVOPS_PROVIDER=mock`
2. Repetir passos 2–6.
3. **Esperado**: cartão mock atualizado; estados locais das tarefas `Closed`.

## Cenário de erro

1. Desligar PAT ou simular 400 no handler test.
2. Confirmar anexação.
3. **Esperado**: alerta PT no dialog; cartão/tarefas inalterados (mock) ou
   mensagem clara (rest).

## Próximo passo Spec Kit

Gerar tarefas de implementação: `/speckit-tasks` sobre
`specs/001-add-to-deploy-card/`.
