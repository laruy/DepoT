import { auth } from "@/auth";
import FeatureCasesView from "@/src/Components/FeatureCasesView";
import { requireMembership } from "@/src/lib/authorization";
import prisma from "@/src/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function FeatureCasesPage({
    params,
}: {
    params: Promise<{ workspaceId: string; featureId: string }>;
}) {
    const { workspaceId, featureId } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const membership = await requireMembership(session.user.id, workspaceId).catch(() => null);
    if (!membership) redirect("/workspaces");

    const feature = await prisma.feature.findFirst({
        where: { id: featureId, workspaceId },
        include: {
            testCases: { orderBy: { createdAt: "asc" } },
        },
    });
    if (!feature) redirect(`/workspaces/${workspaceId}`);

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
                    href={`/workspaces/${workspaceId}`}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                >
                    ← voltar pro workspace
                </Link>
                <div className="mt-3 flex items-center gap-2">
                    <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: feature.color }}
                    />
                    <h1 className="font-display text-3xl text-[var(--text-primary)]">{feature.name}</h1>
                </div>
                {feature.description && (
                    <p className="font-body mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                        {feature.description}
                    </p>
                )}
            </div>

            <div className="mt-8">
                <FeatureCasesView workspaceId={workspaceId} featureId={feature.id} testCases={testCases} />
            </div>
        </main>
    );
}