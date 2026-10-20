import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReleasePrIndicator } from '@/components/ReleasePrIndicator/ReleasePrIndicator.tsx';

describe('ReleasePrIndicator', () => {
  it('shows created when a release pull request exists', () => {
    render(<ReleasePrIndicator created />);

    expect(screen.getByLabelText('PR de release: Criada')).toBeInTheDocument();
    expect(screen.getByText('Criada')).toBeInTheDocument();
  });

  it('shows not created when there is no release pull request', () => {
    render(<ReleasePrIndicator />);

    expect(screen.getByLabelText('PR de release: Não criada')).toBeInTheDocument();
    expect(screen.getByText('Não criada')).toBeInTheDocument();
  });
});
