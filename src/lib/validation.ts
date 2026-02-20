import { z } from 'zod';

export const onboardingSchema = z.object({
  parentName: z.string().min(2, 'Navn skal være mindst 2 tegn'),
  parentEmail: z.string().email('Ugyldig email-adresse'),
  childName: z.string().min(1, 'Barnets navn er påkrævet'),
  childBirthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig dato')
    .refine((d) => !Number.isNaN(Date.parse(d)), 'Ugyldig dato'),
  otherParentEmail: z
    .string()
    .email('Ugyldig email-adresse')
    .optional()
    .or(z.literal('')),
});

export const expenseSchema = z.object({
  title: z.string().min(1, 'Titel er påkrævet').max(200, 'Titel er for lang'),
  amount: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, 'Ugyldigt beløb (brug f.eks. 123 eller 123,50)'),
  description: z.string().max(1000, 'Beskrivelse er for lang').optional(),
  category: z.enum([
    'institution',
    'medical',
    'clothing',
    'activities',
    'school',
    'food',
    'transport',
    'other',
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ugyldig dato'),
});

export const calendarSourceSchema = z.object({
  name: z.string().min(1, 'Navn er påkrævet').max(100, 'Navn er for langt'),
  url: z
    .string()
    .url('Ugyldig URL')
    .refine(
      (url) => url.startsWith('https://') || url.startsWith('webcal://'),
      'Kun HTTPS og WebCal URLs er tilladt'
    ),
  type: z.enum(['work', 'personal', 'school', 'other']),
});

export const taskSchema = z.object({
  title: z.string().min(1, 'Titel er påkrævet').max(200, 'Titel er for lang'),
  category: z.enum([
    'general',
    'shopping',
    'child',
    'handover',
    'meeting',
    'expense',
    'cleaning',
  ]),
  assignedTo: z.string().optional(),
  deadline: z.string().optional(),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Besked må ikke være tom')
    .max(5000, 'Besked er for lang'),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
export type ExpenseData = z.infer<typeof expenseSchema>;
export type CalendarSourceData = z.infer<typeof calendarSourceSchema>;
export type TaskData = z.infer<typeof taskSchema>;
export type MessageData = z.infer<typeof messageSchema>;
