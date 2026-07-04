import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { respondInvite } from "../invites/actions";
import CreateWorkspaceModal from "@/src/Components/CreateWorkspaceModal";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) redirect("/login");

    const [memberships, invites] = await Promise.all([
        prisma.membership.findMany({
        where: { userId: session.user.id },
        include: { workspace: true },
        orderBy: { joinedAt: "desc" },
        }),
        prisma.invite.findMany({
        where: { email: session.user.email, status: "PENDING" },
        include: { workspace: true },
        }),
    ]);

    return (
        <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
            Meus repositórios
        </p>
        <h1 className="font-display mt-3 text-4xl text-[var(--text-primary)]">
            Bem-vindo de volta{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
        </h1>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Workspaces */}
            <section>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Workspaces · {String(memberships.length).padStart(2, "0")}
            </p>

            <div className="mt-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-8">
                {memberships.length === 0 ? (
                <div className="flex flex-col items-center text-center">
                    <CreateWorkspaceModal className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--red-deep)] text-2xl text-[var(--red-signal)]">
                    +
                    </CreateWorkspaceModal>
                    <h2 className="font-display mt-4 text-xl text-[var(--text-primary)]">
                        Nenhum workspace ainda.
                    </h2>
                    <p className="font-body mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                        Crie o primeiro repositório para começar a arquivar casos de teste, execuções e regressões da sua equipe.
                    </p>
                    <CreateWorkspaceModal className="font-body mt-6 rounded-sm bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-black">
                        Criar novo workspace →
                    </CreateWorkspaceModal>
                    <p className="font-mono mt-4 text-xs text-[var(--text-muted)]/70">
                        # você se torna owner automaticamente.
                    </p>
                </div>
                ) : (
                <ul className="space-y-2">
                    {memberships.map((m) => (
                    <li key={m.id}>
                        <Link
                        href={`/workspaces/${m.workspaceId}`}
                        className="flex items-center justify-between rounded-sm border border-[var(--rule)] p-4 transition-colors hover:border-[var(--red-signal)]"
                        >
                        <span className="font-body text-[var(--text-primary)]">{m.workspace.name}</span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">{m.role}</span>
                        </Link>
                    </li>
                    ))}
                    <li>
                    <CreateWorkspaceModal className="font-mono block w-full rounded-sm border border-dashed border-[var(--rule)] p-3 text-center text-xs text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]">
                        + novo workspace
                    </CreateWorkspaceModal>
                    </li>
                </ul>
                )}
            </div>
            </section>

            {/* Convites */}
            <section>
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Convites · {String(invites.length).padStart(2, "0")}
            </p>

            <div className="mt-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-6">
                {invites.length === 0 ? (
                <div>
                    <p className="font-mono text-xs text-[var(--text-muted)]">● caixa vazia</p>
                    <h2 className="font-display mt-2 text-lg text-[var(--text-primary)]">
                    Você não tem convites pendentes.
                    </h2>
                    <p className="font-mono mt-4 text-xs leading-relaxed text-[var(--text-muted)]/70">
                    # quando um owner convidar seu e-mail para um workspace,
                    <br />
                    # o convite aparece aqui para aceite ou recusa.
                    </p>
                </div>
                ) : (
                <ul className="space-y-3">
                    {invites.map((invite) => (
                    <li key={invite.id} className="rounded-sm border border-[var(--rule)] p-3">
                        <p className="font-body text-sm text-[var(--text-primary)]">{invite.workspace.name}</p>
                        <div className="mt-2 flex gap-2">
                        <form action={respondInvite.bind(null, invite.id, true)}>
                            <button className="font-mono rounded-sm bg-[var(--text-primary)] px-3 py-1 text-xs text-black">
                            Aceitar
                            </button>
                        </form>
                        <form action={respondInvite.bind(null, invite.id, false)}>
                            <button className="font-mono rounded-sm border border-[var(--rule)] px-3 py-1 text-xs text-[var(--text-muted)]">
                            Recusar
                            </button>
                        </form>
                        </div>
                    </li>
                    ))}
                </ul>
                )}
            </div>
            </section>
        </div>
        </main>
    );
}