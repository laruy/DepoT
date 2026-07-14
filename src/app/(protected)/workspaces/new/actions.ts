"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import slugify from "slugify";
import { redirect } from "next/navigation";

export async function createWorkspace(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || null;

    const inviteEmails = formData
        .getAll("inviteEmails")
        .map((e) => String(e).trim().toLowerCase())
        .filter((e) => e.length > 0 && e !== session.user!.email?.toLowerCase());

    const uniqueEmails = Array.from(new Set(inviteEmails));

    // valida nome único por owner
    const existingName = await prisma.workspace.findFirst({
        where: { ownerId: session.user.id, name: { equals: name, mode: "insensitive" } },
    });
    if (existingName) throw new Error("Você já tem um workspace com esse nome.");

    // gera slug único
    const base = slugify(name, { lower: true, strict: true, trim: true });
    let slug = base;
    let counter = 2;
    while (await prisma.workspace.findUnique({ where: { ownerId_slug: { ownerId: session.user.id, slug } } })) {
        slug = `${base}-${counter++}`;
    }

    const workspace = await prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
            data: { name, slug, description, ownerId: session.user!.id },
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

    redirect(`/workspaces/${workspace.slug}`);
}