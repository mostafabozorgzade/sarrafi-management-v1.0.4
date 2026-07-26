"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { loginSchema, type LoginFormData } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async () => {
    setServerError(null);
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/dashboard");
    } catch {
      setServerError("خطا در اتصال به سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-3">
      {serverError && <ErrorAlert message={serverError} />}

      <div className="space-y-1">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Phone className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </div>
          <Input
            {...register("mobile")}
            type="tel"
            placeholder="09123456789"
            error={errors.mobile?.message}
            className="h-12 pr-10 pl-3"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={11}
          />
        </div>
        {!errors.mobile && (
          <p className="text-[10px] text-gray-300 pr-1">+98 | شماره موبایل</p>
        )}
      </div>

      <div className="space-y-1">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Lock className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </div>
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="رمز عبور"
            error={errors.password?.message}
            className="h-12 pr-10 pl-10"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-300 hover:text-gray-500"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full h-12">
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        ورود به حساب
      </Button>

      <div className="flex items-center justify-between pt-1">
        <button type="button" className="text-xs text-gray-400 hover:text-blue-600">فراموشی رمز</button>
        <button type="button" className="text-xs text-gray-400 hover:text-blue-600">پشتیبانی</button>
      </div>
    </form>
  );
}
