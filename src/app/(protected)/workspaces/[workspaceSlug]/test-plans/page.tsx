import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireMembership } from "@/src/lib/authorization";
import TestPlanModal from "@/src/Components/TestPlanModal";

export default async function TestPlansPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string }>;
}) {
    const { workspaceSlug } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const workspace = await prisma.workspace.findFirst({
        where: { slug: workspaceSlug },
    });
    if (!workspace) redirect("/dashboard");

    const membership = await requireMembership(session.user.id, workspace.id).catch(() => null);
    if (!membership) redirect("/dashboard");

    const testPlans = await prisma.testPlan.findMany({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { cases: true } } },
    });

    return (
        <main className="mx-auto max-w-5xl px-6 py-12">
            <div className="flex items-start justify-between border-b border-[var(--rule)] pb-6">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
                        {workspace.name}
                    </p>
                    <h1 className="font-display mt-2 text-3xl text-[var(--text-primary)]">
                        Test Plans
                    </h1>
                </div>

                <TestPlanModal
                    workspaceSlug={workspaceSlug}
                    className="font-mono shrink-0 rounded-sm bg-[var(--text-primary)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-black"
                >
                    + novo plano
                </TestPlanModal>
            </div>

            <div className="mt-8">
                {testPlans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-[var(--rule)] py-24 text-center">
                        <p className="font-display text-xl text-[var(--text-primary)]">
                            Nenhum plano ainda.
                        </p>
                        <p className="font-body mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                            Crie um plano pra organizar e executar seus casos de teste.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {testPlans.map((plan) => (
                            <li key={plan.id}>
                                <Link
                                    href={`/workspaces/${workspaceSlug}/test-plans/${plan.slug}`}
                                    className="flex items-center justify-between rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] px-5 py-4 transition-colors hover:border-[var(--red-signal)]"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`font-mono rounded-sm border px-2 py-0.5 text-xs uppercase tracking-[0.1em] ${
                                            plan.type === "AUTOMATED"
                                                ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                                                : "border-[var(--rule)] text-[var(--text-muted)]"
                                        }`}>
                                            {plan.type === "AUTOMATED" ? "Auto" : "Manual"}
                                        </span>
                                        <span className="font-body text-[var(--text-primary)]">{plan.name}</span>
                                        {plan.description && (
                                            <span className="font-body hidden text-sm text-[var(--text-muted)] sm:block">
                                                {plan.description}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-mono text-xs text-[var(--text-muted)]">
                                        {plan._count.cases} caso{plan._count.cases !== 1 ? "s" : ""}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}