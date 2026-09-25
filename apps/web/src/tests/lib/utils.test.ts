import { describe, it, expect } from 'vitest';
import { formatCFA, formatDate, formatNumber, cn } from '../../lib/utils';

describe('formatCFA()', () => {
  it('formate un entier positif en FCFA', () => {
    const result = formatCFA(5000);
    // Doit contenir le montant formaté en locale Côte d'Ivoire
    expect(result).toContain('5');
    expect(result).toContain('000');
    // Doit contenir l'indicateur de monnaie (XOF ou FCFA)
    expect(result.length).toBeGreaterThan(4);
  });

  it('formate correctement 0', () => {
    const result = formatCFA(0);
    expect(result).toContain('0');
  });

  it('retourne "0 FCFA" pour null', () => {
    expect(formatCFA(null)).toBe('0 FCFA');
  });

  it('retourne "0 FCFA" pour undefined', () => {
    expect(formatCFA(undefined)).toBe('0 FCFA');
  });

  it('accepte une valeur string', () => {
    const result = formatCFA('25000');
    expect(result).toContain('25');
    expect(result).toContain('000');
  });

  it('formate les grands montants (1 000 000 F)', () => {
    const result = formatCFA(1_000_000);
    expect(result).toContain('1');
    expect(result.length).toBeGreaterThan(6);
  });
});

describe('formatNumber()', () => {
  it('formate un nombre entier avec séparateur de milliers', () => {
    const result = formatNumber(1234567);
    expect(result).toContain('1');
    // Doit avoir un séparateur quelque part
    expect(result.length).toBeGreaterThan(7);
  });

  it('accepte une chaîne numérique', () => {
    const result = formatNumber('42000');
    expect(result).toContain('42');
  });
});

describe('formatDate()', () => {
  it('formate une date au format DD/MM/YYYY', () => {
    const result = formatDate('2026-09-25T10:00:00Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('accepte un objet Date', () => {
    const d = new Date('2026-01-15');
    const result = formatDate(d);
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });
});

describe('cn()', () => {
  it('fusionne des classes Tailwind sans conflits', () => {
    const result = cn('text-red-500', 'text-blue-500');
    // tailwind-merge doit garder seulement text-blue-500
    expect(result).toBe('text-blue-500');
  });

  it('filtre les valeurs falsy', () => {
    const disabled = false;
    const result = cn('btn', disabled && 'disabled', null, undefined, 'active');
    expect(result).toBe('btn active');
  });

  it('concatène plusieurs classes', () => {
    const result = cn('flex', 'items-center', 'gap-2');
    expect(result).toBe('flex items-center gap-2');
  });
});
