import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { requireMembership } from "@/src/lib/authorization";
import InviteMemberModal from "@/src/Components/InviteMemberModal";
import FeatureModal from "@/src/Components/FeatureModal";
import FeaturesGrid from "@/src/Components/FeaturesGrid";

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
            features: {
                orderBy: { updatedAt: "desc" },
                include: { _count: { select: { testCases: true } } },
            },
        },
    });
    if (!workspace) redirect("/workspaces");

    const features = workspace.features.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        color: f.color,
        maestroTags: f.maestroTags,
        testCaseCount: f._count.testCases,
    }));

    return (
        <main className="mx-auto max-w-7xl px-6 py-12">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--rule)] pb-6">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
                        Workspace
                    </p>
                    <h1 className="font-display mt-2 text-3xl text-[var(--text-primary)]">
                        {workspace.name}
                    </h1>
                    {workspace.description && (
                        <p className="font-body mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                            {workspace.description}
                        </p>
                    )}
                </div>

                <FeatureModal
                    workspaceId={workspace.id}
                    className="font-mono shrink-0 rounded-sm bg-[var(--text-primary)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-black"
                >
                    + nova feature
                </FeatureModal>
            </div>

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
                {/* Features — conteúdo central */}
                <section>
                    <FeaturesGrid features={features} workspaceId={workspace.id} />
                </section>

                {/* Membros — painel lateral */}
                <aside>
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Membros · {String(workspace.memberships.length).padStart(2, "0")}
                    </p>

                    <div className="mt-3 space-y-2 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-4">
                        {workspace.memberships.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center justify-between gap-2 rounded-sm border border-[var(--rule)] px-3 py-2"
                            >
                                <span className="font-body truncate text-sm text-[var(--text-primary)]">
                                    {m.user.email}
                                </span>
                                <span className="font-mono shrink-0 text-xs text-[var(--text-muted)]">
                                    {m.role}
                                </span>
                            </div>
                        ))}
                    </div>

                    {membership.role === "OWNER" && (
                        <div className="mt-4">
                            <InviteMemberModal
                                workspaceId={workspace.id}
                                className="font-mono block w-full rounded-sm border border-dashed border-[var(--rule)] p-3 text-center text-xs text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                            >
                                + convidar membro
                            </InviteMemberModal>

                            {workspace.invites.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    {workspace.invites.map((i) => (
                                        <p
                                            key={i.id}
                                            className="font-mono text-xs text-[var(--text-muted)]/70"
                                        >
                                            {i.email} — pendente
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            </div>
        </main>
    );
}