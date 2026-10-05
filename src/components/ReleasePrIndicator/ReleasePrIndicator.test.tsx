import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ReleasePrIndicator } from '@/components/ReleasePrIndicator/ReleasePrIndicator.tsx';

describe('ReleasePrIndicator', () => {
  it('shows created when a release pull request exists', () => {
    render(<ReleasePrIndicator created />);

    expect(screen.getByLabelText('Release PR: created')).toBeInTheDocument();
    expect(screen.getByText('created')).toBeInTheDocument();
  });

  it('shows not created when there is no release pull request', () => {
    render(<ReleasePrIndicator />);

    expect(screen.getByLabelText('Release PR: not created')).toBeInTheDocument();
    expect(screen.getByText('not created')).toBeInTheDocument();
  });
});
