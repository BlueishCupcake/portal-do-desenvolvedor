import { useCallback, useEffect, useRef, useState } from 'react';

import type { PipelineRun } from '@/types/pipeline.ts';
import {
  detectPipelineEvents,
  pipelineResultLabel,
} from '@/utils/pipelineNotifications.ts';

export const PIPELINE_NOTIFICATIONS_STORAGE_KEY =
  'portal-pipeline-notifications';

function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

function readEnabled(): boolean {
  try {
    return (
      isNotificationSupported() &&
      Notification.permission === 'granted' &&
      window.localStorage.getItem(PIPELINE_NOTIFICATIONS_STORAGE_KEY) === 'on'
    );
  } catch {
    return false;
  }
}

function showPipelineNotification(
  title: string,
  body: string,
  run: PipelineRun,
): void {
  const notification = new Notification(title, {
    body,
    tag: `pipeline-${String(run.id)}-${run.status}`,
  });

  notification.onclick = () => {
    window.focus();
    window.open(run.url, '_blank', 'noopener,noreferrer');
    notification.close();
  };
}

export function usePipelineNotifications(runs: readonly PipelineRun[]) {
  const supported = isNotificationSupported();
  const [enabled, setEnabled] = useState(readEnabled);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    supported ? Notification.permission : 'denied',
  );
  const previousRunsRef = useRef<Map<number, PipelineRun> | null>(null);

  useEffect(() => {
    const currentRuns = new Map(runs.map((run) => [run.id, run]));
    const previousRuns = previousRunsRef.current;

    if (
      previousRuns &&
      enabled &&
      supported &&
      Notification.permission === 'granted'
    ) {
      for (const event of detectPipelineEvents(previousRuns, runs)) {
        if (event.type === 'started') {
          showPipelineNotification(
            `${event.run.name} iniciada`,
            `Pipeline #${event.run.buildNumber} começou a executar.`,
            event.run,
          );
        } else {
          showPipelineNotification(
            `${event.run.name} finalizada`,
            `Pipeline #${event.run.buildNumber} foi finalizada ${pipelineResultLabel(event.run)}.`,
            event.run,
          );
        }
      }
    }

    previousRunsRef.current = currentRuns;
  }, [enabled, runs, supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) {
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    const nextEnabled = nextPermission === 'granted';
    setEnabled(nextEnabled);
    window.localStorage.setItem(
      PIPELINE_NOTIFICATIONS_STORAGE_KEY,
      nextEnabled ? 'on' : 'off',
    );
  }, [supported]);

  const disable = useCallback(() => {
    setEnabled(false);
    window.localStorage.setItem(PIPELINE_NOTIFICATIONS_STORAGE_KEY, 'off');
  }, []);

  return {
    supported,
    enabled,
    permission,
    requestPermission,
    disable,
  };
}
