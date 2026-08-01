"use client";

import { useState } from "react";
import { Phone, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";

export function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!mobile) {
      setServerError("شماره موبایل الزامی است");
      return;
    }
    if (!/^09\d{9}$/.test(mobile)) {
      setServerError("شماره موبایل صحیح نیست");
      return;
    }
    if (!password) {
      setServerError("رمز عبور الزامی است");
      return;
    }

    setIsLoading(true);
    const result = await login(mobile, password);
    if (!result.success) {
      setServerError(result.error || "خطا در ورود");
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 animate-fade-in">
      {serverError && <ErrorAlert message={serverError} />}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">شماره موبایل <span className="text-red-500">*</span></label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Phone className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </div>
          <Input
            type="tel"
            placeholder="09123456789"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="h-12 pr-10 pl-3 rounded-[5px]"
            autoComplete="tel"
            inputMode="numeric"
            maxLength={11}
          />
        </div>
        <p className="text-[10px] text-gray-300 pr-1">+98</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">رمز عبور <span className="text-red-500">*</span></label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Lock className="h-4 w-4 text-gray-300" strokeWidth={1.5} />
          </div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pr-10 pl-10 rounded-[5px]"
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

      <Button type="submit" isLoading={isLoading} className="w-full h-12 rounded-[5px] bg-gray-900 hover:bg-gray-800">
        <LogIn className="h-4 w-4" strokeWidth={1.5} />
        ورود به حساب
      </Button>

      <div className="flex items-center justify-between pt-1">
        <button type="button" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">فراموشی رمز</button>
        <button type="button" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">پشتیبانی</button>
      </div>
    </form>
  );
}
