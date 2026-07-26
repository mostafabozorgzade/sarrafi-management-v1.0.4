import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "SarafiX",
};

export default function Home() {
  redirect("/login");
}
