import { describe, it, expect } from 'vitest';
import { esCuentaOAuth, obtenerConfiguracionOAuth } from '../services/gmailApiService.js';

describe('Gmail API OAuth2 Service', () => {
  describe('1. Detección de cuentas OAuth', () => {
    it('debe reconocer a dpim3f3@gmail.com como cuenta OAuth (case insensitive)', () => {
      expect(esCuentaOAuth('dpim3f3@gmail.com')).toBe(true);
      expect(esCuentaOAuth('DPIM3F3@GMAIL.COM')).toBe(true);
      expect(esCuentaOAuth(' dpim3f3@gmail.com ')).toBe(true);
    });

    it('debe reconocer a dpim3f4@gmail.com como cuenta OAuth (case insensitive)', () => {
      expect(esCuentaOAuth('dpim3f4@gmail.com')).toBe(true);
      expect(esCuentaOAuth('DPIM3F4@GMAIL.COM')).toBe(true);
      expect(esCuentaOAuth(' dpim3f4@gmail.com ')).toBe(true);
    });

    it('debe devolver la configuración correspondiente para cada cuenta', () => {
      const cfg3 = obtenerConfiguracionOAuth('dpim3f3@gmail.com');
      const cfg4 = obtenerConfiguracionOAuth('dpim3f4@gmail.com');

      expect(cfg3).not.toBeNull();
      expect(cfg4).not.toBeNull();
      expect(cfg3?.user).toBe('dpim3f3@gmail.com');
      expect(cfg4?.user).toBe('dpim3f4@gmail.com');
      expect(cfg3?.clientId).toBe(cfg4?.clientId);
      expect(cfg3?.clientSecret).toBe(cfg4?.clientSecret);
      expect(cfg3?.refreshToken).not.toBe(cfg4?.refreshToken);
    });

    it('no debe marcar cuentas SMTP estándar como OAuth', () => {
      expect(esCuentaOAuth('dpi2m3f@gmail.com')).toBe(false);
      expect(esCuentaOAuth('dpim3f@gmail.com')).toBe(false);
      expect(esCuentaOAuth('otra@dominio.com')).toBe(false);
      expect(esCuentaOAuth('')).toBe(false);
    });
  });
});
