import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireMembership } from "@/src/lib/authorization";
import TestPlanModal from "@/src/Components/TestPlanModal";
import TestPlanCaseSelector from "@/src/Components/TestPlanCaseSelector";
import { startTestRun } from "./runs/actions";

export default async function TestPlanDetailPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string; testPlanSlug: string }>;
}) {
    const { workspaceSlug, testPlanSlug } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const workspace = await prisma.workspace.findFirst({
        where: { slug: workspaceSlug },
    });
    if (!workspace) redirect("/dashboard");

    const membership = await requireMembership(session.user.id, workspace.id).catch(() => null);
    if (!membership) redirect("/dashboard");

    const [plan, allFeatures] = await Promise.all([
        prisma.testPlan.findFirst({
            where: { slug: testPlanSlug, workspaceId: workspace.id },
            include: {
                cases: {
                    orderBy: { addedAt: "asc" },
                    include: {
                        testCase: {
                            include: { feature: { select: { id: true, name: true, color: true } } },
                        },
                    },
                },
                runs: {
                    orderBy: { startedAt: "desc" },
                    take: 10,
                    include: {
                        executedBy: { select: { name: true, email: true } },
                        _count: { select: { caseRuns: true } },
                        caseRuns: { select: { status: true } },
                    },
                },
            },
        }),
        prisma.feature.findMany({
            where: { workspaceId: workspace.id },
            orderBy: { name: "asc" },
            include: { testCases: { orderBy: { createdAt: "asc" } } },
        }),
    ]);
    if (!plan) redirect(`/workspaces/${workspaceSlug}/test-plans`);

    const features = allFeatures.map((f) => ({
        id: f.id,
        name: f.name,
        color: f.color,
        testCases: f.testCases
            .filter((tc) => plan.type === "MANUAL" || tc.isAutomated)
            .map((tc) => ({
                id: tc.id,
                title: tc.title,
                tags: tc.tags,
                isAutomated: tc.isAutomated,
                priority: tc.priority,
            })),
    }));

    const planCases = plan.cases.map((pc) => ({
        id: pc.testCase.id,
        title: pc.testCase.title,
        tags: pc.testCase.tags,
        isAutomated: pc.testCase.isAutomated,
        priority: pc.testCase.priority,
        featureName: pc.testCase.feature.name,
        featureColor: pc.testCase.feature.color,
    }));

    const allTags = Array.from(new Set(
        features.flatMap((f) => f.testCases)
            .flatMap((tc) => tc.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [])
    )).sort();

    const startRun = startTestRun.bind(null, workspaceSlug, testPlanSlug);

    const RUN_STATUS_LABEL: Record<string, string> = {
        IN_PROGRESS: "Em andamento",
        COMPLETED: "Concluída",
        ABORTED: "Abortada",
    };

    const RUN_STATUS_COLOR: Record<string, string> = {
        IN_PROGRESS: "var(--red-signal)",
        COMPLETED: "var(--text-muted)",
        ABORTED: "var(--text-muted)",
    };

    return (
        <main className="mx-auto max-w-7xl px-6 py-12">
            <div className="border-b border-[var(--rule)] pb-6">
                <Link
                    href={`/workspaces/${workspaceSlug}/test-plans`}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                >
                    ← voltar aos planos
                </Link>

                <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`font-mono rounded-sm border px-2 py-0.5 text-xs uppercase tracking-[0.1em] ${
                                plan.type === "AUTOMATED"
                                    ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                                    : "border-[var(--rule)] text-[var(--text-muted)]"
                            }`}>
                                {plan.type === "AUTOMATED" ? "Automatizado" : "Manual"}
                            </span>
                            <h1 className="font-display text-3xl text-[var(--text-primary)]">
                                {plan.name}
                            </h1>
                        </div>
                        {plan.description && (
                            <p className="font-body mt-2 text-sm text-[var(--text-muted)]">
                                {plan.description}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <TestPlanModal
                            workspaceSlug={workspaceSlug}
                            plan={{ id: plan.id, slug: plan.slug, name: plan.name, description: plan.description, type: plan.type }}
                            className="font-mono rounded-sm border border-[var(--rule)] px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                        >
                            Editar plano
                        </TestPlanModal>

                        {plan.cases.length > 0 && (
                            <form action={startRun}>
                                <button
                                    type="submit"
                                    className="font-mono rounded-sm bg-[var(--text-primary)] px-4 py-1.5 text-xs uppercase tracking-[0.1em] text-black"
                                >
                                    Iniciar execução →
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Histórico de runs */}
            {plan.runs.length > 0 && (
                <div className="mt-8">
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Histórico · {plan.runs.length}
                    </p>
                    <ul className="mt-3 space-y-2">
                        {plan.runs.map((run) => {
                            const passed = run.caseRuns.filter((cr) => cr.status === "PASSED").length;
                            const failed = run.caseRuns.filter((cr) => cr.status === "FAILED").length;
                            const skipped = run.caseRuns.filter((cr) => cr.status === "SKIPPED").length;
                            const total = run._count.caseRuns;

                            return (
                                <li key={run.id}>
                                    <Link
                                        href={`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}/runs/${run.id}`}
                                        className="flex items-center justify-between rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] px-5 py-4 transition-colors hover:border-[var(--red-signal)]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span
                                                className="font-mono rounded-sm border px-2 py-0.5 text-xs uppercase tracking-[0.1em]"
                                                style={{
                                                    borderColor: RUN_STATUS_COLOR[run.status],
                                                    color: RUN_STATUS_COLOR[run.status],
                                                }}
                                            >
                                                {RUN_STATUS_LABEL[run.status]}
                                            </span>
                                            <span className="font-mono text-xs text-[var(--text-muted)]">
                                                {new Date(run.startedAt).toLocaleDateString("pt-BR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                            {run.executedBy && (
                                                <span className="font-body text-sm text-[var(--text-muted)]">
                                                    {run.executedBy.name ?? run.executedBy.email}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="flex gap-3 font-mono text-xs">
                                                <span style={{ color: "#22c55e" }}>✓ {passed}</span>
                                                <span style={{ color: "var(--red-signal)" }}>✕ {failed}</span>
                                                <span style={{ color: "#f59e0b" }}>— {skipped}</span>
                                                <span className="text-[var(--text-muted)]">/{total}</span>
                                            </div>

                                            {total > 0 && (
                                                <div className="flex h-1.5 w-24 overflow-hidden rounded-full bg-[var(--rule)]">
                                                    <div style={{ width: `${(passed / total) * 100}%`, backgroundColor: "#22c55e" }} />
                                                    <div style={{ width: `${(failed / total) * 100}%`, backgroundColor: "var(--red-signal)" }} />
                                                    <div style={{ width: `${(skipped / total) * 100}%`, backgroundColor: "#f59e0b" }} />
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {/* Casos do plano */}
            <div className="mt-8">
                <TestPlanCaseSelector
                    workspaceSlug={workspaceSlug}
                    testPlanSlug={testPlanSlug}
                    planType={plan.type}
                    planCases={planCases}
                    features={features}
                    allTags={allTags}
                />
            </div>
        </main>
    );
}