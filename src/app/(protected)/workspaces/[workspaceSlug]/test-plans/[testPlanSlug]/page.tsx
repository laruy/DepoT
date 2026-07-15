import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireMembership } from "@/src/lib/authorization";
import TestPlanModal from "@/src/Components/TestPlanModal";
import TestPlanCaseSelector from "@/src/Components/TestPlanCaseSelector";

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

    const maestroTags = Array.from(new Set(
        planCases.flatMap((tc) => tc.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [])
    ));
    const maestroCommand = plan.type === "AUTOMATED" && maestroTags.length > 0
        ? `maestro test --tags=${maestroTags.join(",")}`
        : null;

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

                    <TestPlanModal
                        workspaceSlug={workspaceSlug}
                        plan={{ id: plan.id, slug: plan.slug, name: plan.name, description: plan.description, type: plan.type }}
                        className="font-mono rounded-sm border border-[var(--rule)] px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                    >
                        Editar plano
                    </TestPlanModal>
                </div>

                {maestroCommand && (
                    <div className="mt-4 flex items-center gap-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3">
                        <span className="font-mono text-xs text-[var(--text-muted)]">comando</span>
                        <code className="font-mono flex-1 text-sm text-[var(--red-signal)]">
                            {maestroCommand}
                        </code>
                    </div>
                )}
            </div>

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