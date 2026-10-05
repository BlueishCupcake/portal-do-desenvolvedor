import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ENV_PREFIXES = ['VITE_', 'AZURE_DEVOPS_'];

function parseEnvContents(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const normalized = line.startsWith('export ')
      ? line.slice('export '.length).trim()
      : line;
    const separator = normalized.indexOf('=');
    if (separator <= 0) {
      continue;
    }

    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function envFileNames(mode: string): string[] {
  return ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
}

export function readAzureDevOpsEnvFiles(
  envDir: string,
  mode = 'development',
): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const fileName of envFileNames(mode)) {
    const filePath = join(envDir, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    Object.assign(parsed, parseEnvContents(readFileSync(filePath, 'utf8')));
  }

  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) =>
      ENV_PREFIXES.some((prefix) => key.startsWith(prefix)),
    ),
  );
}

export function loadAzureDevOpsPluginEnv(
  envDir: string,
  mode = 'development',
  baseEnv: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  const merged: Record<string, string | undefined> = { ...baseEnv };
  const fromFiles = readAzureDevOpsEnvFiles(envDir, mode);

  for (const [key, value] of Object.entries(fromFiles)) {
    if (merged[key] === undefined || merged[key] === '') {
      merged[key] = value;
    }
  }

  return merged;
}
