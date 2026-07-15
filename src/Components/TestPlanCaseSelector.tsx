"use client";

import { useState, useTransition, useMemo } from "react";
import {
    addCaseToPlan,
    removeCaseFromPlan,
    addCasesByTag,
} from "@/src/app/(protected)/workspaces/[workspaceSlug]/test-plans/actions";

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
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const planCaseIds = useMemo(() => new Set(planCases.map((tc) => tc.id)), [planCases]);

    const availableCases = useMemo(() => {
        return features
            .flatMap((f) =>
                f.testCases.map((tc) => ({
                    ...tc,
                    featureName: f.name,
                    featureColor: f.color,
                    featureId: f.id,
                }))
            )
            .filter((tc) => {
                if (activeTag && !parseTags(tc.tags).includes(activeTag)) return false;
                if (activeFeature && tc.featureId !== activeFeature) return false;
                return true;
            });
    }, [features, activeTag, activeFeature]);

    function setLoading(id: string, loading: boolean) {
        setLoadingIds((prev) => {
            const next = new Set(prev);
            loading ? next.add(id) : next.delete(id);
            return next;
        });
    }

    function handleToggle(testCaseId: string, isAdded: boolean) {
        setLoading(testCaseId, true);
        startTransition(async () => {
            if (isAdded) {
                await removeCaseFromPlan(workspaceSlug, testPlanSlug, testCaseId);
            } else {
                await addCaseToPlan(workspaceSlug, testPlanSlug, testCaseId);
            }
            setLoading(testCaseId, false);
        });
    }

    function handleAddByTag(tag: string) {
        startTransition(async () => {
            await addCasesByTag(workspaceSlug, testPlanSlug, tag);
        });
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Seletor de casos */}
            <section>
                <p className="font-mono mb-4 text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    {planType === "AUTOMATED"
                        ? "Casos disponíveis — só automatizados"
                        : "Casos disponíveis"}
                </p>

                {/* Filtros */}
                <div className="mb-4 space-y-2">
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <span className="font-mono self-center text-xs text-[var(--text-muted)]">tag</span>
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
                                <div key={tag} className="flex items-center gap-1">
                                    <button
                                        onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                                        className={`font-mono rounded-sm border px-2.5 py-1 text-xs transition-colors ${
                                            activeTag === tag
                                                ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                                                : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                                        }`}
                                    >
                                        #{tag}
                                    </button>
                                    <button
                                        onClick={() => handleAddByTag(tag)}
                                        disabled={isPending}
                                        title={`Adicionar todos com #${tag}`}
                                        className="font-mono rounded-sm border border-[var(--rule)] px-1.5 py-1 text-xs text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)] disabled:opacity-40"
                                    >
                                        + todos
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {features.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            <span className="font-mono self-center text-xs text-[var(--text-muted)]">feature</span>
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
                                    <span
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: f.color }}
                                    />
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {availableCases.length === 0 ? (
                    <div className="rounded-sm border border-dashed border-[var(--rule)] py-16 text-center">
                        <p className="font-body text-sm text-[var(--text-muted)]">
                            Nenhum caso encontrado com esse filtro.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {availableCases.map((tc) => {
                            const isAdded = planCaseIds.has(tc.id);
                            const isLoading = loadingIds.has(tc.id);
                            return (
                                <li
                                    key={tc.id}
                                    className={`flex items-center gap-3 rounded-sm border px-4 py-3 transition-colors ${
                                        isAdded
                                            ? "border-[var(--red-signal)] bg-[var(--red-deep)]/10"
                                            : "border-[var(--rule)] bg-[var(--bg-panel)]"
                                    }`}
                                >
                                    <span
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{ backgroundColor: tc.featureColor }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-body truncate text-sm text-[var(--text-primary)]">
                                            {tc.title}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            <span className="font-mono text-[10px] text-[var(--text-muted)]">
                                                {tc.featureName}
                                            </span>
                                            {parseTags(tc.tags).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="font-mono rounded-sm border border-[var(--rule)] px-1 text-[10px] text-[var(--text-muted)]"
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
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(tc.id, isAdded)}
                                        disabled={isLoading}
                                        className={`font-mono shrink-0 rounded-sm border px-3 py-1 text-xs transition-colors disabled:opacity-40 ${
                                            isAdded
                                                ? "border-[var(--red-signal)] text-[var(--red-signal)] hover:bg-[var(--red-signal)] hover:text-black"
                                                : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                                        }`}
                                    >
                                        {isLoading ? "…" : isAdded ? "remover" : "adicionar"}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* Casos no plano */}
            <aside>
                <p className="font-mono mb-4 text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    No plano · {String(planCases.length).padStart(2, "0")}
                </p>

                {planCases.length === 0 ? (
                    <div className="rounded-sm border border-dashed border-[var(--rule)] py-12 text-center">
                        <p className="font-body text-sm text-[var(--text-muted)]">
                            Nenhum caso adicionado ainda.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {planCases.map((tc, index) => (
                            <li
                                key={tc.id}
                                className="flex items-start gap-3 rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] px-4 py-3"
                            >
                                <span className="font-mono mt-0.5 w-5 shrink-0 text-xs text-[var(--text-muted)]">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-body text-sm text-[var(--text-primary)]">
                                        {tc.title}
                                    </p>
                                    <p className="font-mono mt-0.5 text-[10px] text-[var(--text-muted)]">
                                        {tc.featureName}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle(tc.id, true)}
                                    disabled={loadingIds.has(tc.id)}
                                    className="font-mono shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)] disabled:opacity-40"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </aside>
        </div>
    );
}