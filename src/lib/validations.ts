import { z } from "zod";

export const loginSchema = z.object({
  mobile: z
    .string()
    .min(1, "شماره موبایل الزامی است")
    .regex(/^09\d{9}$/, "شماره موبایل صحیح نیست"),
  password: z
    .string()
    .min(1, "رمز عبور الزامی است")
    .min(6, "رمز عبور حداقل ۶ کاراکتر است"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
