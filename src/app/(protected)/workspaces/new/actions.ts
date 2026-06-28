"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";

export async function createWorkspace(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    const inviteEmails = formData
        .getAll("inviteEmails")
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => e.length > 0 && e !== session.user!.email?.toLowerCase());

    const uniqueEmails = Array.from(new Set(inviteEmails));

    const workspace = await prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
            data: { name, description, ownerId: session.user!.id },
        });

        await tx.membership.create({
            data: { userId: session.user!.id, workspaceId: ws.id, role: "OWNER" },
        });

        if (uniqueEmails.length > 0) {
            await tx.invite.createMany({
                data: uniqueEmails.map((email) => ({
                    workspaceId: ws.id,
                    email,
                    invitedById: session.user!.id,
                })),
            });
        }

        return ws;
    });

    redirect(`/workspaces/${workspace.id}`);
}