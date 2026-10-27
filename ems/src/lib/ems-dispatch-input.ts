// Validation for creating/editing an EMS dispatch (shared by POST and PUT routes).
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { EMS_PURPOSES, RECEIPT_REQUIRED, ALLOWED_RECEIPT_MIME } from '@/lib/ems-constants';
import { parseDateOnly } from '@/lib/ems-server';

export const RECEIPT_DIR = path.join(process.cwd(), 'uploads', 'ems');
export const RECEIPT_FILE_RE = /^[a-f0-9]{32}\.(jpg|png|pdf)$/;

const receiptSchema = z.object({
  file: z.string().regex(RECEIPT_FILE_RE, 'Invalid receipt file'),
  originalName: z.string().trim().min(1).max(255),
  mime: z.enum(ALLOWED_RECEIPT_MIME),
});

export const dispatchInputSchema = z.object({
  dispatchDate: z.string().min(1, 'Date of dispatch is required'),
  recipientName: z.string().trim().min(2, 'Recipient name is required').max(150),
  institution: z.string().trim().min(2, 'Institution is required').max(200),
  destination: z.string().trim().min(2, 'Destination town/region is required').max(150),
  emsTrackingNumber: z
    .string()
    .trim()
    .min(5, 'EMS tracking number is too short')
    .max(50)
    .regex(/^[A-Za-z0-9\-_/]+$/, 'EMS tracking number may only contain letters, numbers, - _ /')
    .transform((v) => v.toUpperCase()),
  purpose: z.enum(EMS_PURPOSES, { errorMap: () => ({ message: 'Select a purpose' }) }),
  referenceNo: z.string().trim().min(1, 'Reference number is required').max(100),
  cost: z.coerce.number({ invalid_type_error: 'Cost must be a number' }).positive('Cost must be greater than zero').max(100000, 'Cost looks too high'),
  receipt: receiptSchema.nullable().optional(),
});

export type DispatchInput = z.infer<typeof dispatchInputSchema>;

export type ValidatedDispatch =
  | { ok: true; data: DispatchInput; date: Date }
  | { ok: false; message: string; errors?: unknown };

export function validateDispatchInput(body: unknown): ValidatedDispatch {
  const parsed = dispatchInputSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message || 'Validation failed',
      errors: parsed.error.errors,
    };
  }
  const data = parsed.data;

  const date = parseDateOnly(data.dispatchDate);
  if (!date) return { ok: false, message: 'Date of dispatch is invalid' };
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (date.getTime() > endOfToday.getTime()) return { ok: false, message: 'Date of dispatch cannot be in the future' };

  if (RECEIPT_REQUIRED && !data.receipt) return { ok: false, message: 'Please upload the receipt (JPG, PNG or PDF, max 5MB)' };
  if (data.receipt && !fs.existsSync(path.join(RECEIPT_DIR, data.receipt.file))) {
    return { ok: false, message: 'Uploaded receipt could not be found, please upload it again' };
  }

  return { ok: true, data, date };
}
