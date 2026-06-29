"use client";

import { useState, useEffect, useTransition, type ReactNode } from "react";
import { createFeature, updateFeature, deleteFeature } from "@/src/app/(protected)/workspaces/[id]/actions";

interface FeatureItem {
    id: string;
    name: string;
    description: string | null;
    color: string;
    maestroTags: string | null;
}

interface FeatureModalProps {
    workspaceId: string;
    feature?: FeatureItem | null; // null/undefined = criação · presente = edição

    // Modo trigger: passa children + className, o componente se controla por dentro.
    children?: ReactNode;
    className?: string;

    // Modo controlado: a abertura é decidida de fora (ex: clique no card).
    isOpen?: boolean;
    onClose?: () => void;
}

const DEFAULT_COLOR = "#E11D2A";

export default function FeatureModal({
    workspaceId,
    feature,
    children,
    className,
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
    }: FeatureModalProps) {
    const isTriggerMode = children !== undefined;

    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = isTriggerMode ? internalOpen : controlledIsOpen ?? false;

    function close() {
        if (isTriggerMode) {
        setInternalOpen(false);
        } else {
        controlledOnClose?.();
        }
    }

    const isEditing = Boolean(feature);

    const [description, setDescription] = useState(feature?.description ?? "");
    const [color, setColor] = useState(feature?.color ?? DEFAULT_COLOR);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();

    // reseta os campos sempre que o modal abre (pra criação ou pra outra feature)
    useEffect(() => {
        if (isOpen) {
        setDescription(feature?.description ?? "");
        setColor(feature?.color ?? DEFAULT_COLOR);
        setConfirmDelete(false);
        }
    }, [isOpen, feature]);

    const action = isEditing
        ? updateFeature.bind(null, workspaceId, feature!.id)
        : createFeature.bind(null, workspaceId);

    function handleDelete() {
        if (!feature) return;
        startTransition(async () => {
        await deleteFeature(workspaceId, feature.id);
        close();
        });
    }

    return (
        <>
        {isTriggerMode && (
            <button type="button" onClick={() => setInternalOpen(true)} className={className}>
            {children}
            </button>
        )}

        {isOpen && (
            <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={close}
            >
            <div
                className="w-full max-w-md rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-[var(--rule)] pb-4">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
                    {isEditing ? "Editar feature" : "Nova feature"}
                    </p>
                    <h2 className="font-display mt-2 text-2xl text-[var(--text-primary)]">
                    {isEditing ? "Ajuste o escopo." : "Catalogue um novo escopo."}
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={close}
                    className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                >
                    ESC ✕
                </button>
                </div>

                {confirmDelete ? (
                <div className="mt-6">
                    <p className="font-body text-sm text-[var(--text-primary)]">
                    Apagar <strong>{feature!.name}</strong>?
                    </p>
                    <p className="font-mono mt-2 text-xs text-[var(--text-muted)]">
                    # os casos de teste vinculados também serão removidos. Essa ação não pode ser desfeita.
                    </p>

                    <div className="mt-6 flex justify-end gap-3 border-t border-[var(--rule)] pt-5">
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="rounded-sm bg-[var(--red-signal)] px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
                    >
                        {isPending ? "Apagando…" : "Confirmar exclusão"}
                    </button>
                    </div>
                </div>
                ) : (
                <form action={action} onSubmit={close} className="mt-6 space-y-5">
                    <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Nome
                    </label>
                    <input
                        name="name"
                        required
                        autoFocus
                        defaultValue={feature?.name ?? ""}
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
                        defaultValue={feature?.maestroTags ?? ""}
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

                    <div className="flex items-center justify-between border-t border-[var(--rule)] pt-5">
                    {isEditing ? (
                        <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--red-signal)] hover:underline"
                        >
                        Apagar feature
                        </button>
                    ) : (
                        <span />
                    )}

                    <div className="flex gap-3">
                        <button
                        type="button"
                        onClick={close}
                        className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                        Cancelar
                        </button>
                        <button
                        type="submit"
                        className="rounded-sm bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-black"
                        >
                        {isEditing ? "Salvar" : "Criar feature →"}
                        </button>
                    </div>
                    </div>
                </form>
                )}
            </div>
            </div>
        )}
        </>
    );
}