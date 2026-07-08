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
    params: Promise<{ workspaceId: string }>;
}) {
    const { workspaceId } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const membership = await requireMembership(session.user.id, workspaceId).catch(() => null);
    if (!membership) redirect("/dashboard");

    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true },
    });
    if (!workspace) redirect("/dashboard");

    return (
        <div className="flex min-h-[calc(100vh-53px)]">
            <WorkspaceSidebar workspace={workspace} />
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    );
}