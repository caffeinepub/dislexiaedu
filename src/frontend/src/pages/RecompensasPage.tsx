import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Coins,
  Crown,
  FileText,
  Flame,
  Layers,
  List,
  Loader2,
  Medal,
  PenLine,
  Star,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type {
  Conquista,
  Desafio,
  EntradaRanking,
  ProgressoDesafio,
  Recompensa,
} from "../backend.d.ts";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetConquistas,
  useGetDesafiosAtivos,
  useGetRanking,
  useGetRecompensas,
  useGetSaldoAluno,
  useGetTodosProgressosDesafio,
  useResgatarSaldo,
} from "../hooks/useQueries";

// ─── Token display ─────────────────────────────────────────────────────────

function TokenIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, oklch(0.85 0.12 80), oklch(0.70 0.17 65))",
        boxShadow: "0 2px 6px oklch(0.78 0.15 75 / 0.35)",
        fontSize: size * 0.55,
        flexShrink: 0,
      }}
    >
      ✦
    </span>
  );
}

// ─── Challenge icons ────────────────────────────────────────────────────────

function DesafioIcon({ tipo }: { tipo: string }) {
  if (tipo === "leitura") return <BookOpen className="h-5 w-5" />;
  if (tipo === "anotacao") return <PenLine className="h-5 w-5" />;
  if (tipo === "sequencia") return <List className="h-5 w-5" />;
  return <Flame className="h-5 w-5" />;
}

// ─── All defined achievements (6 static) ──────────────────────────────────

const CONQUISTAS_DEF = [
  {
    marco: "primeira_leitura",
    nome: "Primeira Leitura",
    descricao: "Complete 100% de um texto",
    emoji: "📖",
    cor: "from-blue-400 to-blue-600",
  },
  {
    marco: "leitor_dedicado",
    nome: "Leitor Dedicado",
    descricao: "Leia 5 textos diferentes",
    emoji: "🎓",
    cor: "from-purple-400 to-purple-600",
  },
  {
    marco: "anotador",
    nome: "Anotador",
    descricao: "Crie 10 anotações",
    emoji: "✏️",
    cor: "from-amber-400 to-amber-600",
  },
  {
    marco: "desafiante",
    nome: "Desafiante",
    descricao: "Complete seu primeiro desafio",
    emoji: "⚡",
    cor: "from-yellow-400 to-orange-500",
  },
  {
    marco: "mestre_notas",
    nome: "Mestre das Notas",
    descricao: "Crie 25 anotações",
    emoji: "🏆",
    cor: "from-gold-dark to-gold",
  },
  {
    marco: "explorador",
    nome: "Explorador",
    descricao: "Leia 10 textos diferentes",
    emoji: "🌟",
    cor: "from-teal-dark to-teal",
  },
];

// ─── Date formatter ─────────────────────────────────────────────────────────

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function RecompensasPage() {
  const [activeTab, setActiveTab] = useState("saldo");

  return (
    <div
      className="min-h-screen pb-24 md:pb-8 animate-fade-slide-up"
      data-ocid="recompensas.page"
    >
      {/* Header */}
      <div className="px-6 md:px-8 pt-8 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.85 0.12 80), oklch(0.70 0.17 65))",
              boxShadow: "0 4px 16px oklch(0.78 0.15 75 / 0.35)",
            }}
          >
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              Recompensas
            </h1>
            <p className="text-muted-foreground text-sm">
              Ganhe tokens completando desafios de leitura
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 md:px-8 py-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-12 bg-muted/70 p-1 rounded-xl mb-6">
            <TabsTrigger
              value="saldo"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-soft"
              data-ocid="recompensas.saldo_tab"
            >
              <Wallet className="h-4 w-4 mr-1.5" />
              Saldo
            </TabsTrigger>
            <TabsTrigger
              value="desafios"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-soft"
              data-ocid="recompensas.desafios_tab"
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Desafios
            </TabsTrigger>
            <TabsTrigger
              value="conquistas"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-soft"
              data-ocid="recompensas.conquistas_tab"
            >
              <Trophy className="h-4 w-4 mr-1.5" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger
              value="ranking"
              className="rounded-lg text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-soft"
              data-ocid="recompensas.ranking_tab"
            >
              <Crown className="h-4 w-4 mr-1.5" />
              Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saldo">
            <SaldoTab />
          </TabsContent>
          <TabsContent value="desafios">
            <DesafiosTab />
          </TabsContent>
          <TabsContent value="conquistas">
            <ConquistasTab />
          </TabsContent>
          <TabsContent value="ranking">
            <RankingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Saldo Tab ───────────────────────────────────────────────────────────────

