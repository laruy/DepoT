"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { requireMembership } from "@/src/lib/authorization";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import slugify from "slugify";
import type { PlanType } from "@/src/generated/prisma";

async function getWorkspaceBySlug(slug: string) {
    return prisma.workspace.findFirst({ where: { slug } });
}

export async function createTestPlan(workspaceSlug: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) throw new Error("Workspace não encontrado");

    await requireMembership(session.user.id, workspace.id);

    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || null;
    const type = (formData.get("type") as PlanType) || "MANUAL";

    const base = slugify(name, { lower: true, strict: true, trim: true });
    let slug = base;
    let counter = 2;
    while (await prisma.testPlan.findUnique({ where: { workspaceId_slug: { workspaceId: workspace.id, slug } } })) {
        slug = `${base}-${counter++}`;
    }

    const plan = await prisma.testPlan.create({
        data: { name, slug, description, type, workspaceId: workspace.id, createdById: session.user.id },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans`);
    redirect(`/workspaces/${workspaceSlug}/test-plans/${plan.slug}`);
}

export async function updateTestPlan(workspaceSlug: string, testPlanSlug: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) throw new Error("Workspace não encontrado");

    await requireMembership(session.user.id, workspace.id);

    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || null;
    const type = (formData.get("type") as PlanType) || "MANUAL";

    await prisma.testPlan.updateMany({
        where: { slug: testPlanSlug, workspaceId: workspace.id },
        data: { name, description, type },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans`);
    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
}

export async function deleteTestPlan(workspaceSlug: string, testPlanSlug: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) throw new Error("Workspace não encontrado");

    await requireMembership(session.user.id, workspace.id);

    await prisma.testPlan.deleteMany({ where: { slug: testPlanSlug, workspaceId: workspace.id } });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans`);
    redirect(`/workspaces/${workspaceSlug}/test-plans`);
}

export async function addCaseToPlan(workspaceSlug: string, testPlanSlug: string, testCaseId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const plan = await prisma.testPlan.findFirst({
        where: { slug: testPlanSlug, workspace: { slug: workspaceSlug } },
    });
    if (!plan) throw new Error("Plano não encontrado");

    await requireMembership(session.user.id, plan.workspaceId);

    const testCase = await prisma.testCase.findFirst({
        where: { id: testCaseId, feature: { workspaceId: plan.workspaceId } },
    });
    if (!testCase) throw new Error("Caso de teste não encontrado");

    await prisma.testPlanCase.upsert({
        where: { testPlanId_testCaseId: { testPlanId: plan.id, testCaseId } },
        update: {},
        create: { testPlanId: plan.id, testCaseId },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
}

export async function removeCaseFromPlan(workspaceSlug: string, testPlanSlug: string, testCaseId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const plan = await prisma.testPlan.findFirst({
        where: { slug: testPlanSlug, workspace: { slug: workspaceSlug } },
    });
    if (!plan) throw new Error("Plano não encontrado");

    await requireMembership(session.user.id, plan.workspaceId);

    await prisma.testPlanCase.deleteMany({ where: { testPlanId: plan.id, testCaseId } });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
}

export async function addCasesByTag(workspaceSlug: string, testPlanSlug: string, tag: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const plan = await prisma.testPlan.findFirst({
        where: { slug: testPlanSlug, workspace: { slug: workspaceSlug } },
    });
    if (!plan) throw new Error("Plano não encontrado");

    await requireMembership(session.user.id, plan.workspaceId);

    const cases = await prisma.testCase.findMany({
        where: {
            feature: { workspaceId: plan.workspaceId },
            tags: { contains: tag },
            ...(plan.type === "AUTOMATED" ? { isAutomated: true } : {}),
        },
    });

    await prisma.testPlanCase.createMany({
        data: cases.map((tc) => ({ testPlanId: plan.id, testCaseId: tc.id })),
        skipDuplicates: true,
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
}