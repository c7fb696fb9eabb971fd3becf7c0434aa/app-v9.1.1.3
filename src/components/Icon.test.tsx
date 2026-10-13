import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ICON_CATALOG_IS_UNIQUE, ICON_NAMES, Icon, IconButton } from './Icon';

describe('governed icon system', () => {
  it('keeps each action mapped to a unique catalog entry and renders decorative SVGs accessibly', () => {
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
    expect(ICON_CATALOG_IS_UNIQUE).toBe(true);
    const { container } = render(
      <div>
        {ICON_NAMES.map((name) => (
          <span key={name} data-icon-name={name}>
            <Icon name={name} />
          </span>
        ))}
      </div>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(ICON_NAMES.length);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('provides an accessible, keyboard-operable icon button with disabled behavior', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <IconButton name="publish" label="Publish changes" onClick={onClick} />,
    );

    const button = screen.getByRole('button', { name: 'Publish changes' });
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    rerender(<IconButton name="publish" label="Publish changes" disabled onClick={onClick} />);
    const disabledButton = screen.getByRole('button', { name: 'Publish changes' });
    expect(disabledButton).toBeDisabled();
    fireEvent.click(disabledButton);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
