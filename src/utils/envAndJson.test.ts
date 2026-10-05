import { afterEach, describe, expect, it, vi } from 'vitest';

import { readEnv } from '@/utils/env.ts';
import {
  isJsonObject,
  readArrayField,
  readNumberField,
  readObjectField,
  readStringField,
} from '@/utils/json.ts';

describe('env and json helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads env values with fallback', () => {
    vi.stubEnv('VITE_AZURE_DEVOPS_PROVIDER', '');
    vi.stubEnv('VITE_AZURE_DEVOPS_ORGANIZATION', '');

    expect(readEnv('VITE_AZURE_DEVOPS_PROVIDER', 'mock')).toBe('mock');
    expect(readEnv('VITE_AZURE_DEVOPS_ORGANIZATION', 'fallback')).toBe('fallback');
  });

  it('narrows json values', () => {
    const source = {
      name: 'Sophie',
      count: 2,
      nested: { ok: true },
      list: [1],
      empty: null,
    };

    expect(isJsonObject(source)).toBe(true);
    expect(isJsonObject('nope')).toBe(false);
    expect(isJsonObject([1])).toBe(false);
    expect(readStringField(source, 'name')).toBe('Sophie');
    expect(readStringField(source, 'count')).toBeUndefined();
    expect(readNumberField(source, 'count')).toBe(2);
    expect(readNumberField(source, 'name')).toBeUndefined();
    expect(readObjectField(source, 'nested')).toEqual({ ok: true });
    expect(readObjectField(source, 'name')).toBeUndefined();
    expect(readArrayField(source, 'list')).toEqual([1]);
    expect(readArrayField(source, 'name')).toBeUndefined();
  });
});
