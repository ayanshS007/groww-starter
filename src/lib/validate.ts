// Input checks for sign-up and KYC (PLAN item 26). Pure; screens show the messages.

export type Check = { ok: true; value: string } | { ok: false; error: string };

const digits = (s: string) => s.replace(/\D/g, '');

/** Any 10 digits (spaces and dashes ignored). */
export function checkMobile(input: string): Check {
  const d = digits(input);
  if (d.length === 0) return { ok: false, error: 'Enter your 10-digit mobile number.' };
  if (d.length !== 10 || /[^\d\s-]/.test(input)) return { ok: false, error: 'Mobile numbers have 10 digits.' };
  return { ok: true, value: d };
}

/** Any 6 digits (simulated OTP). */
export function checkOtp(input: string): Check {
  const d = input.trim();
  if (!/^\d{6}$/.test(d)) return { ok: false, error: 'Enter all 6 digits of the code.' };
  return { ok: true, value: d };
}

export function checkName(input: string): Check {
  const v = input.trim().replace(/\s+/g, ' ');
  if (v.length === 0) return { ok: false, error: 'Tell us what to call you.' };
  if (v.length > 40) return { ok: false, error: 'Keep it under 40 characters.' };
  return { ok: true, value: v };
}

/** PAN format AAAAA9999A; lower case is accepted and upper-cased. */
export function checkPan(input: string): Check {
  const v = input.trim().toUpperCase();
  if (v.length === 0) return { ok: false, error: 'Enter your PAN.' };
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(v)) return { ok: false, error: 'PAN looks like ABCDE1234F: 5 letters, 4 digits, 1 letter.' };
  return { ok: true, value: v };
}

/** Only the last 4 digits of Aadhaar are asked for. */
export function checkAadhaarLast4(input: string): Check {
  const v = input.trim();
  if (!/^\d{4}$/.test(v)) return { ok: false, error: 'Enter the last 4 digits only.' };
  return { ok: true, value: v };
}

/** "abcde1234f" → "ABCDE••••F" for display. */
export function maskPan(pan: string): string {
  const v = pan.toUpperCase();
  return v.length === 10 ? v.slice(0, 5) + '••••' + v.slice(9) : v;
}
