// src/app/invites/page.tsx
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { respondInvite } from "./actions";

export default async function InvitesPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const invites = await prisma.invite.findMany({
        where: { email: session.user.email, status: "PENDING" },
        include: { workspace: true },
    });

    return (
        <div className="min-h-screen bg-black p-6">
        <div className="max-w-md mx-auto space-y-4">
            <h1 className="text-white text-xl">Convites pendentes</h1>

            {invites.length === 0 ? (
            <p className="text-gray-400">Nenhum convite pendente.</p>
            ) : (
            invites.map((invite) => (
                <div key={invite.id} className="bg-neutral-800 rounded-lg p-4 flex justify-between items-center">
                <span className="text-white">{invite.workspace.name}</span>
                <div className="flex gap-2">
                    <form action={respondInvite.bind(null, invite.id, true)}>
                    <button className="bg-white text-black rounded px-3 py-1.5 text-sm">
                        Aceitar
                    </button>
                    </form>
                    <form action={respondInvite.bind(null, invite.id, false)}>
                    <button className="bg-neutral-700 text-white rounded px-3 py-1.5 text-sm">
                        Recusar
                    </button>
                    </form>
                </div>
                </div>
            ))
            )}
        </div>
        </div>
    );
}