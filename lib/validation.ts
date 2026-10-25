import { z } from "zod";
import { isScheduledDate, SLOTS } from "@/lib/event";

export const bookingSchema = z.object({
  date: z.string().refine(isScheduledDate, "Please choose a date between 26 October and 31 December 2026."),
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  enrollmentNumber: z
    .string()
    .trim()
    .min(4, "Please enter a valid enrollment number.")
    .max(30)
    .regex(/^[A-Za-z0-9/-]+$/, "Use letters, numbers, / or - only.")
    .transform((value) => value.toUpperCase()),
  department: z.string().trim().min(2, "Please enter your department.").max(100),
  semester: z.coerce.number<number>().int().min(1).max(12),
  slotId: z.string().refine((value) => SLOTS.some((slot) => slot.id === value), {
    message: "Please choose one of the available times.",
  }),
  // A hidden field that real visitors never fill in.
  website: z.string().max(0).optional(),
});

export type BookingInput = Omit<z.infer<typeof bookingSchema>, "website">;
