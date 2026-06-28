"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function respondInvite(inviteId: string, accept: boolean) {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) throw new Error("Não autenticado");

    const workspaceId = await prisma.$transaction(async (tx) => {
        const invite = await tx.invite.findUniqueOrThrow({ where: { id: inviteId } });
        if (invite.email !== session.user!.email) throw new Error("Convite não pertence a este usuário");

        await tx.invite.update({
        where: { id: inviteId },
        data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
        });

        if (accept) {
        await tx.membership.upsert({
            where: { userId_workspaceId: { userId: session.user!.id, workspaceId: invite.workspaceId } },
            update: {},
            create: { userId: session.user!.id, workspaceId: invite.workspaceId, role: "MEMBER" },
        });
        }
        return invite.workspaceId;
    });

    revalidatePath("/dashboard");
    if (accept) redirect(`/workspaces/${workspaceId}`);
}