// src/app/(protected)/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/src/Components/Header";

export default async function ProtectedLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    return (
        <div className="min-h-screen bg-[var(--bg)]">
        <Header />
        {children}
        </div>
    );
}