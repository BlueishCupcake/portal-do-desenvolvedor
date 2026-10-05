import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { IntegrationNotice } from '@/components/IntegrationNotice/IntegrationNotice.tsx';

describe('IntegrationNotice', () => {
  it('explains that mock data is being shown', () => {
    render(<IntegrationNotice provider="mock" />);

    expect(screen.getByRole('status')).toHaveTextContent('dados de demonstração');
  });

  it('hides the notice when using a live provider', () => {
    const { container } = render(<IntegrationNotice provider="rest" />);

    expect(container).toBeEmptyDOMElement();
  });
});
