import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const generatedId = React.useId();
    return (
      <input
        type={type}
        id={generatedId}
        className={cn(
          "flex h-12 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors",
          "placeholder:text-gray-300",
          "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-400" : "border-gray-200",
          className
        )}
        ref={ref}
        dir="ltr"
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
