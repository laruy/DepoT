// src/app/workspaces/[id]/page.tsx
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { requireMembership } from "@/src/lib/authorization";
import { inviteMember } from "./actions";

export default async function WorkspacePage({
    params,
    }: {
    params: Promise<{ id: string }>;
    }) {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const membership = await requireMembership(session.user.id, id).catch(() => null);
    if (!membership) redirect("/workspaces");

    const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
        memberships: { include: { user: true } },
        invites: { where: { status: "PENDING" } },
        },
    });
    if (!workspace) redirect("/workspaces");

    return (
        <div className="min-h-screen bg-black p-6">
        <div className="max-w-xl mx-auto space-y-6">
            <div>
            <h1 className="text-white text-xl">{workspace.name}</h1>
            {workspace.description && (
                <p className="text-gray-400 text-sm">{workspace.description}</p>
            )}
            </div>

            <div>
            <h2 className="text-gray-300 text-sm mb-2">Membros</h2>
            <div className="space-y-1">
                {workspace.memberships.map((m) => (
                <div key={m.id} className="flex justify-between bg-neutral-800 rounded p-2">
                    <span className="text-white text-sm">{m.user.email}</span>
                    <span className="text-gray-400 text-xs">{m.role}</span>
                </div>
                ))}
            </div>
            </div>

            {membership.role === "OWNER" && (
            <div>
                <h2 className="text-gray-300 text-sm mb-2">Convidar membro</h2>
                <form action={inviteMember.bind(null, workspace.id)} className="flex gap-2">
                <input
                    name="email"
                    type="email"
                    required
                    placeholder="email@exemplo.com"
                    className="flex-1 rounded bg-neutral-900 text-white p-2"
                />
                <button className="bg-white text-black rounded px-3 py-2 text-sm font-medium">
                    Convidar
                </button>
                </form>

                {workspace.invites.length > 0 && (
                <div className="mt-2 space-y-1">
                    {workspace.invites.map((i) => (
                    <p key={i.id} className="text-gray-500 text-xs">
                        {i.email} — pendente
                    </p>
                    ))}
                </div>
                )}
            </div>
            )}
        </div>
        </div>
    );
}