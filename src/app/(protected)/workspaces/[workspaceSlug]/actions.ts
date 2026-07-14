"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { requireOwner, requireMembership } from "@/src/lib/authorization";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

async function getWorkspaceBySlug(slug: string) {
    return prisma.workspace.findFirst({ where: { slug } });
}

export async function inviteMember(workspaceSlug: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) throw new Error("Workspace não encontrado");

    await requireOwner(session.user.id, workspace.id);

    const email = (formData.get("email") as string).trim().toLowerCase();

    const existing = await prisma.invite.findFirst({
        where: { workspaceId: workspace.id, email },
    });
    if (existing) {
        throw new Error(
            existing.status === "ACCEPTED"
                ? "Esse e-mail já é membro do workspace."
                : "Esse e-mail já tem um convite pendente."
        );
    }

    const alreadyMember = await prisma.membership.findFirst({
        where: { workspaceId: workspace.id, user: { email } },
    });
    if (alreadyMember) throw new Error("Esse e-mail já é membro do workspace.");

    await prisma.invite.create({
        data: { workspaceId: workspace.id, email, invitedById: session.user.id },
    });

    revalidatePath(`/workspaces/${workspaceSlug}`);
}

export async function createFeature(workspaceSlug: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) throw new Error("Workspace não encontrado");

    await requireMembership(session.user.id, workspace.id);

    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || null;
    const color = (formData.get("color") as string) || "#E11D2A";
    const maestroTagsRaw = (formData.get("maestroTags") as string) || "";
    const maestroTags =
        maestroTagsRaw.split(",").map((t) => t.trim()).filter(Boolean).join(",") || null;

    const base = slugify(name, { lower: true, strict: true, trim: true });
    let slug = base;
    let counter = 2;
    while (await prisma.feature.findUnique({ where: { workspaceId_slug: { workspaceId: workspace.id, slug } } })) {
        slug = `${base}-${counter++}`;
    }

    await prisma.feature.create({
        data: { workspaceId: workspace.id, name, slug, description, color, maestroTags },
    });

    revalidatePath(`/workspaces/${workspaceSlug}`);
}

export async function updateFeature(workspaceSlug: string, featureId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) throw new Error("Workspace não encontrado");

    await requireMembership(session.user.id, workspace.id);

    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || null;
    const color = (formData.get("color") as string) || "#E11D2A";
    const maestroTagsRaw = (formData.get("maestroTags") as string) || "";
    const maestroTags =
        maestroTagsRaw.split(",").map((t) => t.trim()).filter(Boolean).join(",") || null;

    await prisma.feature.updateMany({
        where: { id: featureId, workspaceId: workspace.id },
        data: { name, description, color, maestroTags },
    });

    revalidatePath(`/workspaces/${workspaceSlug}`);
}

export async function deleteFeature(workspaceSlug: string, featureId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) throw new Error("Workspace não encontrado");

    await requireMembership(session.user.id, workspace.id);

    await prisma.feature.deleteMany({
        where: { id: featureId, workspaceId: workspace.id },
    });

    revalidatePath(`/workspaces/${workspaceSlug}`);
}