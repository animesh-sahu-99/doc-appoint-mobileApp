import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const bookingSchema = z.object({
  reason: z.string().min(1, { message: 'Please select a reason' }),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CARD', 'UPI', 'CASH'], { required_error: 'Please select a payment method' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
