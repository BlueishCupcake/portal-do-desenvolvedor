import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DeployedIndicator } from '@/components/DeployedIndicator/DeployedIndicator.tsx';

describe('DeployedIndicator', () => {
  it('shows Yes when the work item is deployed', () => {
    render(<DeployedIndicator deployed />);

    expect(screen.getByLabelText('Implantado: Sim')).toBeInTheDocument();
    expect(screen.getByText('Sim')).toBeInTheDocument();
  });

  it('shows No when the work item is not deployed', () => {
    render(<DeployedIndicator />);

    expect(screen.getByLabelText('Implantado: Não')).toBeInTheDocument();
    expect(screen.getByText('Não')).toBeInTheDocument();
  });
});
