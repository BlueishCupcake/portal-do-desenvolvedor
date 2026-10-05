import { describe, expect, it } from 'vitest';

import { toPlainText } from '@/utils/toPlainText.ts';

describe('toPlainText', () => {
  it('strips html tags and entities', () => {
    expect(toPlainText('<div>Filtro &amp; busca&nbsp;ok &lt;dev&gt;</div>')).toBe(
      'Filtro & busca ok <dev>',
    );
  });
});
