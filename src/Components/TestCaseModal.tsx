"use client";

import { parseSteps } from "@/src/lib/testCaseSteps";
import {
    useEffect,
    useRef,
    useState,
    useTransition,
    type KeyboardEvent,
    type ReactNode,
} from "react";
import {
    createTestCase,
    updateTestCase,
    deleteTestCase,
} from "@/src/app/(protected)/workspaces/[workspaceId]/features/[featureId]/actions";

interface TestCaseItem {
    id: string;
    title: string;
    steps: string | null;
    expectedResult: string | null;
    priority: string;
    isAutomated: boolean;
    automationTags: string | null;
    automationNotes: string | null;
}

interface TestCaseModalProps {
    workspaceId: string;
    featureId: string;
    testCase?: TestCaseItem | null; // null/undefined = criação · presente = edição

    children?: ReactNode;
    className?: string;

    isOpen?: boolean;
    onClose?: () => void;
}

export default function TestCaseModal({
    workspaceId,
    featureId,
    testCase,
    children,
    className,
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
    }: TestCaseModalProps) {
    const isTriggerMode = children !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = isTriggerMode ? internalOpen : controlledIsOpen ?? false;

    function close() {
        if (isTriggerMode) setInternalOpen(false);
        else controlledOnClose?.();
    }

    const isEditing = Boolean(testCase);

    const [steps, setSteps] = useState<string[]>(() =>
        testCase?.steps ? parseSteps(testCase.steps) : [""]
    );
    const [isAutomated, setIsAutomated] = useState(testCase?.isAutomated ?? false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
        setSteps(testCase?.steps ? parseSteps(testCase.steps) : [""]);
        setIsAutomated(testCase?.isAutomated ?? false);
        setConfirmDelete(false);
        }
    }, [isOpen, testCase]);

    const action = isEditing
        ? updateTestCase.bind(null, workspaceId, featureId, testCase!.id)
        : createTestCase.bind(null, workspaceId, featureId);

    function handleDelete() {
        if (!testCase) return;
        startTransition(async () => {
        await deleteTestCase(workspaceId, featureId, testCase.id);
        close();
        });
    }

    function addStepAfter(index: number) {
        setSteps((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, "");
        return next;
        });
        requestAnimationFrame(() => inputRefs.current[index + 1]?.focus());
    }

    function handleStepKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
        if (e.key === "Enter") {
        e.preventDefault();
        addStepAfter(index);
        } else if (e.key === "Backspace" && steps[index] === "" && steps.length > 1) {
        e.preventDefault();
        setSteps((prev) => prev.filter((_, i) => i !== index));
        requestAnimationFrame(() => inputRefs.current[Math.max(0, index - 1)]?.focus());
        }
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
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
            onClick={close}
            >
            <div
                className="my-8 w-full max-w-2xl rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-[var(--rule)] pb-4">
                <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
                    {isEditing ? "Editar caso de teste" : "Novo caso de teste"}
                    </p>
                    <h2 className="font-display mt-2 text-2xl text-[var(--text-primary)]">
                    {isEditing ? "Ajuste o caso." : "Registre um novo caso."}
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
                    Apagar <strong>{testCase!.title}</strong>?
                    </p>
                    <p className="font-mono mt-2 text-xs text-[var(--text-muted)]">
                    # essa ação não pode ser desfeita.
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
                        Título
                    </label>
                    <input
                        name="title"
                        required
                        autoFocus
                        defaultValue={testCase?.title ?? ""}
                        placeholder="Ex.: Login com credenciais válidas"
                        className="mt-2 w-full rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                    </div>

                    <div>
                    <div className="flex items-center justify-between">
                        <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Steps
                        </label>
                        <p className="font-mono text-xs text-[var(--text-muted)]/60">
                        # enter pra próximo step
                        </p>
                    </div>

                    <div className="mt-2 space-y-2">
                        {steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="font-mono w-6 shrink-0 text-right text-xs text-[var(--text-muted)]">
                            {String(index + 1).padStart(2, "0")}
                            </span>
                            <input
                            name="step"
                            value={step}
                            ref={(el) => {
                                inputRefs.current[index] = el;
                            }}
                            onChange={(e) =>
                                setSteps((prev) =>
                                prev.map((s, i) => (i === index ? e.target.value : s))
                                )
                            }
                            onKeyDown={(e) => handleStepKeyDown(e, index)}
                            placeholder={`Step ${index + 1}`}
                            className="flex-1 rounded-sm border border-[var(--rule)] bg-transparent p-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                            />
                            {steps.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setSteps((prev) => prev.filter((_, i) => i !== index))}
                                className="font-mono shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                            >
                                remover
                            </button>
                            )}
                        </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => addStepAfter(steps.length - 1)}
                        className="font-mono mt-2 text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-[var(--red-signal)]"
                    >
                        + adicionar step
                    </button>
                    </div>

                    <div>
                    <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Resultado esperado
                    </label>
                    <textarea
                        name="expectedResult"
                        rows={2}
                        defaultValue={testCase?.expectedResult ?? ""}
                        placeholder="O que deve acontecer ao final do fluxo?"
                        className="mt-2 w-full resize-none rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                    />
                    </div>

                    <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Prioridade
                        </label>
                        <select
                        name="priority"
                        defaultValue={testCase?.priority ?? "MEDIUM"}
                        className="mt-2 w-full rounded-sm border border-[var(--rule)] bg-[var(--bg-panel)] p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                        >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                        </select>
                    </div>

                    <div className="flex flex-1 items-end gap-2 pb-2.5">
                        <input
                        type="checkbox"
                        id="isAutomated"
                        name="isAutomated"
                        checked={isAutomated}
                        onChange={(e) => setIsAutomated(e.target.checked)}
                        className="h-4 w-4 accent-[var(--red-signal)]"
                        />
                        <label
                        htmlFor="isAutomated"
                        className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]"
                        >
                        Automatizado
                        </label>
                    </div>
                    </div>

                    {isAutomated && (
                    <div className="space-y-4 rounded-sm border border-dashed border-[var(--rule)] p-4">
                        <div>
                        <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                            Tags de automação
                        </label>
                        <input
                            name="automationTags"
                            defaultValue={testCase?.automationTags ?? ""}
                            placeholder="smoke, regressao"
                            className="mt-2 w-full rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                        />
                        </div>
                        <div>
                        <label className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">
                            Notas de automação
                        </label>
                        <textarea
                            name="automationNotes"
                            rows={2}
                            defaultValue={testCase?.automationNotes ?? ""}
                            placeholder="Observações pra quem for automatizar"
                            className="mt-2 w-full resize-none rounded-sm border border-[var(--rule)] bg-transparent p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--red-signal)]"
                        />
                        </div>
                    </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[var(--rule)] pt-5">
                    {isEditing ? (
                        <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--red-signal)] hover:underline"
                        >
                        Apagar caso
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
                        {isEditing ? "Salvar →" : "Criar caso →"}
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