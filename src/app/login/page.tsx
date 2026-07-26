import { Logo } from "@/components/login/logo";
import { LoginForm } from "@/components/login/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-10">
        <Logo />
        <LoginForm />
      </div>
    </main>
  );
}
