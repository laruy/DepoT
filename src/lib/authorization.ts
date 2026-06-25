// src/lib/authorization.ts
import prisma from "@/src/lib/prisma";

export async function requireMembership(userId: string, workspaceId: string) {
    const membership = await prisma.membership.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new Error("Sem acesso a este workspace");
    return membership;
    }

    export async function requireOwner(userId: string, workspaceId: string) {
    const membership = await requireMembership(userId, workspaceId);
    if (membership.role !== "OWNER") throw new Error("Ação restrita ao owner");
    return membership;
}