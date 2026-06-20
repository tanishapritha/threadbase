// lib/resend.ts
import { Resend } from "resend";

let _resend: Resend | null = null;

/**
 * Lazily initialised Resend client.
 * Created on first use so that a missing RESEND_API_KEY does not crash
 * module evaluation during Next.js builds (collecting page data).
 */
export function getResend(): Resend | undefined {
  if (!process.env.RESEND_API_KEY) {
    return undefined;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
