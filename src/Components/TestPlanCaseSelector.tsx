"use client";

import { useState, useTransition, useMemo } from "react";
import { saveTestPlanCases } from "@/src/app/(protected)/workspaces/[workspaceSlug]/test-plans/actions";

interface TestCaseItem {
    id: string;
    title: string;
    tags: string | null;
    isAutomated: boolean;
    priority: string;
    featureName?: string;
    featureColor?: string;
}

interface FeatureWithCases {
    id: string;
    name: string;
    color: string;
    testCases: Omit<TestCaseItem, "featureName" | "featureColor">[];
}

interface TestPlanCaseSelectorProps {
    workspaceSlug: string;
    testPlanSlug: string;
    planType: string;
    planCases: TestCaseItem[];
    features: FeatureWithCases[];
    allTags: string[];
}

const PRIORITY_COLOR: Record<string, string> = {
    LOW: "var(--text-muted)",
    MEDIUM: "var(--red-signal)",
    HIGH: "var(--red-deep)",
};

const PRIORITY_LABEL: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
};

function parseTags(raw: string | null) {
    return raw?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
}

export default function TestPlanCaseSelector({
    workspaceSlug,
    testPlanSlug,
    planType,
    planCases,
    features,
    allTags,
}: TestPlanCaseSelectorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        () => new Set((planCases ?? []).map((tc) => tc.id))
    );

    const allCases = useMemo(() =>
        features.flatMap((f) =>
            f.testCases.map((tc) => ({
                ...tc,
                featureName: f.name,
                featureColor: f.color,
                featureId: f.id,
            }))
        ), [features]);

    const visibleCases = useMemo(() =>
        allCases.filter((tc) => {
            if (activeTag && !parseTags(tc.tags).includes(activeTag)) return false;
            if (activeFeature && tc.featureId !== activeFeature) return false;
            return true;
        }), [allCases, activeTag, activeFeature]);

    const selectedCases = useMemo(() =>
        allCases.filter((tc) => selectedIds.has(tc.id)),
        [allCases, selectedIds]);

    const maestroTags = useMemo(() =>
        Array.from(new Set(selectedCases.flatMap((tc) => parseTags(tc.tags)))),
        [selectedCases]);

    const maestroCommand = planType === "AUTOMATED" && maestroTags.length > 0
        ? `maestro test --tags=${maestroTags.join(",")}`
        : null;

    const allVisibleSelected = visibleCases.length > 0 &&
        visibleCases.every((tc) => selectedIds.has(tc.id));

    function toggleOne(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleAllVisible() {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (allVisibleSelected) {
                visibleCases.forEach((tc) => next.delete(tc.id));
            } else {
                visibleCases.forEach((tc) => next.add(tc.id));
            }
            return next;
        });
    }

    function handleSave() {
        startTransition(async () => {
            await saveTestPlanCases(workspaceSlug, testPlanSlug, Array.from(selectedIds));
            setIsEditing(false);
        });
    }

    function handleCancel() {
        setSelectedIds(new Set((planCases ?? []).map((tc) => tc.id)));
        setActiveTag(null);
        setActiveFeature(null);
        setIsEditing(false);
    }

    // ── Modo visualização ──────────────────────────────────────────
    if (!isEditing) {
        return (
            <div>
                <div className="mb-6 flex items-center justify-between">
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Casos · {String(selectedCases.length).padStart(2, "0")}
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="font-mono rounded-sm border border-[var(--rule)] px-4 py-1.5 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                    >
                        Editar casos
                    </button>
                </div>

                {maestroCommand && (
                    <div className="mb-6 flex items-center gap-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3">
                        <span className="font-mono text-xs text-[var(--text-muted)]">comando</span>
                        <code className="font-mono flex-1 text-sm text-[var(--red-signal)]">
                            {maestroCommand}
                        </code>
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(maestroCommand)}
                            className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                            copiar
                        </button>
                    </div>
                )}

                {selectedCases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-[var(--rule)] py-24 text-center">
                        <p className="font-display text-xl text-[var(--text-primary)]">
                            Nenhum caso no plano.
                        </p>
                        <p className="font-body mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                            Clique em "Editar casos" pra adicionar casos de teste a esse plano.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="font-mono mt-6 rounded-sm bg-[var(--text-primary)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-black"
                        >
                            + adicionar casos
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {selectedCases.map((tc, index) => (
                            <li
                                key={tc.id}
                                className="flex items-center gap-4 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] px-5 py-4"
                            >
                                <span className="font-mono w-6 shrink-0 text-xs text-[var(--text-muted)]">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: tc.featureColor }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-body text-sm text-[var(--text-primary)]">
                                        {tc.title}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                            {tc.featureName}
                                        </span>
                                        {parseTags(tc.tags).map((tag) => (
                                            <span
                                                key={tag}
                                                className="font-mono rounded-sm border border-[var(--rule)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span
                                    className="font-mono rounded-sm border px-2 py-0.5 text-[10px] uppercase"
                                    style={{
                                        borderColor: PRIORITY_COLOR[tc.priority],
                                        color: PRIORITY_COLOR[tc.priority],
                                    }}
                                >
                                    {PRIORITY_LABEL[tc.priority]}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    }

    // ── Modo edição ────────────────────────────────────────────────
    return (
        <div className="pb-24">
            {/* Filtros */}
            <div className="space-y-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-4">
                {allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                            Tag
                        </span>
                        <button
                            onClick={() => setActiveTag(null)}
                            className={`font-mono rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                                activeTag === null
                                    ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                                    : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                            }`}
                        >
                            todas
                        </button>
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                                className={`font-mono rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                                    activeTag === tag
                                        ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                                        : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                                }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}

                {features.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                            Feature
                        </span>
                        <button
                            onClick={() => setActiveFeature(null)}
                            className={`font-mono rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                                activeFeature === null
                                    ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                                    : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                            }`}
                        >
                            todas
                        </button>
                        {features.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFeature(f.id === activeFeature ? null : f.id)}
                                className={`font-mono flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                                    activeFeature === f.id
                                        ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                                        : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                                }`}
                            >
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                                {f.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lista com checkboxes */}
            <div className="mt-4">
                {visibleCases.length > 0 && (
                    <div className="mb-2 flex items-center gap-3 px-4 py-2">
                        <button
                            type="button"
                            onClick={toggleAllVisible}
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-xs transition-colors ${
                                allVisibleSelected
                                    ? "border-[var(--red-signal)] bg-[var(--red-signal)] text-black"
                                    : "border-[var(--rule)] hover:border-[var(--red-signal)]"
                            }`}
                        >
                            {allVisibleSelected && "✓"}
                        </button>
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                            {allVisibleSelected ? "desmarcar todos" : "selecionar todos"} ({visibleCases.length})
                        </span>
                    </div>
                )}

                <ul className="space-y-1.5">
                    {visibleCases.map((tc) => {
                        const isSelected = selectedIds.has(tc.id);
                        return (
                            <li
                                key={tc.id}
                                onClick={() => toggleOne(tc.id)}
                                className={`flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 transition-all ${
                                    isSelected
                                        ? "border-[var(--red-signal)]/50 bg-[var(--red-deep)]/10"
                                        : "border-[var(--rule)] bg-[var(--bg-panel)] hover:border-[var(--rule)]/60"
                                }`}
                            >
                                <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-xs transition-colors ${
                                        isSelected
                                            ? "border-[var(--red-signal)] bg-[var(--red-signal)] text-black"
                                            : "border-[var(--rule)]"
                                    }`}
                                >
                                    {isSelected && "✓"}
                                </span>
                                <span
                                    className="h-2 w-2 shrink-0 rounded-full"
                                    style={{ backgroundColor: tc.featureColor }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="font-body text-sm text-[var(--text-primary)]">
                                        {tc.title}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                            {tc.featureName}
                                        </span>
                                        {parseTags(tc.tags).map((tag) => (
                                            <span
                                                key={tag}
                                                className="font-mono rounded-sm border border-[var(--rule)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <span
                                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: PRIORITY_COLOR[tc.priority] }}
                                />
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Barra fixa no rodapé */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--rule)] bg-[var(--bg)] px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    <span className="font-mono text-sm text-[var(--text-muted)]">
                        <span className="text-[var(--red-signal)]">{selectedIds.size}</span>
                        {" "}caso{selectedIds.size !== 1 ? "s" : ""} selecionado{selectedIds.size !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="font-mono rounded-sm border border-[var(--rule)] px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isPending}
                            className="font-mono rounded-sm bg-[var(--text-primary)] px-6 py-2 text-xs font-medium text-black disabled:opacity-40"
                        >
                            {isPending ? "Salvando…" : "Salvar plano →"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}