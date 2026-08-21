import { z } from "zod";

/** Strip angle brackets and control chars to neutralise XSS payloads before storage/render. */
export const sanitize = (value: string) =>
  value
    .replace(/[<>]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();

const nameRule = z
  .string()
  .transform(sanitize)
  .pipe(
    z
      .string()
      .min(3, { message: "Name must be at least 3 characters" })
      .max(60, { message: "Name must be less than 60 characters" })
      .regex(/^[A-Za-z][A-Za-z .]*$/, {
        message: "Name can contain letters and spaces only",
      }),
  );

export const checkoutSchema = z.object({
  full_name: nameRule,
  email: z
    .string()
    .transform(sanitize)
    .pipe(
      z
        .string()
        .email({ message: "Enter a valid email address" })
        .max(255, { message: "Email is too long" }),
    ),
  phone: z
    .string()
    .transform((v) => sanitize(v).replace(/\s|-/g, ""))
    .pipe(
      z.string().regex(/^[6-9]\d{9}$/, {
        message: "Enter a valid 10-digit mobile number",
      }),
    ),
  pincode: z
    .string()
    .transform(sanitize)
    .pipe(z.string().regex(/^[1-9]\d{5}$/, { message: "Enter a valid 6-digit PIN code" })),
  address_line: z
    .string()
    .transform(sanitize)
    .pipe(
      z
        .string()
        .min(8, { message: "Address must be at least 8 characters" })
        .max(200, { message: "Address must be less than 200 characters" }),
    ),
  city: z
    .string()
    .transform(sanitize)
    .pipe(
      z
        .string()
        .min(2, { message: "Enter your city" })
        .max(60, { message: "City name is too long" })
        .regex(/^[A-Za-z][A-Za-z .()-]*$/, { message: "City can contain letters only" }),
    ),
  state: z
    .string()
    .transform(sanitize)
    .pipe(
      z
        .string()
        .min(2, { message: "Enter your state" })
        .max(60, { message: "State name is too long" })
        .regex(/^[A-Za-z][A-Za-z .()-]*$/, { message: "State can contain letters only" }),
    ),
});

export type CheckoutForm = z.infer<typeof checkoutSchema>;

export type PincodeLookup = { city: string; state: string } | null;

/** Look up an Indian PIN code and return the post office district/state. */
export async function lookupPincode(pincode: string): Promise<PincodeLookup> {
  if (!/^[1-9]\d{5}$/.test(pincode)) return null;
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!res.ok) return null;
  const json = (await res.json()) as Array<{
    Status: string;
    PostOffice?: Array<{ District: string; State: string; Block?: string }> | null;
  }>;
  const entry = json?.[0];
  const office = entry?.PostOffice?.[0];
  if (entry?.Status !== "Success" || !office) return null;
  return { city: sanitize(office.District), state: sanitize(office.State) };
}
