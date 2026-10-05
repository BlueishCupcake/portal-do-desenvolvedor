import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DeployedIndicator } from '@/components/DeployedIndicator/DeployedIndicator.tsx';

describe('DeployedIndicator', () => {
  it('shows Yes when the work item is deployed', () => {
    render(<DeployedIndicator deployed />);

    expect(screen.getByLabelText('Deployed: Yes')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('shows No when the work item is not deployed', () => {
    render(<DeployedIndicator />);

    expect(screen.getByLabelText('Deployed: No')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });
});
