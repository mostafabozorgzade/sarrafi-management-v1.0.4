import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "صرافیکس",
};

export default function Home() {
  redirect("/login");
}
