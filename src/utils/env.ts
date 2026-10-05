export function readEnv(name: keyof ImportMetaEnv, fallback = ''): string {
  const value = import.meta.env[name];

  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return fallback;
}
