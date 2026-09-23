export function isValidCUIT(cuit: string): boolean {
  if (!cuit || typeof cuit !== 'string') return false;
  // Debe contener exactamente 11 dígitos
  if (!/^\d{11}$/.test(cuit)) return false;

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let total = 0;

  for (let i = 0; i < 10; i++) {
    total += parseInt(cuit[i]) * multipliers[i];
  }

  const mod = total % 11;
  let checkDigit = mod === 0 ? 0 : 11 - mod;

  if (checkDigit === 10) {
    const prefix = cuit.substring(0, 2);
    if (prefix === '20' || prefix === '23' || prefix === '24') {
      checkDigit = 9;
    } else if (prefix === '27') {
      checkDigit = 4;
    } else {
      checkDigit = 9;
    }
  }

  return checkDigit === parseInt(cuit[10]);
}
