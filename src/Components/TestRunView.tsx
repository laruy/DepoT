"use client";

import { useState, useTransition } from "react";
import { parseSteps } from "@/src/lib/testCaseSteps";
import {
    updateCaseRunStatus,
    completeTestRun,
    abortTestRun,
    linkJiraTicket,
    createJiraTicket,
} from "@/src/app/(protected)/workspaces/[workspaceSlug]/test-plans/[testPlanSlug]/runs/actions";

interface JiraLink {
    id: string;
    ticketKey: string;
    ticketUrl: string;
}

interface CaseRunItem {
    id: string;
    status: string;
    notes: string | null;
    executedAt: string | null;
    testCase: {
        id: string;
        title: string;
        steps: string | null;
        expectedResult: string | null;
        priority: string;
        isAutomated: boolean;
        tags: string | null;
        featureName: string;
        featureColor: string;
    };
    jiraLinks: JiraLink[];
}

interface TestRunViewProps {
    workspaceSlug: string;
    testPlanSlug: string;
    runId: string;
    runStatus: string;
    caseRuns: CaseRunItem[];
    hasJira: boolean;
}

const STATUS_COLOR: Record<string, string> = {
    PENDING: "var(--text-muted)",
    PASSED: "#22c55e",
    FAILED: "var(--red-signal)",
    SKIPPED: "#f59e0b",
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pendente",
    PASSED: "Passou",
    FAILED: "Falhou",
    SKIPPED: "Pulado",
};

const PRIORITY_COLOR: Record<string, string> = {
    LOW: "var(--text-muted)",
    MEDIUM: "var(--red-signal)",
    HIGH: "var(--red-deep)",
};

function parseTags(raw: string | null) {
    return raw?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
}

