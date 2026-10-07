import { describe, expect, it } from 'vitest';
import { checkAadhaarLast4, checkMobile, checkName, checkOtp, checkPan, maskPan } from './validate';

describe('sign-up checks', () => {
  it('mobile: any 10 digits, spaces allowed', () => {
    expect(checkMobile('98765 43210')).toEqual({ ok: true, value: '9876543210' });
    expect(checkMobile('12345').ok).toBe(false);
    expect(checkMobile('98765432101').ok).toBe(false);
    expect(checkMobile('98765abc10').ok).toBe(false);
    expect(checkMobile('').ok).toBe(false);
  });
  it('OTP: exactly 6 digits (README 14: OTP < 6 digits)', () => {
    expect(checkOtp('123456').ok).toBe(true);
    expect(checkOtp('12345').ok).toBe(false);
    expect(checkOtp('12345a').ok).toBe(false);
  });
  it('name: trimmed, not empty', () => {
    expect(checkName('  Riya   S ')).toEqual({ ok: true, value: 'Riya S' });
    expect(checkName('   ').ok).toBe(false);
  });
});

describe('KYC checks', () => {
  it('PAN format AAAAA9999A (README 14: PAN wrong format)', () => {
    expect(checkPan('abcde1234f')).toEqual({ ok: true, value: 'ABCDE1234F' });
    expect(checkPan('ABCD12345F').ok).toBe(false);
    expect(checkPan('ABCDE1234').ok).toBe(false);
    expect(checkPan('').ok).toBe(false);
  });
  it('Aadhaar: last 4 digits only', () => {
    expect(checkAadhaarLast4('1234').ok).toBe(true);
    expect(checkAadhaarLast4('123').ok).toBe(false);
    expect(checkAadhaarLast4('123456789012').ok).toBe(false);
  });
  it('masks PAN for display', () => {
    expect(maskPan('abcde1234f')).toBe('ABCDE••••F');
  });
});
