"use client";

import { useState, type ReactNode } from "react";
import { inviteMember } from "@/src/app/(protected)/workspaces/[workspaceId]/actions";

interface InviteMemberModalProps {
    workspaceId: string;
    children: ReactNode;
    className?: string;
}

export default function InviteMemberModal({ workspaceId, children, className }: InviteMemberModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    function handleClose() {
        setIsOpen(false);
        setError(null);
    }

    async function handleSubmit(formData: FormData) {
        setError(null);
        setIsPending(true);
        try {
        await inviteMember.bind(null, workspaceId)(formData);
        handleClose();
        } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar convite.");
        } finally {
        setIsPending(false);
        }
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
                className="w-full max-w-sm rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-[var(--rule)] pb-4">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
                    Convidar
                    </p>
                    <h2 className="font-display mt-2 text-xl text-[var(--text-primary)]">
                    Adicionar ao workspace.
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

                <form action={handleSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    E-mail
                    </label>
                    <input
                    name="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="email@empresa.com"
                    onChange={() => setError(null)}
                    className={`mt-2 w-full rounded-sm border bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)] ${
                        error ? "border-[var(--red-signal)]" : "border-[var(--rule)]"
                    }`}
                    />
                    {error && (
                    <p className="mt-1.5 font-mono text-xs text-[var(--red-signal)]">{error}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t border-[var(--rule)] pt-4">
                    <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-sm border border-[var(--rule)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                    Cancelar
                    </button>
                    <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-sm bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
                    >
                    {isPending ? "Enviando…" : "Enviar convite →"}
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </>
    );
}