// src/app/workspaces/page.tsx
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function WorkspacesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const memberships = await prisma.membership.findMany({
        where: { userId: session.user.id },
        include: { workspace: true },
        orderBy: { joinedAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-black p-6">
        <div className="max-w-xl mx-auto space-y-4">
            <div className="flex justify-between items-center">
            <h1 className="text-white text-xl">Seus workspaces</h1>
            <Link
                href="/workspaces/new"
                className="bg-white text-black rounded px-3 py-1.5 text-sm font-medium"
            >
                + Novo
            </Link>
            </div>

            {memberships.length === 0 ? (
            <p className="text-gray-400">Você ainda não faz parte de nenhum workspace.</p>
            ) : (
            memberships.map((m) => (
                <Link
                key={m.id}
                href={`/workspaces/${m.workspaceId}`}
                className="block bg-neutral-800 rounded-lg p-4 hover:bg-neutral-700"
                >
                <p className="text-white">{m.workspace.name}</p>
                <p className="text-gray-400 text-sm">{m.role}</p>
                </Link>
            ))
            )}
        </div>
        </div>
    );
}