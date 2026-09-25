import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatutBadge, STATUT_LABEL, STATUT_STYLE } from './StatutBadge';

// jsdom normalizes hex colors to rgb() when reading element.style
function toRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe('StatutBadge', () => {
  it.each(Object.keys(STATUT_LABEL))('renders the correct label for %s', (statut) => {
    render(<StatutBadge statut={statut} />);
    expect(screen.getByText(STATUT_LABEL[statut])).toBeInTheDocument();
  });

  it('falls back to the raw statut string for an unknown value', () => {
    render(<StatutBadge statut="INCONNU" />);
    expect(screen.getByText('INCONNU')).toBeInTheDocument();
  });

  it.each(Object.entries(STATUT_STYLE))('applies correct colors for %s', (statut, style) => {
    render(<StatutBadge statut={statut} />);
    const span = screen.getByText(STATUT_LABEL[statut]);
    expect(span.style.background).toBe(toRgb(style.bg));
    expect(span.style.color).toBe(toRgb(style.color));
  });

  it('applies fallback gray style for unknown statut', () => {
    render(<StatutBadge statut="UNKNOWN_STATUS" />);
    const span = screen.getByText('UNKNOWN_STATUS');
    expect(span.style.background).toBe(toRgb('#f3f4f6'));
    expect(span.style.color).toBe(toRgb('#4b5563'));
  });
});
