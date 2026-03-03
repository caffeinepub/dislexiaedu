import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import { motion } from "motion/react";
import type { Anotacao, Texto } from "../backend.d.ts";
import { useGetTodasAnotacoes, useGetTodosTextos } from "../hooks/useQueries";

const ANNOTATION_COLORS_BG: Record<string, string> = {
  yellow: "#FFF9C4",
  pink: "#FCE4EC",
  green: "#E8F5E9",
  blue: "#E3F2FD",
  orange: "#FFF3E0",
};

const ANNOTATION_BORDER_COLORS: Record<string, string> = {
  yellow: "#F9A825",
  pink: "#E91E63",
  green: "#4CAF50",
  blue: "#2196F3",
  orange: "#FF9800",
};

const ANNOTATION_COLOR_LABELS: Record<string, string> = {
  yellow: "Amarelo",
  pink: "Rosa",
  green: "Verde",
  blue: "Azul",
  orange: "Laranja",
};

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTextoTitle(textos: Texto[] | undefined, textoId: bigint): string {
  if (!textos) return `Texto #${textoId.toString()}`;
  const t = textos.find((t) => t.id === textoId);
  return t ? t.titulo : `Texto #${textoId.toString()}`;
}

function groupByTexto(anotacoes: Anotacao[]): Record<string, Anotacao[]> {
  const groups: Record<string, Anotacao[]> = {};
  for (const a of anotacoes) {
    const key = a.textoId.toString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

export default function AnotacoesPage() {
  const { data: anotacoes, isLoading, isError } = useGetTodasAnotacoes();
  const { data: textos } = useGetTodosTextos();

  const groups = groupByTexto(anotacoes ?? []);
  const groupEntries = Object.entries(groups);

  return (
    <div
      className="min-h-screen pb-20 md:pb-8 animate-fade-slide-up"
      data-ocid="notes.page"
    >
      {/* Header */}
      <div className="px-6 md:px-8 pt-8 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Minhas Anotações
            </h1>
            <p className="text-muted-foreground text-sm">
              {anotacoes?.length ?? 0} anotaç
              {(anotacoes?.length ?? 0) !== 1 ? "ões" : "ão"} em{" "}
              {groupEntries.length} texto
              {groupEntries.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-6">
        {isError && (
          <div
            className="flex items-center gap-2 text-destructive text-sm mb-4 p-3 rounded-lg bg-destructive/10"
            data-ocid="notes.error_state"
          >
            <AlertCircle className="h-4 w-4" />
            Erro ao carregar anotações.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6" data-ocid="notes.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2].map((j) => (
                    <Skeleton key={j} className="h-24 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : groupEntries.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="notes.empty_state"
          >
            <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-foreground font-semibold mb-1">
              Nenhuma anotação ainda
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Comece lendo um texto e adicione suas primeiras anotações.
            </p>
            <Link
              to="/biblioteca"
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              Ir para a biblioteca
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="space-y-8"
          >
            {groupEntries.map(([textoIdStr, notas], groupIdx) => {
              const textoId = BigInt(textoIdStr);
              const titulo = getTextoTitle(textos, textoId);

              return (
                <motion.div
                  key={textoIdStr}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4 },
                    },
                  }}
                >
                  {/* Group header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h2 className="font-semibold text-foreground text-sm truncate">
                        {titulo}
                      </h2>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {notas.length}
                      </Badge>
                    </div>
                    <Link
                      to="/leitor/$id"
                      params={{ id: textoIdStr }}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 shrink-0 ml-2"
                    >
                      Abrir texto
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  {/* Notes grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {notas.map((nota, noteIdx) => (
                      <motion.div
                        key={nota.id.toString()}
                        data-ocid={`notes.item.${groupIdx * 10 + noteIdx + 1}`}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Card
                          className="overflow-hidden border-0 shadow-soft"
                          style={{
                            backgroundColor:
                              ANNOTATION_COLORS_BG[nota.cor] || "#FFF9C4",
                            borderLeft: `3px solid ${ANNOTATION_BORDER_COLORS[nota.cor] || "#F9A825"}`,
                          }}
                        >
                          <CardContent className="p-4">
                            <p className="text-foreground text-sm leading-relaxed mb-3">
                              {nota.conteudo}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className="text-xs border-0 px-0"
                                style={{
                                  color:
                                    ANNOTATION_BORDER_COLORS[nota.cor] ||
                                    "#F9A825",
                                  backgroundColor: "transparent",
                                }}
                              >
                                {ANNOTATION_COLOR_LABELS[nota.cor] || nota.cor}
                              </Badge>
                              <div className="flex items-center gap-1 text-foreground/40">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {formatDate(nota.dataCriacao)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-border/40 mt-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Construído com ❤️ usando{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
