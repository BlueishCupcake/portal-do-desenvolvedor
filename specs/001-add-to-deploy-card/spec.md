# Feature Specification: Adicionar tarefas a um card de deploy

**Feature Branch**: `001-add-to-deploy-card`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Planeje a criação de uma task onde adicionaremos um terceiro botão para o Lead mode chamado de 'Adicionar tarefas a um card de deploy', este botão irá assionar um dialog onde será possivel selecionar um card de deploy, e também selecionar uma lista de cards que o usuário deseja adicionar ao card de deploy seguindo todos os padrões pré existentes do card. Os cards selecionados devem se tornar closed após a adição bem sucedida dos cards ao card de deploy."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anexar tarefas a um deploy existente (Priority: P1)

Como líder técnico no Modo Lead, quero selecionar tarefas da Sprint e
incorporá-las a um cartão de deploy já criado, para agrupar entregas sem
abrir um novo cartão.

**Why this priority**: Entrega o valor principal da feature (continuidade do
fluxo de deploy após a criação inicial do cartão).

**Independent Test**: Com PAT e provider `rest`, selecionar tarefas, escolher
um cartão de deploy aberto, confirmar e verificar no Azure descrição
atualizada, vínculos Related e tarefas em estado fechado.

**Acceptance Scenarios**:

1. **Given** Modo Lead com ao menos uma tarefa selecionada, **When** o usuário
   clica em "Adicionar tarefas a um card de deploy", **Then** abre um dialog
   com lista de cartões de deploy elegíveis e preview da descrição que será
   aplicada.
2. **Given** um cartão de deploy e tarefas selecionadas, **When** o usuário
   confirma, **Then** o cartão recebe descrição e relations no mesmo padrão de
   "Criar cartão de deploy" e as tarefas adicionadas passam para estado
   fechado (`Closed`).
3. **Given** sucesso na operação, **When** o dialog exibe confirmação,
   **Then** o usuário pode abrir o cartão no Azure via link e fechar o dialog.

---

### User Story 2 - Escolher o cartão de deploy (Priority: P2)

Como líder, quero ver apenas cartões de deploy relevantes (mesmo tipo
configurado e Sprint/iteração atual), para não anexar tarefas ao item errado.

**Why this priority**: Reduz erro operacional na seleção do alvo.

**Independent Test**: Com mock ou REST, abrir o dialog e validar que a lista
contém cartões do tipo de deploy configurado e não concluídos na iteracao
atual.

**Acceptance Scenarios**:

1. **Given** Sprint atual carregada, **When** o dialog abre, **Then** a lista
   de cartões de deploy é carregada automaticamente para a iteracao da Sprint.
2. **Given** nenhum cartão elegível, **When** o dialog abre, **Then** o usuário
   vê mensagem clara e a ação de confirmar permanece desabilitada.

---

### User Story 3 - Falhas e cancelamento (Priority: P3)

Como usuário, quero feedback em português se a API falhar e poder cancelar
sem alterar o Azure.

**Why this priority**: Confiabilidade e alinhamento com o restante do portal.

**Independent Test**: Simular erro 400/503 no BFF e validar mensagem de alerta;
cancelar antes de confirmar não dispara mutation.

**Acceptance Scenarios**:

1. **Given** erro ao atualizar o cartão ou fechar tarefas, **When** a operação
   falha, **Then** nenhuma mensagem de sucesso é exibida e o erro é mostrado
   no dialog.
2. **Given** dialog aberto, **When** o usuário cancela, **Then** nenhuma
   chamada de anexação é enviada.

---

### Edge Cases

- Tarefa já vinculada ao cartão de deploy: ignorar duplicata em relations e
  ainda assim incluir na descrição consolidada se ainda não estiver refletida.
- Tarefa já fechada: permitir anexar ao cartão; não falhar ao tentar fechar
  novamente (no-op ou PATCH idempotente).
- Cartão de deploy fechado: não listar como destino elegível.
- Seleção vazia: botão de Lead Mode não aparece (mesma regra de "Criar cartão
  de deploy").
- Provider `mock`: simular lista, anexação e fechamento localmente; provider
  `mcp`: comportamento alinhado ao create (não grava no Azure real).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O Modo Lead MUST exibir o botão "Adicionar tarefas a um card de
  deploy" quando houver ao menos uma tarefa selecionada na grade.
- **FR-002**: O sistema MUST abrir um dialog dedicado para escolher o cartão
  de deploy alvo e revisar as tarefas que serão anexadas (as já selecionadas
  na grade).
- **FR-003**: A descrição aplicada ao cartão MUST seguir o mesmo formato gerado
  por `buildDeployCardDescription`, consolidando tarefas já vinculadas ao
  cartão mais as novas selecionadas.
- **FR-004**: O sistema MUST criar relations `System.LinkTypes.Related` do
  cartão para cada tarefa nova, com o mesmo comentário usado na criação do
  cartão.
- **FR-005**: Após anexação bem-sucedida, cada tarefa selecionada MUST
  transicionar para estado `Closed` no Azure DevOps.
- **FR-006**: O BFF MUST expor endpoints REST para listar cartões de deploy
  elegíveis e para anexar tarefas a um cartão existente (provider `rest`).
- **FR-007**: Mensagens de UI MUST estar em português brasileiro, consistentes
  com "Criar cartão de deploy".
- **FR-008**: Testes automatizados MUST cobrir dialog, utilitários de merge de
  descrição, handlers BFF e serviços mock/rest conforme padrão do repositório.

### Key Entities

- **Deploy card (cartão de deploy)**: Work item Azure do tipo
  `AZURE_DEVOPS_DEPLOY_WORK_ITEM_TYPE`; atributos id, título, url, iteration,
  estado, descrição, relations Related.
- **Anexação de tarefas**: Conjunto de work item ids selecionados no Lead Mode
  + id do cartão alvo; efeitos: descrição regenerada, relations, estados
  fechados.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Líder conclui anexação (seleção → confirmação → link do cartão)
  em uma única interação no dialog, sem editar manualmente o Azure.
- **SC-002**: 100% dos cenários de aceite P1 passam em testes automatizados
  (componente + BFF + serviço).
- **SC-003**: Descrição resultante no cartão contém as mesmas seções
  (Aplicações, Pull Requests, Histórias/Funcionalidades) que um cartão criado
  do zero com o conjunto unificado de tarefas.

## Assumptions

- Cartões de deploy são work items do tipo configurado em
  `AZURE_DEVOPS_DEPLOY_WORK_ITEM_TYPE` (padrão `Task`), como na criação atual.
- "Closed" é o estado de conclusão usado pelo projeto para tarefas (consistente
  com dados mock e métricas existentes).
- Lista de cartões elegíveis: mesma iteracao da Sprint exibida no Modo Lead e
  estado diferente de fechado.
- Tarefas a anexar são as linhas selecionadas na grade (não multi-seleção
  adicional dentro do dialog além do cartão alvo).
- Anexação real requer provider `rest` e variáveis `.env` já usadas pelo
  portal.
