"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createWorkspace } from "@/src/app/(protected)/workspaces/new/actions";

interface CreateWorkspaceModalProps {
    children: ReactNode;
    className?: string;
}

export default function CreateWorkspaceModal({ children, className }: CreateWorkspaceModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [invites, setInvites] = useState<string[]>([]);
    const [emailError, setEmailError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        function onKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") handleClose();
        }
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    function resetState() {
        setDescription("");
        setEmailInput("");
        setInvites([]);
        setEmailError(null);
    }

    function handleClose() {
        setIsOpen(false);
        resetState();
    }

    function handleAddInvite() {
        const email = emailInput.trim().toLowerCase();
        if (!email) return;

        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!isValid) {
        setEmailError("E-mail inválido.");
        return;
        }
        if (invites.includes(email)) {
        setEmailError("Esse e-mail já foi adicionado.");
        return;
        }

        setInvites((prev) => [...prev, email]);
        setEmailInput("");
        setEmailError(null);
    }

    function handleRemoveInvite(email: string) {
        setInvites((prev) => prev.filter((e) => e !== email));
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
                    Novo workspace
                    </p>
                    <h2 className="font-display mt-2 text-2xl text-[var(--text-primary)]">
                    Crie seu repositório.
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={handleClose}
                    className="font-mono text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--red-signal)]"
                >
                    ESC ✕
                </button>
                </div>

                <form action={createWorkspace} className="mt-6 space-y-5">
                <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Nome
                    </label>
                    <input
                    name="name"
                    required
                    autoFocus
                    placeholder="Ex.: DepoT · Mobile"
                    className="mt-2 w-full rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                </div>

                <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Descrição
                    </label>
                    <textarea
                    name="description"
                    maxLength={280}
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="O que esse workspace cobre? Times, produtos, escopo..."
                    className="mt-2 w-full resize-none rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                    <p className="mt-1 text-right font-mono text-xs text-[var(--text-muted)]/70">
                    {description.length}/280
                    </p>
                </div>

                <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Convidar membros
                    </label>
                    <div className="mt-2 flex gap-2">
                    <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                        setEmailInput(e.target.value);
                        setEmailError(null);
                        }}
                        onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddInvite();
                        }
                        }}
                        placeholder="email@empresa.com"
                        className="flex-1 rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                    <button
                        type="button"
                        onClick={handleAddInvite}
                        className="rounded-sm bg-[var(--text-primary)] px-4 text-sm font-medium text-black"
                    >
                        Adicionar
                    </button>
                    </div>

                    {emailError ? (
                    <p className="mt-1 font-mono text-xs text-[var(--red-signal)]">{emailError}</p>
                    ) : (
                    <p className="mt-1 font-mono text-xs text-[var(--text-muted)]/70">
                        # opcional · vamos enviar um convite por e-mail.
                    </p>
                    )}

                    {invites.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                        {invites.map((email) => (
                        <li
                            key={email}
                            className="flex items-center justify-between rounded-sm border border-[var(--rule)] px-3 py-1.5"
                        >
                            <span className="font-mono text-xs text-[var(--text-primary)]">{email}</span>
                            <button
                            type="button"
                            onClick={() => handleRemoveInvite(email)}
                            className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                            >
                            remover
                            </button>
                            <input type="hidden" name="inviteEmails" value={email} />
                        </li>
                        ))}
                    </ul>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--rule)] pt-5">
                    <p className="font-mono text-xs text-[var(--text-muted)]">
                    {invites.length} convite{invites.length === 1 ? "" : "s"}
                    </p>
                    <div className="flex gap-3">
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
                        Criar workspace →
                    </button>
                    </div>
                </div>
                </form>
            </div>
            </div>
        )}
        </>
    );
}