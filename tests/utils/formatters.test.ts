import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney, truncateText } from '@/lib/pdf/companyReportPdf';

describe('Utilities - formatting', () => {
  it('Date formatter - bg-BG output', () => {
    const result = formatDate('2026-07-01');
    expect(result).toMatch(/\d{1,2}\.\d{1,2}\.\d{4}/);
  });

  it('Price formatter - EUR output', () => {
    const result = formatMoney(120.5);
    expect(result).toContain('€');
  });

  it('Text formatter - truncation', () => {
    const result = truncateText('This is a long text', 10);
    expect(result).toBe('This is...');
  });
});
