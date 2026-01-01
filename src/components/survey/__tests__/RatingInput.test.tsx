import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RatingInput } from '../RatingInput';

describe('RatingInput', () => {
  // Core rendering
  it('renders correct number of rating buttons', () => {
    const onSubmit = vi.fn();
    render(<RatingInput max={5} onSubmit={onSubmit} />);
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('displays endpoint labels when provided', () => {
    const onSubmit = vi.fn();
    render(<RatingInput max={10} lowLabel="Poor" highLabel="Excellent" onSubmit={onSubmit} />);
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('supports Hebrew RTL layout', () => {
    const onSubmit = vi.fn();
    const { container } = render(<RatingInput max={5} onSubmit={onSubmit} language="he" />);
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
  });

  // Auto-submit behavior (critical functionality)
  describe('Auto-submit', () => {
    it('auto-submits after delay when clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<RatingInput max={5} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('radio', { name: /rating 3 of 5/i }));

      // Wait for the 500ms delay to complete
      await vi.waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(3);
      }, { timeout: 1000 });
    });
  });

  // Keyboard accessibility
  it('supports keyboard navigation with Enter key', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RatingInput max={5} onSubmit={onSubmit} />);

    const button = screen.getByRole('radio', { name: /rating 4 of 5/i });
    button.focus();
    await user.keyboard('{Enter}');

    // Wait for the 500ms delay to complete
    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(4);
    }, { timeout: 1000 });
  });

  // ARIA accessibility
  it('has proper ARIA structure', () => {
    const onSubmit = vi.fn();
    render(<RatingInput max={5} onSubmit={onSubmit} language="en" />);

    expect(screen.getByRole('radiogroup', { name: /select rating/i })).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio, index) => {
      expect(radio).toHaveAccessibleName(`Rating ${index + 1} of 5`);
    });
  });

  // Scale variations
  it('handles different scale sizes', () => {
    const onSubmit = vi.fn();

    const { rerender } = render(<RatingInput max={3} onSubmit={onSubmit} />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);

    rerender(<RatingInput max={10} onSubmit={onSubmit} />);
    expect(screen.getAllByRole('radio')).toHaveLength(10);
  });
});
