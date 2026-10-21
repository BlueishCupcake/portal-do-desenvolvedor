import { describe, expect, it } from 'vitest';

import { createWorkItem } from '@/test/factories/workItem.ts';
import { unifiedDeployWorkItems } from '@/utils/deployCardUnifiedWorkItems.ts';

describe('unifiedDeployWorkItems', () => {
  it('merges catalog items with selected and existing related ids', () => {
    const catalog = [
      createWorkItem({ id: 1, title: 'On card' }),
      createWorkItem({ id: 2, title: 'Selected' }),
      createWorkItem({ id: 3, title: 'Other' }),
    ];
    const selected = [createWorkItem({ id: 2, title: 'Selected' })];

    const result = unifiedDeployWorkItems(selected, catalog, [1]);

    expect(result.map((item) => item.id).sort()).toEqual([1, 2]);
  });
});
