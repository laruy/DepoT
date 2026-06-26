// src/app/workspaces/[id]/actions.ts
"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { requireOwner } from "@/src/lib/authorization";
import { revalidatePath } from "next/cache";

export async function inviteMember(workspaceId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");
    await requireOwner(session.user.id, workspaceId);

    const email = formData.get("email") as string;

    await prisma.invite.create({
        data: { workspaceId, email, invitedById: session.user.id },
    });

    revalidatePath(`/workspaces/${workspaceId}`);
}