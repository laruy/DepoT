// src/app/workspaces/new/actions.ts
"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { redirect } from "next/navigation";

export async function createWorkspace(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;

    const workspace = await prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
            data: { name, description, ownerId: session.user!.id },
        });
        await tx.membership.create({
            data: { userId: session.user!.id, workspaceId: ws.id, role: "OWNER" },
        });
        return ws;
    });

    redirect(`/workspaces/${workspace.id}`);
}