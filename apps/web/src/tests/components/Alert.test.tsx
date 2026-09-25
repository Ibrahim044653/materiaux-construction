import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Alert } from '../../components/ui/Alert';

describe('Alert', () => {
  it('affiche le message enfant', () => {
    render(<Alert variant="info">Informations importantes</Alert>);
    expect(screen.getByText('Informations importantes')).toBeInTheDocument();
  });

  it('applique la variante "danger" (classes rouge)', () => {
    const { container } = render(<Alert variant="danger">Erreur</Alert>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/danger|red/i);
  });

  it('applique la variante "success" (classes verte)', () => {
    const { container } = render(<Alert variant="success">Succès</Alert>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/success|green/i);
  });

  it('applique la variante "warning" (classes orange)', () => {
    const { container } = render(<Alert variant="warning">Attention</Alert>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/warning|orange|yellow/i);
  });

  it('affiche le bouton de fermeture si onClose est fourni', () => {
    const onClose = vi.fn();
    render(
      <Alert variant="info" onClose={onClose}>
        Message
      </Alert>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it("n'affiche pas de bouton si onClose est absent", () => {
    render(<Alert variant="info">Message</Alert>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('appelle onClose au clic sur le bouton de fermeture', () => {
    const onClose = vi.fn();
    render(
      <Alert variant="info" onClose={onClose}>
        Message
      </Alert>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
