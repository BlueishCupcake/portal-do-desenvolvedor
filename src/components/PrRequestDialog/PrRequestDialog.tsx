import { useState } from 'react';

import { Button, Dialog, Links, Text } from '@poliedro/tamentai/web';

import styles from '@/components/PrRequestDialog/PrRequestDialog.module.css';
import type { WorkItem } from '@/types/workItem.ts';
import { buildPrRequestMessage } from '@/utils/prRequestMessage.ts';

interface PrRequestDialogProps {
  open: boolean;
  workItems: WorkItem[];
  onClose: () => void;
}

export function PrRequestDialog({
  open,
  workItems,
  onClose,
}: PrRequestDialogProps) {
  const [copied, setCopied] = useState(false);
  const message = buildPrRequestMessage(workItems);

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Solicitar criação de PR"
      aria-label="Solicitar criação de PR"
      size="md"
      closeButtonLabel="Fechar"
      footer={
        <div className={styles.footer}>
          <Button type="button" variant="outline" color="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button type="button" color="primary" onClick={() => void copyMessage()}>
            {copied ? 'Mensagem copiada' : 'Copiar mensagem'}
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <Text>
          Olá, gostaria de solicitar a criação das pull requests de release para as
          tarefas abaixo.
        </Text>
        <ul className={styles.list}>
          {workItems.map((item) => (
            <li key={item.id}>
              {item.url ? (
                <Links href={item.url} target="_blank" rel="noreferrer">
                  #{item.id} — {item.title}
                </Links>
              ) : (
                <strong>
                  #{item.id} — {item.title}
                </strong>
              )}
              <Text variant="caption" color="muted">
                Responsável: {item.assignedTo}
              </Text>
            </li>
          ))}
        </ul>
        <Text color="muted">
          Fico à disposição para qualquer alinhamento.
        </Text>
      </div>
    </Dialog>
  );
}
