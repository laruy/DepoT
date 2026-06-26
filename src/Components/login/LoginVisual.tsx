const LEDGER = [
    { id: "TC-014", label: "login · google oauth", status: "PASS" },
    { id: "TC-015", label: "workspace · criação", status: "PASS" },
    { id: "TC-016", label: "convite · aceite duplicado", status: "CORRIGIDO" },
    { id: "TC-017", label: "membership · remoção", status: "PENDENTE" },
];

export function LoginVisual() {
    return (
        <div className="relative hidden overflow-hidden bg-[var(--bg-panel)] p-12 lg:flex lg:flex-col lg:justify-center">
        {/* brasas */}
        <span className="ember absolute bottom-0 left-[18%] h-1 w-1 rounded-full bg-[var(--red-signal)] shadow-[0_0_6px_var(--red-signal)]" style={{ animationDelay: "0s" }} />
        <span className="ember absolute bottom-0 left-[42%] h-1 w-1 rounded-full bg-[var(--red-signal)] shadow-[0_0_6px_var(--red-signal)]" style={{ animationDelay: "1.8s" }} />
        <span className="ember absolute bottom-0 left-[70%] h-1 w-1 rounded-full bg-[var(--red-signal)] shadow-[0_0_6px_var(--red-signal)]" style={{ animationDelay: "3.4s" }} />

        <div className="relative max-w-md">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--red-signal)]">
            DepoT
            </p>

            <h1 className="font-display mt-6 text-4xl leading-tight text-[var(--text-primary)]">
            Cada regressão <em className="italic text-[var(--red-signal)]">deixa uma marca.</em>
            </h1>

            <p className="font-body mt-4 text-sm text-[var(--text-muted)]">
            Casos de teste, automação e revisões de workspace em um só lugar.
            </p>

            <div className="mt-10 border-l border-[var(--rule)] pl-5">
            <ul className="space-y-2.5">
                {LEDGER.map((row) => (
                <li key={row.id} className="font-mono flex items-baseline justify-between gap-4 text-xs">
                    <span className="text-[var(--text-muted)]">
                    <span className="text-[var(--text-primary)]">{row.id}</span> {row.label}
                    </span>

                    {row.status === "CORRIGIDO" ? (
                    <span className="whitespace-nowrap">
                        <span className="relative inline-block text-[var(--text-muted)]">
                        404
                        <span className="redline-strike absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-[var(--red-signal)]" />
                        </span>{" "}
                        <span className="ledger-correction text-[var(--red-signal)]">→ 200</span>
                    </span>
                    ) : (
                    <span
                        className={
                        row.status === "PENDENTE"
                            ? "text-[var(--text-muted)]/60"
                            : "text-[var(--text-muted)]"
                        }
                    >
                        {row.status}
                    </span>
                    )}
                </li>
                ))}
            </ul>
            </div>
        </div>
        </div>
    );
}