function SaldoTab() {
  const { data: saldo, isLoading: loadingSaldo } = useGetSaldoAluno();
  const { data: recompensas, isLoading: loadingRecomp } = useGetRecompensas();
  const { mutateAsync: resgatar, isPending: isResgatando } = useResgatarSaldo();
  const [resgatado, setResgatado] = useState(false);

  const saldoNum = Number(saldo ?? BigInt(0));
  const reaisEquivalente = (saldoNum / 10).toFixed(2);

  async function handleResgatar() {
    try {
      const valorResgatado = await resgatar();
      setResgatado(true);
      toast.success(
        `🎉 R$ ${(Number(valorResgatado) / 10).toFixed(2)} creditado com sucesso!`,
        { duration: 5000 },
      );
      setTimeout(() => setResgatado(false), 4000);
    } catch {
      toast.error("Erro ao resgatar saldo.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Main saldo card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.18 0.04 220) 0%, oklch(0.28 0.08 195) 100%)",
          }}
        >
          {/* Background decoration */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.15 75) 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.15 75) 0%, transparent 70%)",
              transform: "translate(-30%, 30%)",
            }}
          />

          <div className="relative z-10">
            <p className="text-white/60 text-sm font-medium mb-3 flex items-center gap-2">
              <TokenIcon size={16} />
              Saldo em tokens
            </p>

            {loadingSaldo ? (
              <div className="h-16 w-40 bg-white/10 rounded-xl animate-pulse" />
            ) : (
              <AnimatePresence>
                <motion.div
                  key={saldoNum}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-end gap-3 mb-2"
                >
                  <span
                    className="font-display font-black text-white"
                    style={{
                      fontSize: "clamp(3rem, 8vw, 4.5rem)",
                      lineHeight: 1,
                    }}
                  >
                    {saldoNum.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-white/60 text-lg mb-2 font-medium">
                    tokens
                  </span>
                </motion.div>
              </AnimatePresence>
            )}

            <p className="text-white/50 text-sm mb-6">
              Equivale a{" "}
              <span className="text-white font-semibold">
                R$ {reaisEquivalente}
              </span>{" "}
              (100 tokens = R$ 10,00)
            </p>

            {resgatado ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-white/15 rounded-xl px-5 py-3 w-fit"
              >
                <CheckCircle2 className="h-5 w-5 text-green-300" />
                <span className="text-white font-semibold">
                  Resgate realizado!
                </span>
              </motion.div>
            ) : (
              <Button
                size="lg"
                onClick={handleResgatar}
                disabled={isResgatando || saldoNum === 0}
                className="font-semibold px-8 h-12 rounded-xl"
                style={{
                  background:
                    saldoNum > 0
                      ? "linear-gradient(135deg, oklch(0.82 0.14 78), oklch(0.68 0.17 62))"
                      : undefined,
                  color: saldoNum > 0 ? "white" : undefined,
                  boxShadow:
                    saldoNum > 0
                      ? "0 4px 20px oklch(0.78 0.15 75 / 0.4)"
                      : undefined,
                }}
                data-ocid="recompensas.resgatar_button"
              >
                {isResgatando ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resgatando...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    {saldoNum > 0
                      ? "Resgatar Saldo"
                      : "Sem saldo para resgatar"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Conversion info */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { tokens: 50, reais: "5,00", label: "Starter" },
          { tokens: 100, reais: "10,00", label: "Popular" },
          { tokens: 500, reais: "50,00", label: "Premium" },
        ].map((tier, i) => (
          <motion.div
            key={tier.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          >
            <Card className="border-border/50 hover:border-gold/40 transition-colors">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TokenIcon size={16} />
                  <span className="font-display font-bold text-lg text-gold-dark">
                    {tier.tokens}
                  </span>
                </div>
                <p className="text-foreground font-semibold text-sm">
                  R$ {tier.reais}
                </p>
                <p className="text-muted-foreground text-xs">{tier.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* History */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Histórico de Recompensas
        </h2>

        {loadingRecomp ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted/60 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : !recompensas || recompensas.length === 0 ? (
          <div
            className="text-center py-10 rounded-2xl bg-muted/40 border border-border/40"
            data-ocid="recompensas.history.empty_state"
          >
            <Coins className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm font-medium">
              Nenhuma recompensa ainda
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Complete desafios para ganhar seus primeiros tokens
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(recompensas as Recompensa[])
              .sort((a, b) => Number(b.data - a.data))
              .map((r, i) => (
                <motion.div
                  key={r.id.toString()}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/40 hover:border-gold/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.92 0.08 85), oklch(0.82 0.12 75))",
                          }}
                        >
                          <TokenIcon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {r.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(r.data)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        <span className="font-display font-bold text-gold-dark text-lg">
                          +{Number(r.valor)}
                        </span>
                        <TokenIcon size={16} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Desafios Tab ─────────────────────────────────────────────────────────────

function DesafiosTab() {
  const { data: desafios, isLoading } = useGetDesafiosAtivos();
  const { data: progressos } = useGetTodosProgressosDesafio();

  const progressoMap = new Map<string, ProgressoDesafio>(
    (progressos ?? []).map((p) => [p.desafioId.toString(), p]),
  );

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 bg-muted/60 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : !desafios || desafios.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl bg-muted/40 border border-border/40"
          data-ocid="recompensas.desafios.empty_state"
        >
          <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">
            Nenhum desafio ativo
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Volte em breve para novos desafios
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
          className="space-y-4"
        >
          {(desafios as Desafio[]).map((desafio, idx) => {
            const prog = progressoMap.get(desafio.id.toString());
            const progAtual = Number(prog?.progressoAtual ?? BigInt(0));
            const meta = Number(desafio.metaValor);
            const pct =
              meta > 0
                ? Math.min(100, Math.round((progAtual / meta) * 100))
                : 0;
            const concluido = prog?.concluido ?? false;

            return (
              <DesafioCard
                key={desafio.id.toString()}
                desafio={desafio}
                index={idx + 1}
                progresso={pct}
                progAtual={progAtual}
                concluido={concluido}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

function DesafioCard({
  desafio,
  index,
  progresso,
  progAtual,
  concluido,
}: {
  desafio: Desafio;
  index: number;
  progresso: number;
  progAtual: number;
  concluido: boolean;
}) {
  const tipoLabel: Record<string, string> = {
    leitura: "Leitura",
    anotacao: "Anotação",
    sequencia: "Sequência",
  };

  const tipoColor: Record<string, string> = {
    leitura: "from-blue-500 to-blue-700",
    anotacao: "from-amber-500 to-amber-700",
    sequencia: "from-teal-500 to-teal-700",
  };

  const meta = Number(desafio.metaValor);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      }}
      data-ocid={`recompensas.desafio_item.${index}`}
    >
      <Card
        className={cn(
          "border-border/50 hover:shadow-card transition-all duration-200 overflow-hidden",
          concluido && "border-green-400/40 bg-green-50/30",
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0",
                concluido
                  ? "bg-gradient-to-br from-green-400 to-green-600"
                  : `bg-gradient-to-br ${tipoColor[desafio.tipo] ?? "from-gray-400 to-gray-600"}`,
              )}
            >
              {concluido ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <DesafioIcon tipo={desafio.tipo} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="font-semibold text-foreground text-base leading-snug">
                    {desafio.titulo}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {desafio.descricao}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {concluido ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300/50 font-semibold text-xs">
                      ✓ Concluído
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {tipoLabel[desafio.tipo] ?? desafio.tipo}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-display font-bold text-gold-dark text-lg">
                      +{Number(desafio.recompensaTokens)}
                    </span>
                    <TokenIcon size={16} />
                  </div>
                </div>
              </div>

              {/* Progress */}
              {!concluido && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progresso</span>
                    <span className="font-medium">
                      {progAtual} / {meta}
                    </span>
                  </div>
                  <Progress value={progresso} className="h-2.5 rounded-full" />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {progresso}%
                  </p>
                </div>
              )}

              {concluido && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  🎉 Desafio concluído com sucesso!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Conquistas Tab ───────────────────────────────────────────────────────────

function ConquistasTab() {
  const { data: conquistasDesbloqueadas, isLoading } = useGetConquistas();

  const desbloqueadasMap = new Map<string, Conquista>(
    (conquistasDesbloqueadas ?? []).map((c) => [c.marco, c]),
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {desbloqueadasMap.size} de {CONQUISTAS_DEF.length} conquistas
        desbloqueadas
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 bg-muted/60 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-2 gap-4"
        >
          {CONQUISTAS_DEF.map((def, idx) => {
            const conquistada = desbloqueadasMap.get(def.marco);
            return (
              <ConquistaCard
                key={def.marco}
                def={def}
                conquistada={conquistada}
                index={idx + 1}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

function ConquistaCard({
  def,
  conquistada,
  index,
}: {
  def: (typeof CONQUISTAS_DEF)[number];
  conquistada?: Conquista;
  index: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.92 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
      }}
      data-ocid={`recompensas.conquista_item.${index}`}
    >
      <Card
        className={cn(
          "border-border/50 overflow-hidden transition-all duration-200 text-center",
          conquistada
            ? "hover:shadow-card hover:-translate-y-0.5 border-gold/30"
            : "conquista-locked",
        )}
      >
        <CardContent className="p-5">
          <div
            className={cn(
              "h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl",
              conquistada
                ? `bg-gradient-to-br ${def.cor} shadow-gold`
                : "bg-muted",
            )}
          >
            {def.emoji}
          </div>
          <h3 className="font-display font-bold text-sm text-foreground leading-snug mb-1">
            {def.nome}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {def.descricao}
          </p>
          {conquistada && (
            <Badge className="mt-2 bg-gold-light/80 text-gold-dark border-gold/30 text-xs font-semibold">
              <Star className="h-3 w-3 mr-1" />
              Desbloqueada
            </Badge>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Ranking Tab ─────────────────────────────────────────────────────────────

function RankingTab() {
  const { data: ranking, isLoading } = useGetRanking();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";

  const medalColors = [
    "from-yellow-400 to-amber-500", // ouro
    "from-gray-300 to-gray-400", // prata
    "from-amber-600 to-amber-700", // bronze
  ];
  const medalEmojis = ["🥇", "🥈", "🥉"];

  const topRanking = (ranking ?? []).slice(0, 10);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Medal className="h-5 w-5 text-gold-dark" />
        Top 10 Estudantes
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-muted/60 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : topRanking.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl bg-muted/40 border border-border/40"
          data-ocid="recompensas.ranking.empty_state"
        >
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">
            Ranking ainda vazio
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Seja o primeiro a aparecer aqui!
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-3"
        >
          {topRanking.map((entrada: EntradaRanking, idx) => {
            const isMe = principal && entrada.nome === principal.slice(0, 8);
            const isMedal = idx < 3;

            return (
              <motion.div
                key={`${entrada.nome}-${idx}`}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                }}
              >
                <Card
                  className={cn(
                    "border-border/50 hover:shadow-card transition-all duration-200",
                    isMe && "border-primary/40 bg-primary/5",
                    isMedal && "border-gold/30",
                  )}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Rank */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-lg",
                        isMedal
                          ? `bg-gradient-to-br ${medalColors[idx]} text-white shadow-soft`
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isMedal ? medalEmojis[idx] : idx + 1}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-base truncate flex items-center gap-2">
                        {entrada.nome}
                        {isMe && (
                          <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                            Você
                          </Badge>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Posição #{idx + 1}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          "font-display font-black text-xl",
                          isMedal ? "text-gold-dark" : "text-foreground",
                        )}
                      >
                        {Number(entrada.tokens).toLocaleString("pt-BR")}
                      </span>
                      <TokenIcon size={18} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {topRanking.length >= 10 && (
            <div className="flex items-center justify-center gap-1 pt-2 text-muted-foreground text-sm">
              <ChevronRight className="h-4 w-4" />
              <span>Exibindo top 10</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Re-export for use in queries
export { TokenIcon };
