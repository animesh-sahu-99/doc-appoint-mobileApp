import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const patientRegisterSchema = z.object({
    name: z.string().min(2, { message: 'Name is required' }),
    countryCode: z.string().regex(/^\+[0-9]{1,4}$/, { message: 'Invalid country code format' }),
    phoneNumber: z.string().regex(/^[0-9]{7,15}$/, { message: 'Phone number must be 7-15 digits' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z.string().min(6, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

export const doctorRegisterSchema = z.object({
    name: z.string().min(2, { message: 'Name is required' }),
    licenseNumber: z.string().min(4, { message: 'Valid medical license number is required' }),
    specialization: z.string().min(2, { message: 'Please select a specialization' }),
    countryCode: z.string().regex(/^\+[0-9]{1,4}$/, { message: 'Invalid country code format' }),
    phoneNumber: z.string().regex(/^[0-9]{7,15}$/, { message: 'Phone number must be 7-15 digits' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const bookingSchema = z.object({
    reason: z.string().min(1, { message: 'Please select a reason' }),
    notes: z.string().optional(),
    paymentMethod: z.enum(['CARD', 'UPI', 'CASH'], { required_error: 'Please select a payment method' }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type PatientRegisterFormData = z.infer<typeof patientRegisterSchema>;
export type DoctorRegisterFormData = z.infer<typeof doctorRegisterSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
