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

export async function updateFeature(
    workspaceId: string,
    featureId: string,
    formData: FormData
) {
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

    // updateMany com workspaceId garante que não dá pra editar feature de outro workspace
    await prisma.feature.updateMany({
        where: { id: featureId, workspaceId },
        data: { name, description, color, maestroTags },
    });

    revalidatePath(`/workspaces/${workspaceId}`);
}

export async function deleteFeature(workspaceId: string, featureId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");
    await requireMembership(session.user.id, workspaceId);

    // deleteMany com workspaceId garante que não dá pra apagar feature de outro workspace
    // onDelete: Cascade no schema já remove testCases e automationDoc junto
    await prisma.feature.deleteMany({
        where: { id: featureId, workspaceId },
    });

    revalidatePath(`/workspaces/${workspaceId}`);
}