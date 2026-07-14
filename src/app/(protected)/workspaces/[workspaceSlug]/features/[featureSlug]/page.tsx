import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireMembership } from "@/src/lib/authorization";
import FeatureCasesView from "@/src/Components/FeatureCasesView";

export default async function FeatureCasesPage({
    params,
}: {
    params: Promise<{ workspaceSlug: string; featureSlug: string }>;
}) {
    const { workspaceSlug, featureSlug } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const feature = await prisma.feature.findFirst({
        where: { slug: featureSlug, workspace: { slug: workspaceSlug } },
        include: {
            workspace: { select: { id: true } },
            testCases: { orderBy: { createdAt: "asc" } },
        },
    });
    if (!feature) redirect(`/workspaces/${workspaceSlug}`);

    const membership = await requireMembership(session.user.id, feature.workspace.id).catch(() => null);
    if (!membership) redirect("/dashboard");

    const testCases = feature.testCases.map((tc) => ({
        id: tc.id,
        title: tc.title,
        steps: tc.steps,
        expectedResult: tc.expectedResult,
        priority: tc.priority,
        isAutomated: tc.isAutomated,
        tags: tc.tags,
        automationNotes: tc.automationNotes,
    }));

    return (
        <main className="mx-auto max-w-7xl px-6 py-12">
            <div className="border-b border-[var(--rule)] pb-6">
                <Link
                    href={`/workspaces/${workspaceSlug}`}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                >
                    ← voltar pro workspace
                </Link>
                <div className="mt-3 flex items-center gap-2">
                    <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: feature.color }}
                    />
                    <h1 className="font-display text-3xl text-[var(--text-primary)]">
                        {feature.name}
                    </h1>
                </div>
                {feature.description && (
                    <p className="font-body mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                        {feature.description}
                    </p>
                )}
            </div>

            <div className="mt-8">
                <FeatureCasesView
                    workspaceSlug={workspaceSlug}
                    featureSlug={featureSlug}
                    testCases={testCases}
                />
            </div>
        </main>
    );
}