import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireMembership } from "@/src/lib/authorization";
import TestRunView from "@/src/Components/TestRunView";

export default async function TestRunPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string; testPlanSlug: string; runId: string }>;
}) {
    const { workspaceSlug, testPlanSlug, runId } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const workspace = await prisma.workspace.findFirst({
        where: { slug: workspaceSlug },
        include: { jiraConfig: true },
    });
    if (!workspace) redirect("/dashboard");

    const membership = await requireMembership(session.user.id, workspace.id).catch(() => null);
    if (!membership) redirect("/dashboard");

    const run = await prisma.testRun.findFirst({
        where: {
            id: runId,
            testPlan: { slug: testPlanSlug, workspaceId: workspace.id },
        },
        include: {
            testPlan: { select: { name: true, slug: true } },
            caseRuns: {
                orderBy: { id: "asc" },
                include: {
                    testCase: {
                        include: {
                            feature: { select: { name: true, color: true } },
                        },
                    },
                    jiraLinks: true,
                },
            },
        },
    });
    if (!run) redirect(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);

    const caseRuns = run.caseRuns.map((cr) => ({
        id: cr.id,
        status: cr.status,
        notes: cr.notes,
        executedAt: cr.executedAt?.toISOString() ?? null,
        testCase: {
            id: cr.testCase.id,
            title: cr.testCase.title,
            steps: cr.testCase.steps,
            expectedResult: cr.testCase.expectedResult,
            priority: cr.testCase.priority,
            isAutomated: cr.testCase.isAutomated,
            tags: cr.testCase.tags,
            featureName: cr.testCase.feature.name,
            featureColor: cr.testCase.feature.color,
        },
        jiraLinks: cr.jiraLinks.map((j) => ({
            id: j.id,
            ticketKey: j.ticketKey,
            ticketUrl: j.ticketUrl,
        })),
    }));

    return (
        <main className="mx-auto max-w-7xl px-6 py-12">
            <div className="border-b border-[var(--rule)] pb-6">
                <Link
                    href={`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                >
                    ← voltar ao plano
                </Link>
                <div className="mt-3 flex items-center justify-between">
                    <div>
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
                            {run.testPlan.name}
                        </p>
                        <h1 className="font-display mt-1 text-3xl text-[var(--text-primary)]">
                            Execução
                        </h1>
                    </div>
                    <span className={`font-mono rounded-sm border px-3 py-1 text-xs uppercase tracking-[0.1em] ${
                        run.status === "IN_PROGRESS"
                            ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                            : run.status === "COMPLETED"
                            ? "border-[var(--text-muted)] text-[var(--text-muted)]"
                            : "border-[var(--rule)] text-[var(--text-muted)]"
                    }`}>
                        {run.status === "IN_PROGRESS" ? "Em andamento" : run.status === "COMPLETED" ? "Concluída" : "Abortada"}
                    </span>
                </div>
            </div>

            <div className="mt-8">
                <TestRunView
                    workspaceSlug={workspaceSlug}
                    testPlanSlug={testPlanSlug}
                    runId={runId}
                    runStatus={run.status}
                    caseRuns={caseRuns}
                    hasJira={!!workspace.jiraConfig}
                />
            </div>
        </main>
    );
}