export default function TestRunView({
    workspaceSlug,
    testPlanSlug,
    runId,
    runStatus,
    caseRuns,
    hasJira,
}: TestRunViewProps) {
    const isActive = runStatus === "IN_PROGRESS";
    const [selectedId, setSelectedId] = useState<string>(caseRuns[0]?.id ?? "");
    const [isPending, startTransition] = useTransition();
    const [jiraMode, setJiraMode] = useState<"link" | "create" | null>(null);
    const [jiraKey, setJiraKey] = useState("");
    const [jiraError, setJiraError] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [showNotes, setShowNotes] = useState(false);

    const selected = caseRuns.find((cr) => cr.id === selectedId) ?? caseRuns[0];

    const passed = caseRuns.filter((cr) => cr.status === "PASSED").length;
    const failed = caseRuns.filter((cr) => cr.status === "FAILED").length;
    const skipped = caseRuns.filter((cr) => cr.status === "SKIPPED").length;
    const pending = caseRuns.filter((cr) => cr.status === "PENDING").length;

    function goNext() {
        const index = caseRuns.findIndex((cr) => cr.id === selectedId);
        const next = caseRuns[index + 1];
        if (next) {
            setSelectedId(next.id);
            setNotes("");
            setShowNotes(false);
            setJiraMode(null);
            setJiraKey("");
            setJiraError(null);
        }
    }

    function handleStatus(status: "PASSED" | "FAILED" | "SKIPPED") {
        startTransition(async () => {
            await updateCaseRunStatus(workspaceSlug, testPlanSlug, runId, selectedId, status, notes || undefined);
            if (status !== "FAILED") goNext();
        });
    }

    function handleComplete() {
        startTransition(async () => {
            await completeTestRun(workspaceSlug, testPlanSlug, runId);
        });
    }

    function handleAbort() {
        startTransition(async () => {
            await abortTestRun(workspaceSlug, testPlanSlug, runId);
        });
    }

    function handleLinkJira() {
        if (!jiraKey.trim()) return;
        setJiraError(null);
        startTransition(async () => {
            try {
                await linkJiraTicket(workspaceSlug, testPlanSlug, runId, selectedId, jiraKey.trim());
                setJiraKey("");
                setJiraMode(null);
                goNext();
            } catch (err) {
                setJiraError(err instanceof Error ? err.message : "Erro ao linkar ticket.");
            }
        });
    }

    function handleCreateJira() {
        setJiraError(null);
        startTransition(async () => {
            try {
                await createJiraTicket(workspaceSlug, testPlanSlug, runId, selectedId, selected.testCase.id);
                setJiraMode(null);
                goNext();
            } catch (err) {
                setJiraError(err instanceof Error ? err.message : "Erro ao criar ticket.");
            }
        });
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Lista lateral */}
            <aside className="h-fit rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)]">
                {/* Progresso */}
                <div className="border-b border-[var(--rule)] p-4 space-y-2">
                    <div className="flex justify-between font-mono text-xs text-[var(--text-muted)]">
                        <span>{caseRuns.length} casos</span>
                        <span>{passed + failed + skipped}/{caseRuns.length}</span>
                    </div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-[var(--rule)]">
                        <div style={{ width: `${(passed / caseRuns.length) * 100}%`, backgroundColor: "#22c55e" }} />
                        <div style={{ width: `${(failed / caseRuns.length) * 100}%`, backgroundColor: "var(--red-signal)" }} />
                        <div style={{ width: `${(skipped / caseRuns.length) * 100}%`, backgroundColor: "#f59e0b" }} />
                    </div>
                    <div className="flex gap-3 font-mono text-[10px]">
                        <span style={{ color: "#22c55e" }}>✓ {passed}</span>
                        <span style={{ color: "var(--red-signal)" }}>✕ {failed}</span>
                        <span style={{ color: "#f59e0b" }}>— {skipped}</span>
                        <span className="text-[var(--text-muted)]">● {pending}</span>
                    </div>
                </div>

                <ul className="divide-y divide-[var(--rule)]">
                    {caseRuns.map((cr, index) => (
                        <li key={cr.id}>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedId(cr.id);
                                    setNotes("");
                                    setShowNotes(false);
                                    setJiraMode(null);
                                }}
                                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                                    cr.id === selectedId
                                        ? "bg-[var(--red-deep)]/20"
                                        : "hover:bg-[var(--rule)]/20"
                                }`}
                            >
                                <span className="font-mono mt-0.5 w-5 shrink-0 text-xs text-[var(--text-muted)]">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="font-body flex-1 text-sm leading-snug text-[var(--text-primary)]">
                                    {cr.testCase.title}
                                </span>
                                <span
                                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: STATUS_COLOR[cr.status] }}
                                />
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Ações da execução */}
                {isActive && (
                    <div className="border-t border-[var(--rule)] p-3 space-y-2">
                        <button
                            type="button"
                            onClick={handleComplete}
                            disabled={isPending || pending > 0}
                            className="font-mono w-full rounded-sm bg-[var(--text-primary)] px-3 py-2 text-xs font-medium text-black disabled:opacity-40"
                        >
                            Concluir execução →
                        </button>
                        {pending > 0 && (
                            <p className="font-mono text-center text-[10px] text-[var(--text-muted)]">
                                # {pending} caso{pending !== 1 ? "s" : ""} pendente{pending !== 1 ? "s" : ""}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={handleAbort}
                            disabled={isPending}
                            className="font-mono w-full rounded-sm border border-[var(--rule)] px-3 py-2 text-xs text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                        >
                            Abortar execução
                        </button>
                    </div>
                )}
            </aside>

            {/* Detalhe do caso */}
            {selected && (
                <article className="rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-8">
                    {/* Header */}
                    <div className="border-b border-[var(--rule)] pb-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-block h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: selected.testCase.featureColor }}
                                    />
                                    <span className="font-mono text-xs text-[var(--text-muted)]">
                                        {selected.testCase.featureName}
                                    </span>
                                    <span
                                        className="font-mono rounded-sm border px-2 py-0.5 text-[10px] uppercase"
                                        style={{
                                            borderColor: PRIORITY_COLOR[selected.testCase.priority],
                                            color: PRIORITY_COLOR[selected.testCase.priority],
                                        }}
                                    >
                                        {selected.testCase.priority}
                                    </span>
                                    {selected.testCase.isAutomated && (
                                        <span className="font-mono rounded-sm border border-[var(--rule)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                                            auto
                                        </span>
                                    )}
                                </div>
                                <h2 className="font-display mt-3 text-2xl text-[var(--text-primary)]">
                                    {selected.testCase.title}
                                </h2>
                            </div>
                            <span
                                className="font-mono shrink-0 rounded-sm border px-3 py-1 text-xs uppercase"
                                style={{
                                    borderColor: STATUS_COLOR[selected.status],
                                    color: STATUS_COLOR[selected.status],
                                }}
                            >
                                {STATUS_LABEL[selected.status]}
                            </span>
                        </div>

                        {parseTags(selected.testCase.tags).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {parseTags(selected.testCase.tags).map((tag) => (
                                    <span
                                        key={tag}
                                        className="font-mono rounded-sm border border-[var(--rule)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Steps */}
                    <div className="mt-6">
                        <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                            Steps
                        </p>
                        <ol className="mt-3 space-y-3">
                            {parseSteps(selected.testCase.steps).map((step, index) => (
                                <li key={index} className="flex gap-4 rounded-sm border border-[var(--rule)] p-4">
                                    <span className="font-mono shrink-0 text-xl text-[var(--red-signal)]">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span className="font-body text-base leading-relaxed text-[var(--text-primary)]">
                                        {step}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Resultado esperado */}
                    {selected.testCase.expectedResult && (
                        <div className="mt-6">
                            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                Resultado esperado
                            </p>
                            <p className="font-body mt-3 rounded-sm border border-[var(--rule)] p-4 text-base leading-relaxed text-[var(--text-primary)]">
                                {selected.testCase.expectedResult}
                            </p>
                        </div>
                    )}

                    {/* Tickets Jira linkados */}
                    {selected.jiraLinks.length > 0 && (
                        <div className="mt-6">
                            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                Tickets Jira
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {selected.jiraLinks.map((link) => (
                                    
                                        key={link.id}
                                        href={link.ticketUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono rounded-sm border border-[var(--rule)] px-3 py-1.5 text-xs text-[var(--red-signal)] hover:border-[var(--red-signal)]"
                                    >
                                        {link.ticketKey} ↗
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notas */}
                    {isActive && (
                        <div className="mt-6">
                            {showNotes ? (
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Observações sobre esse caso..."
                                    rows={3}
                                    className="w-full resize-none rounded-sm border border-[var(--rule)] bg-transparent p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                                />
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowNotes(true)}
                                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                                >
                                    + adicionar observação
                                </button>
                            )}
                        </div>
                    )}

                    {/* Jira — linkar ou criar */}
                    {isActive && selected.status === "FAILED" && hasJira && jiraMode && (
                        <div className="mt-4 rounded-sm border border-[var(--rule)] p-4">
                            {jiraMode === "link" ? (
                                <div className="flex gap-2">
                                    <input
                                        value={jiraKey}
                                        onChange={(e) => setJiraKey(e.target.value)}
                                        placeholder="Ex: PROJ-123"
                                        className="flex-1 rounded-sm border border-[var(--rule)] bg-transparent p-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleLinkJira}
                                        disabled={isPending}
                                        className="font-mono rounded-sm bg-[var(--text-primary)] px-4 py-2 text-xs font-medium text-black disabled:opacity-40"
                                    >
                                        Linkar
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="font-mono text-xs text-[var(--text-muted)]">
                                        # vai criar um bug no Jira com o título e steps desse caso.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleCreateJira}
                                        disabled={isPending}
                                        className="font-mono rounded-sm bg-[var(--text-primary)] px-4 py-2 text-xs font-medium text-black disabled:opacity-40"
                                    >
                                        {isPending ? "Criando…" : "Criar ticket →"}
                                    </button>
                                </div>
                            )}
                            {jiraError && (
                                <p className="mt-2 font-mono text-xs text-[var(--red-signal)]">{jiraError}</p>
                            )}
                        </div>
                    )}

                    {/* Ações do caso */}
                    {isActive && (
                        <div className="mt-8 border-t border-[var(--rule)] pt-6">
                            {selected.status === "FAILED" && hasJira && !jiraMode ? (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleStatus("FAILED")}
                                        disabled={isPending}
                                        className="font-mono rounded-sm border border-[var(--red-signal)] bg-[var(--red-deep)]/20 px-5 py-2.5 text-sm text-[var(--red-signal)] disabled:opacity-40"
                                    >
                                        ✕ Falhou
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setJiraMode("link")}
                                        className="font-mono rounded-sm border border-[var(--rule)] px-5 py-2.5 text-sm text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                                    >
                                        Linkar ticket Jira
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setJiraMode("create")}
                                        className="font-mono rounded-sm border border-[var(--rule)] px-5 py-2.5 text-sm text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                                    >
                                        Criar ticket Jira
                                    </button>
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        className="font-mono rounded-sm border border-[var(--rule)] px-5 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        Próximo →
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleStatus("PASSED")}
                                        disabled={isPending}
                                        className="font-mono rounded-sm border px-5 py-2.5 text-sm disabled:opacity-40"
                                        style={{ borderColor: "#22c55e", color: "#22c55e" }}
                                    >
                                        ✓ Passou
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatus("FAILED")}
                                        disabled={isPending}
                                        className="font-mono rounded-sm border border-[var(--red-signal)] px-5 py-2.5 text-sm text-[var(--red-signal)] disabled:opacity-40"
                                    >
                                        ✕ Falhou
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleStatus("SKIPPED")}
                                        disabled={isPending}
                                        className="font-mono rounded-sm border px-5 py-2.5 text-sm disabled:opacity-40"
                                        style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
                                    >
                                        — Pulou
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </article>
            )}
        </div>
    );
}