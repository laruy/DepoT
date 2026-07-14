"use client";

import { useRef, useState } from "react";
import TestCaseModal from "./TestCaseModal";
import { parseSteps, parseTags } from "@/src/lib/testCaseSteps";

interface TestCaseItem {
    id: string;
    title: string;
    steps: string | null;
    expectedResult: string | null;
    priority: string;
    isAutomated: boolean;
    tags: string | null;
    automationNotes: string | null;
}

interface FeatureCasesViewProps {
    workspaceSlug: string;
    featureSlug: string;
    testCases: TestCaseItem[];
}

const PRIORITY_LABEL: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta" };
const PRIORITY_COLOR: Record<string, string> = {
    LOW: "var(--text-muted)",
    MEDIUM: "var(--red-signal)",
    HIGH: "var(--red-deep)",
};

const MIN_LEFT = 220;
const MAX_LEFT = 600;
const DEFAULT_LEFT = 320;

export default function FeatureCasesView({
    workspaceSlug,
    featureSlug,
    testCases
    }: FeatureCasesViewProps) {
    const [selectedId, setSelectedId] = useState<string | null>(testCases[0]?.id ?? null);
    const [editingCase, setEditingCase] = useState<TestCaseItem | null>(null);
    const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT);
    const isDragging = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = testCases.find((tc) => tc.id === selectedId) ?? null;

    function onMouseDown() {
        isDragging.current = true;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        function onMouseMove(e: MouseEvent) {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.min(MAX_LEFT, Math.max(MIN_LEFT, e.clientX - rect.left));
        setLeftWidth(newWidth);
        }

        function onMouseUp() {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }

    return (
        <div ref={containerRef} className="flex h-[calc(100vh-220px)] min-h-[500px] overflow-hidden rounded-sm border border-[var(--rule)]">

        {/* Painel esquerdo — lista de títulos */}
        <div
            className="flex shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--bg-panel)]"
            style={{ width: leftWidth }}
        >
            <div className="flex items-center justify-between border-b border-[var(--rule)] px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Casos · {String(testCases.length).padStart(2, "0")}
            </p>
            <TestCaseModal
                workspaceSlug={workspaceSlug}
                featureSlug={featureSlug}
                className="font-mono text-xs text-[var(--red-signal)] hover:underline"
                >
                + novo
            </TestCaseModal>
            </div>

            <ul className="flex-1 overflow-y-auto">
            {testCases.length === 0 ? (
                <li className="p-4">
                <p className="font-body text-xs text-[var(--text-muted)]">Nenhum caso ainda.</p>
                </li>
            ) : (
                testCases.map((tc, index) => (
                <li key={tc.id}>
                    <button
                    type="button"
                    onClick={() => setSelectedId(tc.id)}
                    className={`flex w-full items-start gap-3 border-b border-[var(--rule)] px-4 py-3 text-left transition-colors ${
                        tc.id === selectedId
                        ? "bg-[var(--red-deep)]/20"
                        : "hover:bg-[var(--rule)]/30"
                    }`}
                    >
                    <span className="font-mono mt-0.5 w-6 shrink-0 text-xs text-[var(--text-muted)]">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-body flex-1 text-sm leading-snug text-[var(--text-primary)]">
                        {tc.title}
                    </span>
                    <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLOR[tc.priority] }}
                    />
                    </button>
                </li>
                ))
            )}
            </ul>
        </div>

        {/* Divisor arrastável */}
        <div
            onMouseDown={onMouseDown}
            className="group relative w-1 shrink-0 cursor-col-resize bg-[var(--rule)] transition-colors hover:bg-[var(--red-signal)]"
        >
            <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* Painel direito — detalhe do caso */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-panel)]">
            {!selected ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <p className="font-display text-xl text-[var(--text-primary)]">Nenhum caso selecionado.</p>
                <p className="font-body mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                Selecione um caso na lista ou crie um novo.
                </p>
            </div>
            ) : (
            <article className="p-8">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--rule)] pb-5">
                <div>
                    <div className="flex items-center gap-2">
                    <span
                        className="font-mono rounded-sm border px-2 py-0.5 text-xs uppercase tracking-[0.1em]"
                        style={{
                        borderColor: PRIORITY_COLOR[selected.priority],
                        color: PRIORITY_COLOR[selected.priority],
                        }}
                    >
                        {PRIORITY_LABEL[selected.priority] ?? selected.priority}
                    </span>
                    {selected.isAutomated && (
                        <span className="font-mono rounded-sm border border-[var(--rule)] px-2 py-0.5 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        automatizado
                        </span>
                    )}
                    </div>
                    <h2 className="font-display mt-3 text-2xl text-[var(--text-primary)]">
                    {selected.title}
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={() => setEditingCase(selected)}
                    className="font-mono shrink-0 rounded-sm border border-[var(--rule)] px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                >
                    Editar
                </button>
                </div>

                <div className="mt-6">
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">Steps</p>
                <ol className="mt-3 space-y-3">
                    {parseSteps(selected.steps).map((step, index) => (
                    <li key={index} className="flex gap-4 rounded-sm border border-[var(--rule)] p-4">
                        <span className="font-mono shrink-0 text-lg text-[var(--red-signal)]">
                        {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-body text-base leading-relaxed text-[var(--text-primary)]">
                        {step}
                        </span>
                    </li>
                    ))}
                </ol>
                </div>

                {selected.expectedResult && (
                <div className="mt-6">
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Resultado esperado
                    </p>
                    <p className="font-body mt-3 rounded-sm border border-[var(--rule)] p-4 text-base leading-relaxed text-[var(--text-primary)]">
                    {selected.expectedResult}
                    </p>
                </div>
                )}

                {selected.isAutomated &&
                (parseTags(selected.tags).length > 0 || selected.automationNotes) && (
                    <div className="mt-6 border-t border-[var(--rule)] pt-5">
                    {parseTags(selected.tags).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                        {parseTags(selected.tags).map((tag) => (
                            <span
                            key={tag}
                            className="font-mono rounded-sm border border-[var(--rule)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                            >
                            #{tag}
                            </span>
                        ))}
                        </div>
                    )}
                    {selected.automationNotes && (
                        <p className="font-body mt-3 text-sm text-[var(--text-muted)]">
                        {selected.automationNotes}
                        </p>
                    )}
                    </div>
                )}
            </article>
            )}
        </div>
            {editingCase && (
                <TestCaseModal
                    workspaceSlug={workspaceSlug}
                    featureSlug={featureSlug}
                    testCase={editingCase}
                    isOpen={true}
                    onClose={() => setEditingCase(null)}
                />
            )}
        </div>
    );
}