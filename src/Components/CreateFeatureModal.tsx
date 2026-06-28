"use client";

import { useState, type ReactNode } from "react";
import { createFeature } from "@/src/app/(protected)/workspaces/[id]/actions";

interface CreateFeatureModalProps {
    workspaceId: string;
    children: ReactNode;
    className?: string;
}

export default function CreateFeatureModal({ workspaceId, children, className }: CreateFeatureModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#E11D2A");

    const action = createFeature.bind(null, workspaceId);

    function handleClose() {
        setIsOpen(false);
        setDescription("");
        setColor("#E11D2A");
    }

    return (
        <>
        <button type="button" onClick={() => setIsOpen(true)} className={className}>
            {children}
        </button>

        {isOpen && (
            <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={handleClose}
            >
            <div
                className="w-full max-w-md rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-[var(--rule)] pb-4">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
                    Nova feature
                    </p>
                    <h2 className="font-display mt-2 text-2xl text-[var(--text-primary)]">
                    Catalogue um novo escopo.
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                >
                    ESC ✕
                </button>
                </div>

                <form action={action} onSubmit={handleClose} className="mt-6 space-y-5">
                <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Nome
                    </label>
                    <input
                    name="name"
                    required
                    autoFocus
                    placeholder="Ex.: Checkout · Pagamento Pix"
                    className="mt-2 w-full rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                </div>

                <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Descrição
                    </label>
                    <textarea
                    name="description"
                    rows={3}
                    maxLength={280}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="O que essa feature cobre?"
                    className="mt-2 w-full resize-none rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                    <p className="mt-1 text-right font-mono text-xs text-[var(--text-muted)]/70">
                    {description.length}/280
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Tags Maestro
                    </label>
                    <input
                        name="maestroTags"
                        placeholder="smoke, regressao, pix"
                        className="mt-2 w-full rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                    <p className="mt-1 font-mono text-xs text-[var(--text-muted)]/70">
                        # separadas por vírgula
                    </p>
                    </div>

                    <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Cor
                    </label>
                    <input
                        type="color"
                        name="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="mt-2 h-[42px] w-16 cursor-pointer rounded-sm border border-[var(--rule)] bg-transparent p-1"
                    />
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[var(--rule)] pt-5">
                    <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                    Cancelar
                    </button>
                    <button
                    type="submit"
                    className="rounded-sm bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-black"
                    >
                    Criar feature →
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </>
    );
}