"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CreateFeatureModal from "./CreateFeatureModal";

interface FeatureItem {
    id: string;
    name: string;
    description: string | null;
    color: string;
    maestroTags: string | null;
    testCaseCount: number;
}

interface FeaturesGridProps {
    features: FeatureItem[];
    workspaceId: string;
}

function tagsOf(maestroTags: string | null) {
    return maestroTags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
}

export default function FeaturesGrid({ features, workspaceId }: FeaturesGridProps) {
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const allTags = useMemo(() => {
        const set = new Set<string>();
        features.forEach((f) => tagsOf(f.maestroTags).forEach((t) => set.add(t)));
        return Array.from(set).sort();
    }, [features]);

    const filteredFeatures = useMemo(() => {
        if (!activeTag) return features;
        return features.filter((f) => tagsOf(f.maestroTags).includes(activeTag));
    }, [features, activeTag]);

    return (
        <div>
        {allTags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
            <button
                onClick={() => setActiveTag(null)}
                className={`font-mono rounded-sm border px-3 py-1.5 text-xs uppercase tracking-[0.1em] transition-colors ${
                activeTag === null
                    ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                    : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                }`}
            >
                todas · {features.length}
            </button>

            {allTags.map((tag) => {
                const count = features.filter((f) => tagsOf(f.maestroTags).includes(tag)).length;
                return (
                <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`font-mono rounded-sm border px-3 py-1.5 text-xs uppercase tracking-[0.1em] transition-colors ${
                    activeTag === tag
                        ? "border-[var(--red-signal)] text-[var(--red-signal)]"
                        : "border-[var(--rule)] text-[var(--text-muted)] hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
                    }`}
                >
                    #{tag} · {count}
                </button>
                );
            })}
            </div>
        )}

        {filteredFeatures.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-[var(--rule)] py-24 text-center">
            <p className="font-display text-xl text-[var(--text-primary)]">
                {features.length === 0 ? "Nenhuma feature cadastrada." : "Nada por aqui com essa tag."}
            </p>
            <p className="font-body mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                {features.length === 0
                ? "Comece catalogando os escopos de teste desse workspace."
                : "Tente outra tag ou limpe o filtro."}
            </p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {filteredFeatures.map((feature) => (
                <Link
                key={feature.id}
                href={`/workspaces/${workspaceId}/features/${feature.id}`}
                className="group flex h-72 flex-col justify-between rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--red-signal)] hover:shadow-[0_0_24px_-8px_var(--red-signal)]"
                style={{ borderTopColor: feature.color, borderTopWidth: "4px" }}
                >
                <div>
                    <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: feature.color }}
                    />
                    <h3 className="font-display mt-3 line-clamp-2 text-lg leading-tight text-[var(--text-primary)]">
                    {feature.name}
                    </h3>
                    {feature.description && (
                    <p className="font-body mt-2 line-clamp-4 text-sm text-[var(--text-muted)]">
                        {feature.description}
                    </p>
                    )}
                </div>

                <div>
                    {tagsOf(feature.maestroTags).length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {tagsOf(feature.maestroTags).map((tag) => (
                        <span
                            key={tag}
                            className="font-mono rounded-sm border border-[var(--rule)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                        >
                            #{tag}
                        </span>
                        ))}
                    </div>
                    )}
                    <div className="flex items-center justify-between border-t border-[var(--rule)] pt-3">
                    <span className="font-mono text-xs text-[var(--text-muted)]">casos de teste</span>
                    <span className="font-mono text-sm font-medium text-[var(--red-signal)]">
                        {String(feature.testCaseCount).padStart(2, "0")}
                    </span>
                    </div>
                </div>
                </Link>
            ))}

            <CreateFeatureModal
                workspaceId={workspaceId}
                className="flex h-72 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-[var(--rule)] text-[var(--text-muted)] transition-colors hover:border-[var(--red-signal)] hover:text-[var(--red-signal)]"
            >
                <span className="text-3xl">+</span>
                <span className="font-mono text-xs uppercase tracking-[0.15em]">nova feature</span>
            </CreateFeatureModal>
            </div>
        )}
        </div>
    );
}