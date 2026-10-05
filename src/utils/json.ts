export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readStringField(
  source: JsonObject,
  key: string,
): string | undefined {
  const value = source[key];
  return typeof value === 'string' ? value : undefined;
}

export function readNumberField(
  source: JsonObject,
  key: string,
): number | undefined {
  const value = source[key];
  return typeof value === 'number' ? value : undefined;
}

export function readObjectField(
  source: JsonObject,
  key: string,
): JsonObject | undefined {
  const value = source[key];
  return isJsonObject(value) ? value : undefined;
}

export function readArrayField(
  source: JsonObject,
  key: string,
): JsonValue[] | undefined {
  const value = source[key];
  return Array.isArray(value) ? value : undefined;
}
