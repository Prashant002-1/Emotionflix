import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ManualEmotionInput from '../../src/components/features/emotion/ManualEmotionInput';

describe('ManualEmotionInput', () => {
  it('renders direct feeling controls', () => {
    render(<ManualEmotionInput onEmotionChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /what did you feel/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /joy intensity/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /melancholy intensity/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /friction intensity/i })).toBeInTheDocument();
  });

  it('submits the values set by the person', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ManualEmotionInput onSubmit={onSubmit} showSubmitButton />);

    fireEvent.change(screen.getByRole('slider', { name: /joy intensity/i }), { target: { value: '0.7' } });
    await user.click(screen.getByRole('button', { name: /use these feelings/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ happy: 0.7 }));
  });
});
