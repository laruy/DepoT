"use server";
import { auth } from "@/auth";
import type { Priority } from "@/src/generated/prisma/enums";
import { requireMembership } from "@/src/lib/authorization";
import prisma from "@/src/lib/prisma";
import { stringifySteps } from "@/src/lib/testCaseSteps";
import { revalidatePath } from "next/cache";

function readTestCaseForm(formData: FormData) {
    const title = formData.get("title") as string;
    const expectedResult = (formData.get("expectedResult") as string) || null;
    const priority = ((formData.get("priority") as string) || "MEDIUM") as Priority;
    const isAutomated = formData.get("isAutomated") === "on";

    const tagsRaw = (formData.get("tags") as string) || "";
    const tags =
        tagsRaw.split(",").map((t) => t.trim()).filter(Boolean).join(",") || null;

    const automationNotes = (formData.get("automationNotes") as string) || null;

    const stepsRaw = formData.getAll("step").map((s) => String(s));
    const steps = stringifySteps(stepsRaw);

    return { title, steps, expectedResult, priority, isAutomated, tags, automationNotes };
}

export async function createTestCase(workspaceId: string, featureId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");
    await requireMembership(session.user.id, workspaceId);

    // garante que a feature realmente pertence a esse workspace
    const feature = await prisma.feature.findFirst({ where: { id: featureId, workspaceId } });
    if (!feature) throw new Error("Feature não encontrada");

    const data = readTestCaseForm(formData);

    await prisma.testCase.create({
        data: { ...data, featureId, createdById: session.user.id },
    });

    revalidatePath(`/workspaces/${workspaceId}/features/${featureId}`);
}

export async function updateTestCase(
    workspaceId: string,
    featureId: string,
    testCaseId: string,
    formData: FormData
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");
    await requireMembership(session.user.id, workspaceId);

    const data = readTestCaseForm(formData);

    // updateMany filtrando pela feature+workspace garante que não dá pra editar
    // um caso de teste de outro workspace mesmo manipulando o ID na mão
    await prisma.testCase.updateMany({
        where: { id: testCaseId, feature: { id: featureId, workspaceId } },
        data,
    });

    revalidatePath(`/workspaces/${workspaceId}/features/${featureId}`);
}

export async function deleteTestCase(workspaceId: string, featureId: string, testCaseId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");
    await requireMembership(session.user.id, workspaceId);

    await prisma.testCase.deleteMany({
        where: { id: testCaseId, feature: { id: featureId, workspaceId } },
    });

    revalidatePath(`/workspaces/${workspaceId}/features/${featureId}`);
}