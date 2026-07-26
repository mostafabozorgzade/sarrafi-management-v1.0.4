import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4">
      <p className="text-4xl font-bold text-gray-200">۴۰۴</p>
      <p className="mt-2 text-sm text-gray-400">صفحه یافت نشد</p>
      <Link href="/dashboard" className="mt-4 text-xs text-blue-600 hover:underline">
        بازگشت به داشبورد
      </Link>
    </main>
  );
}
