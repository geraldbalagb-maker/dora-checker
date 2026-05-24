export type ClauseStatus = "presente" | "mancante" | "incompleta";

export interface DoraClause {
  nome: string;
  riferimento_normativo: string;
  status: ClauseStatus;
  estratto?: string;
  note: string;
}

export interface DoraReport {
  punteggio_conformita: number;
  sommario: string;
  clausole: DoraClause[];
  raccomandazioni: string[];
  pagine_analizzate: number;
  caratteri_analizzati: number;
}

export const STATUS_CFG: Record<ClauseStatus, { label: string; color: string; border: string; bg: string }> = {
  presente:   { label: "Presente",   color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5"  },
  mancante:   { label: "Mancante",   color: "text-red-400",     border: "border-red-500/30",     bg: "bg-red-500/5"      },
  incompleta: { label: "Incompleta", color: "text-amber-400",   border: "border-amber-500/30",   bg: "bg-amber-500/5"    },
};
