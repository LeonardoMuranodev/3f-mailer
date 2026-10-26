import { describe, it, expect, vi } from 'vitest';
import { esCuentaOAuth } from '../services/gmailApiService.js';

describe('Gmail API OAuth2 Service', () => {
  describe('1. Detección de cuenta OAuth', () => {
    it('debe reconocer a dpim3f3@gmail.com como cuenta OAuth (case insensitive)', () => {
      expect(esCuentaOAuth('dpim3f3@gmail.com')).toBe(true);
      expect(esCuentaOAuth('DPIM3F3@GMAIL.COM')).toBe(true);
      expect(esCuentaOAuth(' dpim3f3@gmail.com ')).toBe(true);
    });

    it('no debe marcar cuentas SMTP estándar como OAuth', () => {
      expect(esCuentaOAuth('dpi2m3f@gmail.com')).toBe(false);
      expect(esCuentaOAuth('dpim3f@gmail.com')).toBe(false);
      expect(esCuentaOAuth('otra@dominio.com')).toBe(false);
      expect(esCuentaOAuth('')).toBe(false);
    });
  });
});
