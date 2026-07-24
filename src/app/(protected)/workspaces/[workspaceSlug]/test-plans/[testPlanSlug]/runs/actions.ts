"use server";
import { auth } from "@/auth";
import prisma from "@/src/lib/prisma";
import { requireMembership } from "@/src/lib/authorization";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getPlan(workspaceSlug: string, testPlanSlug: string) {
    return prisma.testPlan.findFirst({
        where: { slug: testPlanSlug, workspace: { slug: workspaceSlug } },
        include: { cases: { orderBy: { order: "asc" } } },
    });
}

export async function startTestRun(workspaceSlug: string, testPlanSlug: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const plan = await getPlan(workspaceSlug, testPlanSlug);
    if (!plan) throw new Error("Plano não encontrado");

    await requireMembership(session.user.id, plan.workspaceId);

    if (plan.cases.length === 0) throw new Error("O plano não tem casos de teste.");

    const run = await prisma.testRun.create({
        data: {
            testPlanId: plan.id,
            executedById: session.user.id,
            caseRuns: {
                create: plan.cases.map((pc) => ({
                    testCaseId: pc.testCaseId,
                })),
            },
        },
    });

    redirect(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}/runs/${run.id}`);
}

export async function updateCaseRunStatus(
    workspaceSlug: string,
    testPlanSlug: string,
    runId: string,
    caseRunId: string,
    status: "PASSED" | "FAILED" | "SKIPPED",
    notes?: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const run = await prisma.testRun.findFirst({
        where: { id: runId, testPlan: { slug: testPlanSlug, workspace: { slug: workspaceSlug } } },
    });
    if (!run) throw new Error("Execução não encontrada");

    await requireMembership(session.user.id, run.testPlanId);

    await prisma.caseRun.update({
        where: { id: caseRunId },
        data: { status, notes: notes ?? null, executedAt: new Date() },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}/runs/${runId}`);
}

export async function completeTestRun(workspaceSlug: string, testPlanSlug: string, runId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const run = await prisma.testRun.findFirst({
        where: { id: runId, testPlan: { slug: testPlanSlug, workspace: { slug: workspaceSlug } } },
    });
    if (!run) throw new Error("Execução não encontrada");

    await requireMembership(session.user.id, run.testPlanId);

    await prisma.testRun.update({
        where: { id: runId },
        data: { status: "COMPLETED", completedAt: new Date() },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
    redirect(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
}

export async function abortTestRun(workspaceSlug: string, testPlanSlug: string, runId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const run = await prisma.testRun.findFirst({
        where: { id: runId, testPlan: { slug: testPlanSlug, workspace: { slug: workspaceSlug } } },
    });
    if (!run) throw new Error("Execução não encontrada");

    await requireMembership(session.user.id, run.testPlanId);

    await prisma.testRun.update({
        where: { id: runId },
        data: { status: "ABORTED", completedAt: new Date() },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
    redirect(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}`);
}

export async function linkJiraTicket(
    workspaceSlug: string,
    testPlanSlug: string,
    runId: string,
    caseRunId: string,
    ticketKey: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await prisma.workspace.findFirst({
        where: { slug: workspaceSlug },
        include: { jiraConfig: true },
    });
    if (!workspace) throw new Error("Workspace não encontrado");
    if (!workspace.jiraConfig) throw new Error("Jira não configurado nesse workspace.");

    await requireMembership(session.user.id, workspace.id);

    const ticketUrl = `${workspace.jiraConfig.jiraUrl}/browse/${ticketKey.toUpperCase()}`;

    await prisma.jiraCaseLink.create({
        data: {
            caseRunId,
            ticketKey: ticketKey.toUpperCase(),
            ticketUrl,
        },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}/runs/${runId}`);
}

export async function createJiraTicket(
    workspaceSlug: string,
    testPlanSlug: string,
    runId: string,
    caseRunId: string,
    testCaseId: string
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autenticado");

    const workspace = await prisma.workspace.findFirst({
        where: { slug: workspaceSlug },
        include: { jiraConfig: true },
    });
    if (!workspace) throw new Error("Workspace não encontrado");
    if (!workspace.jiraConfig) throw new Error("Jira não configurado nesse workspace.");

    await requireMembership(session.user.id, workspace.id);

    const testCase = await prisma.testCase.findUnique({
        where: { id: testCaseId },
    });
    if (!testCase) throw new Error("Caso de teste não encontrado");

    const { jiraUrl, projectKey, userEmail, apiToken } = workspace.jiraConfig;

    // monta descrição com os steps
    const stepsText = testCase.steps
        ? (() => {
                try {
                    const parsed = JSON.parse(testCase.steps);
                    return Array.isArray(parsed)
                        ? parsed.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
                        : testCase.steps;
                } catch {
                    return testCase.steps;
                }
            })()
        : "Sem steps registrados.";

    const description = `*Caso de teste:* ${testCase.title}\n\n*Steps:*\n${stepsText}${
        testCase.expectedResult ? `\n\n*Resultado esperado:*\n${testCase.expectedResult}` : ""
    }`;

    const response = await fetch(`${jiraUrl}/rest/api/3/issue`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${userEmail}:${apiToken}`).toString("base64")}`,
        },
        body: JSON.stringify({
            fields: {
                project: { key: projectKey },
                summary: `[Bug] ${testCase.title}`,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: description }],
                        },
                    ],
                },
                issuetype: { name: "Bug" },
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errorMessages?.[0] ?? "Erro ao criar ticket no Jira.");
    }

    const data = await response.json();
    const ticketKey = data.key as string;
    const ticketUrl = `${jiraUrl}/browse/${ticketKey}`;

    await prisma.jiraCaseLink.create({
        data: { caseRunId, ticketKey, ticketUrl },
    });

    revalidatePath(`/workspaces/${workspaceSlug}/test-plans/${testPlanSlug}/runs/${runId}`);
}