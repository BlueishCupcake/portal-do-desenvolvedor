import { Button, Dialog, Input, Links, Text } from '@poliedro/tamentai/web';
import { useEffect, useMemo, useState } from 'react';

import styles from '@/components/DeployCardDialog/DeployCardDialog.module.css';
import type { CreateDeployCardInput, DeployCard } from '@/types/deployCard.ts';
import type { WorkItem } from '@/types/workItem.ts';
import { buildDeployCardDescription } from '@/utils/deployCardDescription.ts';

interface DeployCardDialogProps {
  open: boolean;
  workItems: WorkItem[];
  catalog: WorkItem[];
  onCreate: (input: CreateDeployCardInput) => Promise<DeployCard>;
  onClose: () => void;
  onCreated: () => void;
}

export function DeployCardDialog({
  open,
  workItems,
  catalog,
  onCreate,
  onClose,
  onCreated,
}: DeployCardDialogProps) {
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdCard, setCreatedCard] = useState<DeployCard | null>(null);
  const description = useMemo(
    () => buildDeployCardDescription(workItems, catalog),
    [catalog, workItems],
  );

  useEffect(() => {
    if (!open) {
      setTitle('');
      setErrorMessage(null);
      setCreatedCard(null);
    }
  }, [open]);

  async function createCard() {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setErrorMessage('Informe um título para o cartão de deploy.');
      return;
    }

    setIsCreating(true);
    setErrorMessage(null);

    try {
      const card = await onCreate({
        title: normalizedTitle,
        description,
        workItemIds: workItems.map((item) => item.id),
        iterationPath: workItems[0]?.iterationPath,
      });
      setCreatedCard(card);
      onCreated();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar o cartão de deploy.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Criar cartão de deploy"
      aria-label="Criar cartão de deploy"
      size="lg"
      closeButtonLabel="Fechar"
      footer={
        <div className={styles.footer}>
          <Button
            type="button"
            variant="outline"
            color="secondary"
            onClick={onClose}
          >
            {createdCard ? 'Concluir' : 'Cancelar'}
          </Button>
          {!createdCard ? (
            <Button
              type="button"
              color="primary"
              disabled={isCreating || title.trim().length === 0}
              onClick={() => void createCard()}
            >
              {isCreating ? 'Criando...' : 'Criar cartão'}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className={styles.content}>
        {createdCard ? (
          <>
            <Text>Cartão de deploy criado com sucesso.</Text>
            <Links href={createdCard.url} target="_blank" rel="noreferrer">
              Abrir #{createdCard.id} — {createdCard.title}
            </Links>
          </>
        ) : (
          <>
            <Input
              id="deploy-card-title"
              label="Título"
              placeholder="Ex.: Deploy da Sprint 42"
              value={title}
              onChangeValue={setTitle}
            />
            <div>
              <Text as="span">Descrição que será adicionada ao cartão</Text>
              <pre className={styles.preview}>{description}</pre>
            </div>
            {errorMessage ? (
              <Text>
                <span role="alert" className={styles.error}>
                  {errorMessage}
                </span>
              </Text>
            ) : null}
          </>
        )}
      </div>
    </Dialog>
  );
}
