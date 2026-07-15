"use client";

import { useState, useEffect, useTransition, type ReactNode } from "react";
import {
    createTestPlan,
    updateTestPlan,
    deleteTestPlan,
} from "@/src/app/(protected)/workspaces/[workspaceSlug]/test-plans/actions";

interface PlanItem {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    type: string;
}

interface TestPlanModalProps {
    workspaceSlug: string;
    plan?: PlanItem | null;
    children?: ReactNode;
    className?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function TestPlanModal({
    workspaceSlug,
    plan,
    children,
    className,
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
}: TestPlanModalProps) {
    const isTriggerMode = children !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = isTriggerMode ? internalOpen : controlledIsOpen ?? false;
    const isEditing = Boolean(plan);

    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();

    function close() {
        if (isTriggerMode) setInternalOpen(false);
        else controlledOnClose?.();
    }

    useEffect(() => {
        if (isOpen) setConfirmDelete(false);
    }, [isOpen]);

    const action = isEditing
        ? updateTestPlan.bind(null, workspaceSlug, plan!.slug)
        : createTestPlan.bind(null, workspaceSlug);

    function handleDelete() {
        if (!plan) return;
        startTransition(async () => {
            await deleteTestPlan(workspaceSlug, plan.slug);
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
                                    {isEditing ? "Editar plano" : "Novo test plan"}
                                </p>
                                <h2 className="font-display mt-2 text-2xl text-[var(--text-primary)]">
                                    {isEditing ? "Ajuste o plano." : "Organize sua execução."}
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
                                    Apagar <strong>{plan!.name}</strong>?
                                </p>
                                <p className="font-mono mt-2 text-xs text-[var(--text-muted)]">
                                    # os casos vinculados são desassociados, não apagados.
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
                                        defaultValue={plan?.name ?? ""}
                                        placeholder="Ex.: Regressão Sprint 12"
                                        className="mt-2 w-full rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                                    />
                                </div>

                                <div>
                                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                        Descrição
                                    </label>
                                    <textarea
                                        name="description"
                                        rows={2}
                                        defaultValue={plan?.description ?? ""}
                                        placeholder="Objetivo desse plano de teste"
                                        className="mt-2 w-full resize-none rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                                    />
                                </div>

                                <div>
                                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                        Tipo
                                    </label>
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        {(["MANUAL", "AUTOMATED"] as const).map((type) => (
                                            <label
                                                key={type}
                                                className="flex cursor-pointer items-center gap-2 rounded-sm border border-[var(--rule)] p-3 has-[:checked]:border-[var(--red-signal)]"
                                            >
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    value={type}
                                                    defaultChecked={plan ? plan.type === type : type === "MANUAL"}
                                                    className="accent-[var(--red-signal)]"
                                                />
                                                <span className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--text-primary)]">
                                                    {type === "MANUAL" ? "Manual" : "Automatizado"}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-[var(--rule)] pt-5">
                                    {isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDelete(true)}
                                            className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--red-signal)] hover:underline"
                                        >
                                            Apagar plano
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
                                            {isEditing ? "Salvar →" : "Criar plano →"}
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