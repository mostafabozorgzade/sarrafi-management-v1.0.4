import { Logo } from "@/components/login/logo";
import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[#fafafa] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-[5px] bg-white border border-gray-200/80 p-6 space-y-8">
            <Logo />
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
