import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { requireMembership } from "@/src/lib/authorization";
import WorkspaceSidebar from "@/src/Components/WorkspaceSidebar";
import type { ReactNode } from "react";

export default async function WorkspaceLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: Promise<{ workspaceSlug: string }>;
}) {
    const { workspaceSlug } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const workspace = await prisma.workspace.findFirst({
        where: { slug: workspaceSlug },
        select: { id: true, name: true, slug: true },
    });
    if (!workspace) redirect("/dashboard");

    const membership = await requireMembership(session.user.id, workspace.id).catch(() => null);
    if (!membership) redirect("/dashboard");

    return (
        <div className="flex min-h-[calc(100vh-53px)]">
            <WorkspaceSidebar workspace={workspace} />
            <div className="flex-1 overflow-auto">{children}</div>
        </div>
    );
}