"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { requireMembership } from "@/src/lib/authorization";
import { revalidatePath } from "next/cache";
import { stringifySteps } from "@/src/lib/testCaseSteps";
import type { Priority } from "@/src/generated/prisma";

function readTestCaseForm(formData: FormData) {
    const title = (formData.get("title") as string).trim();
    const expectedResult = (formData.get("expectedResult") as string) || null;
    const priority = ((formData.get("priority") as string) || "MEDIUM") as Priority;
    const isAutomated = formData.get("isAutomated") === "on";
    const tagsRaw = (formData.get("tags") as string) || "";
    const tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).join(",") || null;
    const automationNotes = (formData.get("automationNotes") as string) || null;
    const stepsRaw = formData.getAll("step").map((s) => String(s));
    const steps = stringifySteps(stepsRaw);

    return { title, steps, expectedResult, priority, isAutomated, tags, automationNotes };
}

async function getFeature(workspaceSlug: string, featureSlug: string) {
    return prisma.feature.findFirst({
        where: { slug: featureSlug, workspace: { slug: workspaceSlug } },
        include: { workspace: { select: { id: true } } },
    });
}

export async function createTestCase(workspaceSlug: string, featureSlug: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const feature = await getFeature(workspaceSlug, featureSlug);
    if (!feature) throw new Error("Feature não encontrada");

    await requireMembership(session.user.id, feature.workspace.id);

    const data = readTestCaseForm(formData);
    await prisma.testCase.create({
        data: { ...data, featureId: feature.id, createdById: session.user.id },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/features/${featureSlug}`);
}

export async function updateTestCase(
    workspaceSlug: string,
    featureSlug: string,
    testCaseId: string,
    formData: FormData
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const feature = await getFeature(workspaceSlug, featureSlug);
    if (!feature) throw new Error("Feature não encontrada");

    await requireMembership(session.user.id, feature.workspace.id);

    const data = readTestCaseForm(formData);
    await prisma.testCase.updateMany({
        where: { id: testCaseId, featureId: feature.id },
        data,
    });

    revalidatePath(`/workspaces/${workspaceSlug}/features/${featureSlug}`);
}

export async function deleteTestCase(
    workspaceSlug: string,
    featureSlug: string,
    testCaseId: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const feature = await getFeature(workspaceSlug, featureSlug);
    if (!feature) throw new Error("Feature não encontrada");

    await requireMembership(session.user.id, feature.workspace.id);

    await prisma.testCase.deleteMany({ where: { id: testCaseId, featureId: feature.id } });

    revalidatePath(`/workspaces/${workspaceSlug}/features/${featureSlug}`);
}