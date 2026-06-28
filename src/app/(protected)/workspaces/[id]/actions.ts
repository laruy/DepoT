"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { requireOwner, requireMembership } from "@/src/lib/authorization";
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

export async function createFeature(workspaceId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");
    await requireMembership(session.user.id, workspaceId);

    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || null;
    const color = (formData.get("color") as string) || "#E11D2A";

    const maestroTagsRaw = (formData.get("maestroTags") as string) || "";
    const maestroTags =
        maestroTagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .join(",") || null;

    await prisma.feature.create({
        data: { workspaceId, name, description, color, maestroTags },
    });

    revalidatePath(`/workspaces/${workspaceId}`);
}