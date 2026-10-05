import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BugIndicator } from '@/components/BugIndicator/BugIndicator.tsx';

describe('BugIndicator', () => {
  it('shows a bug indicator for open bug work items', () => {
    render(<BugIndicator type="Bug" state="Active" />);

    expect(screen.getByLabelText('Bug')).toBeInTheDocument();
    expect(screen.getByText('BUG')).toBeInTheDocument();
  });

  it('shows bugs fixed when the bug is resolved', () => {
    render(<BugIndicator type="Bug" state="Closed" />);

    expect(screen.getByLabelText('Bugs fixed')).toBeInTheDocument();
    expect(screen.getByText('Bugs fixed')).toBeInTheDocument();
  });

  it('shows an accessible placeholder for common tasks', () => {
    render(<BugIndicator type="Task" />);

    expect(screen.getByLabelText(/sem alerta de bug/i)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
