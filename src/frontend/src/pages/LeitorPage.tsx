import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  AlignJustify,
  BookOpen,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  LayoutTemplate,
  Loader2,
  Minus,
  Palette,
  Plus,
  Ruler,
  Settings2,
  StickyNote,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCriarAnotacao,
  useDeletarAnotacao,
  useGetAnotacoesTexto,
  useGetConfiguracaoLeitura,
  useGetProgresso,
  useGetTexto,
  useSalvarConfiguracaoLeitura,
  useSalvarProgresso,
} from "../hooks/useQueries";

// ─── Types ───────────────────────────────────────────────────────────────────

type FontSize = 16 | 20 | 24 | 28 | 32;
type LetterSpacing = "normal" | "wide" | "wider";
type LineSpacing = "normal" | "relaxed" | "loose";
type ColumnWidth = "narrow" | "medium" | "wide" | "full";

interface ReadingConfig {
  fontSize: FontSize;
  letterSpacing: LetterSpacing;
  lineSpacing: LineSpacing;
  bgColor: string;
  columnWidth: ColumnWidth;
  focusMode: boolean;
  rulerMode: boolean;
}

const DEFAULT_CONFIG: ReadingConfig = {
  fontSize: 20,
  letterSpacing: "wide",
  lineSpacing: "relaxed",
  bgColor: "#FFF8E7",
  columnWidth: "medium",
  focusMode: false,
  rulerMode: false,
};

const BG_COLORS = [
  { hex: "#FFFFFF", label: "Branco" },
  { hex: "#FFF8E7", label: "Creme" },
  { hex: "#E8F4FD", label: "Azul" },
  { hex: "#FFFDE7", label: "Amarelo" },
  { hex: "#E8F5E9", label: "Verde" },
];

const ANNOTATION_COLORS = [
  { value: "yellow", hex: "#FFF9C4", label: "Amarelo" },
  { value: "pink", hex: "#FCE4EC", label: "Rosa" },
  { value: "green", hex: "#E8F5E9", label: "Verde" },
  { value: "blue", hex: "#E3F2FD", label: "Azul" },
  { value: "orange", hex: "#FFF3E0", label: "Laranja" },
];

const ANNOTATION_BORDER_COLORS: Record<string, string> = {
  yellow: "#F9A825",
  pink: "#E91E63",
  green: "#4CAF50",
  blue: "#2196F3",
  orange: "#FF9800",
};

const letterSpacingMap: Record<LetterSpacing, string> = {
  normal: "0em",
  wide: "0.05em",
  wider: "0.1em",
};

const lineSpacingMap: Record<LineSpacing, string> = {
  normal: "1.6",
  relaxed: "1.9",
  loose: "2.2",
};

const columnWidthMap: Record<ColumnWidth, string> = {
  narrow: "520px",
  medium: "680px",
  wide: "820px",
  full: "100%",
};

function configFromBackend(raw: {
  tamanhoFonte: bigint;
  espacamentoLetras: string;
  espacamentoLinhas: string;
  corFundo: string;
  larguraColuna: bigint;
  modoFoco: boolean;
}): ReadingConfig {
  return {
    fontSize: (Number(raw.tamanhoFonte) as FontSize) || 20,
    letterSpacing: (raw.espacamentoLetras as LetterSpacing) || "wide",
    lineSpacing: (raw.espacamentoLinhas as LineSpacing) || "relaxed",
    bgColor: raw.corFundo || "#FFF8E7",
    columnWidth: (String(raw.larguraColuna) === "0"
      ? "medium"
      : raw.larguraColuna === BigInt(520)
        ? "narrow"
        : raw.larguraColuna === BigInt(680)
          ? "medium"
          : raw.larguraColuna === BigInt(820)
            ? "wide"
            : "full") as ColumnWidth,
    focusMode: raw.modoFoco,
    rulerMode: false,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeitorPage() {
  const { id } = useParams({ from: "/leitor/$id" });
  const textoId = BigInt(id);

  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";

  const { data: texto, isLoading, isError } = useGetTexto(textoId);
  const { data: anotacoes } = useGetAnotacoesTexto(textoId);
  const { data: progresso } = useGetProgresso(textoId);
  const { data: configSaved } = useGetConfiguracaoLeitura();
  const { mutateAsync: criarAnotacao, isPending: isCriandoAnotacao } =
    useCriarAnotacao();
  const { mutateAsync: deletarAnotacao } = useDeletarAnotacao();
  const { mutateAsync: salvarConfig } = useSalvarConfiguracaoLeitura();
  const { mutateAsync: salvarProgresso } = useSalvarProgresso();

  const [config, setConfig] = useState<ReadingConfig>(DEFAULT_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [rulerY, setRulerY] = useState(200);
  const [newNote, setNewNote] = useState({ conteudo: "", cor: "yellow" });
  const readerRef = useRef<HTMLDivElement>(null);
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved config when it arrives
  useEffect(() => {
    if (configSaved && !configLoaded) {
      setConfig(configFromBackend(configSaved));
      setConfigLoaded(true);
    }
  }, [configSaved, configLoaded]);

  // Load saved progress
  // biome-ignore lint/correctness/useExhaustiveDependencies: isLoading is used to trigger re-run after text loads
  useEffect(() => {
    if (progresso && readerRef.current) {
      const pct = Number(progresso.percentualLido);
      const el = readerRef.current;
      const scrollTo = ((el.scrollHeight - el.clientHeight) * pct) / 100;
      el.scrollTop = scrollTo;
    }
  }, [progresso, isLoading]);

  // Track scroll for progress
  const handleScroll = useCallback(() => {
    const el = readerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    const pct = Math.round((el.scrollTop / maxScroll) * 100);

    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
    progressSaveTimer.current = setTimeout(() => {
      salvarProgresso({
        textoId,
        percentualLido: BigInt(pct),
      }).catch(() => {});
    }, 1500);
  }, [textoId, salvarProgresso]);

  // Ruler follows mouse
  useEffect(() => {
    if (!config.rulerMode) return;
    const handleMouseMove = (e: MouseEvent) => {
      setRulerY(e.clientY - 20);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [config.rulerMode]);

  async function handleAddNote() {
    if (!newNote.conteudo.trim()) {
      toast.error("Escreva algo na anotação.");
      return;
    }
    try {
      await criarAnotacao({
        textoId,
        conteudo: newNote.conteudo,
        cor: newNote.cor,
      });
      setNewNote({ conteudo: "", cor: "yellow" });
      toast.success("Anotação adicionada!");
    } catch {
      toast.error("Erro ao salvar anotação.");
    }
  }

  async function handleDeleteNote(id: bigint) {
    try {
      await deletarAnotacao({ id, textoId });
      toast.success("Anotação removida.");
    } catch {
      toast.error("Erro ao remover anotação.");
    }
  }

  async function handleSaveConfig() {
    if (!principal) return;
    const colMap: Record<ColumnWidth, bigint> = {
      narrow: BigInt(520),
      medium: BigInt(680),
      wide: BigInt(820),
      full: BigInt(1200),
    };
    try {
      await salvarConfig({
        usuarioId: principal,
        tamanhoFonte: BigInt(config.fontSize),
        espacamentoLetras: config.letterSpacing,
        espacamentoLinhas: config.lineSpacing,
        corFundo: config.bgColor,
        larguraColuna: colMap[config.columnWidth],
        modoFoco: config.focusMode,
      });
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    }
  }

  function updateConfig<K extends keyof ReadingConfig>(
    key: K,
    value: ReadingConfig[K],
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen p-8 space-y-4"
        data-ocid="reader.loading_state"
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !texto) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-8"
        data-ocid="reader.error_state"
      >
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-destructive/50 mx-auto" />
          <p className="text-lg font-semibold">Texto não encontrado</p>
          <p className="text-muted-foreground text-sm">
            Este texto não existe ou foi removido.
          </p>
          <Link to="/biblioteca">
            <Button variant="outline" className="mt-2">
              Voltar à biblioteca
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Split content into paragraphs
  const paragraphs = texto.conteudo
    .split(/\n\n+|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const readerStyle = {
    fontSize: `${config.fontSize}px`,
    letterSpacing: letterSpacingMap[config.letterSpacing],
    lineHeight: lineSpacingMap[config.lineSpacing],
    backgroundColor: config.bgColor,
    maxWidth: columnWidthMap[config.columnWidth],
  };

  return (
    <div className="flex h-screen" data-ocid="reader.page">
      {/* Reading ruler */}
      {config.rulerMode && (
        <div
          className="reading-ruler"
          style={{ top: `${rulerY}px` }}
          aria-hidden="true"
        />
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/biblioteca">
              <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Biblioteca</span>
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <div className="min-w-0">
              <h1 className="font-semibold text-foreground text-sm truncate">
                {texto.titulo}
              </h1>
              <p className="text-muted-foreground text-xs truncate">
                {texto.autor} · {texto.categoria}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Ruler toggle */}
            <Button
              variant={config.rulerMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => updateConfig("rulerMode", !config.rulerMode)}
              className="h-8 px-2"
              title="Régua de leitura"
              data-ocid="reader.ruler_toggle"
            >
              <Ruler className="h-4 w-4" />
            </Button>

            {/* Focus mode toggle */}
            <Button
              variant={config.focusMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => updateConfig("focusMode", !config.focusMode)}
              className="h-8 px-2"
              title="Modo foco"
              data-ocid="leitor.modo_foco_toggle"
            >
              {config.focusMode ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>

            {/* Notes panel */}
            <Button
              variant={notesPanelOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setNotesPanelOpen(!notesPanelOpen);
                setSettingsPanelOpen(false);
              }}
              className="h-8 px-2"
              title="Anotações"
            >
              <StickyNote className="h-4 w-4" />
              {anotacoes && anotacoes.length > 0 && (
                <span className="ml-1 text-xs font-medium">
                  {anotacoes.length}
                </span>
              )}
            </Button>

            {/* Settings panel */}
            <Button
              variant={settingsPanelOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setSettingsPanelOpen(!settingsPanelOpen);
                setNotesPanelOpen(false);
              }}
              className="h-8 px-2"
              title="Configurações de leitura"
              data-ocid="reader.settings_panel"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Text */}
          <div
            className="flex-1 overflow-y-auto"
            ref={readerRef}
            onScroll={handleScroll}
            style={{ backgroundColor: config.bgColor }}
          >
            <div className="py-10 px-6 flex justify-center">
              <article
                className={cn(
                  "reader-content reader-container w-full transition-all",
                  config.focusMode && "focus-mode-active",
                )}
                style={readerStyle}
              >
                <header className="mb-8">
                  <Badge variant="secondary" className="mb-3 text-xs">
                    {texto.categoria}
                  </Badge>
                  <h1
                    className="font-bold text-foreground mb-2 leading-tight"
                    style={{ fontSize: `${config.fontSize + 8}px` }}
                  >
                    {texto.titulo}
                  </h1>
                  <p
                    className="text-muted-foreground"
                    style={{ fontSize: `${config.fontSize - 2}px` }}
                  >
                    {texto.autor}
                  </p>
                  <Separator className="mt-6" />
                </header>

                <div className="space-y-0">
                  {paragraphs.map((para, i) => (
                    <p
                      key={`p-${i}-${para.slice(0, 10)}`}
                      className="reader-paragraph text-foreground"
                      style={{
                        marginBottom: `${config.fontSize * 0.9}px`,
                        fontSize: `${config.fontSize}px`,
                        letterSpacing: letterSpacingMap[config.letterSpacing],
                        lineHeight: lineSpacingMap[config.lineSpacing],
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                <footer className="mt-12 pt-6 border-t border-border/30">
                  <p
                    className="text-muted-foreground text-center"
                    style={{ fontSize: `${config.fontSize - 4}px` }}
                  >
                    Fim do texto
                  </p>
                </footer>
              </article>
            </div>
          </div>

          {/* Settings side panel */}
          <AnimatePresence>
            {settingsPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l border-border/40 bg-card overflow-hidden shrink-0"
                data-ocid="reader.settings_panel"
              >
                <ScrollArea className="h-full">
                  <div className="p-4 w-[280px]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-sm flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-primary" />
                        Configurações
                      </h2>
                      <button
                        type="button"
                        onClick={() => setSettingsPanelOpen(false)}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Font size */}
                      <div>
                        <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                          <Type className="h-3.5 w-3.5" />
                          Tamanho da fonte
                        </Label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateConfig(
                                "fontSize",
                                Math.max(16, config.fontSize - 4) as FontSize,
                              )
                            }
                            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            data-ocid="leitor.fonte_input"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <div className="flex-1 flex gap-1">
                            {([16, 20, 24, 28, 32] as FontSize[]).map((s) => (
                              <button
                                type="button"
                                key={s}
                                onClick={() => updateConfig("fontSize", s)}
                                className={cn(
                                  "flex-1 h-8 rounded-md text-xs font-medium transition-colors",
                                  config.fontSize === s
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80",
                                )}
                                data-ocid="leitor.fonte_input"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              updateConfig(
                                "fontSize",
                                Math.min(32, config.fontSize + 4) as FontSize,
                              )
                            }
                            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Letter spacing */}
                      <div>
                        <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                          <AlignJustify className="h-3.5 w-3.5" />
                          Espaçamento entre letras
                        </Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["normal", "wide", "wider"] as LetterSpacing[]).map(
                            (s) => (
                              <button
                                type="button"
                                key={s}
                                onClick={() => updateConfig("letterSpacing", s)}
                                className={cn(
                                  "h-8 rounded-md text-xs font-medium transition-colors",
                                  config.letterSpacing === s
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80",
                                )}
                                data-ocid="leitor.fonte_input"
                              >
                                {s === "normal"
                                  ? "Normal"
                                  : s === "wide"
                                    ? "Largo"
                                    : "Mais largo"}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Line spacing */}
                      <div>
                        <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                          <LayoutTemplate className="h-3.5 w-3.5" />
                          Espaçamento entre linhas
                        </Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(
                            ["normal", "relaxed", "loose"] as LineSpacing[]
                          ).map((s) => (
                            <button
                              type="button"
                              key={s}
                              onClick={() => updateConfig("lineSpacing", s)}
                              className={cn(
                                "h-8 rounded-md text-xs font-medium transition-colors",
                                config.lineSpacing === s
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80",
                              )}
                              data-ocid="leitor.fonte_input"
                            >
                              {s === "normal"
                                ? "Normal"
                                : s === "relaxed"
                                  ? "Relaxado"
                                  : "Solto"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Background color */}
                      <div>
                        <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                          <Palette className="h-3.5 w-3.5" />
                          Cor de fundo
                        </Label>
                        <div className="flex gap-2 flex-wrap">
                          {BG_COLORS.map((c, _i) => (
                            <button
                              type="button"
                              key={c.hex}
                              onClick={() => updateConfig("bgColor", c.hex)}
                              title={c.label}
                              className={cn(
                                "h-9 w-9 rounded-lg border-2 transition-all flex items-center justify-center",
                                config.bgColor === c.hex
                                  ? "border-primary scale-110"
                                  : "border-border/60 hover:border-primary/50",
                              )}
                              style={{ backgroundColor: c.hex }}
                              data-ocid="leitor.cor_select"
                            >
                              {config.bgColor === c.hex && (
                                <Check className="h-3.5 w-3.5 text-foreground/70" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Column width */}
                      <div>
                        <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                          <LayoutTemplate className="h-3.5 w-3.5" />
                          Largura da coluna
                        </Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(
                            [
                              "narrow",
                              "medium",
                              "wide",
                              "full",
                            ] as ColumnWidth[]
                          ).map((w) => (
                            <button
                              type="button"
                              key={w}
                              onClick={() => updateConfig("columnWidth", w)}
                              className={cn(
                                "h-8 rounded-md text-xs font-medium transition-colors",
                                config.columnWidth === w
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80",
                              )}
                              data-ocid="leitor.fonte_input"
                            >
                              {w === "narrow"
                                ? "Estreita"
                                : w === "medium"
                                  ? "Média"
                                  : w === "wide"
                                    ? "Larga"
                                    : "Completa"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Focus mode */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          Modo foco
                        </Label>
                        <Switch
                          checked={config.focusMode}
                          onCheckedChange={(v) => updateConfig("focusMode", v)}
                          data-ocid="leitor.modo_foco_toggle"
                        />
                      </div>

                      {/* Ruler */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <Ruler className="h-3.5 w-3.5" />
                          Régua de leitura
                        </Label>
                        <Switch
                          checked={config.rulerMode}
                          onCheckedChange={(v) => updateConfig("rulerMode", v)}
                          data-ocid="reader.ruler_toggle"
                        />
                      </div>

                      <Separator />

                      <Button
                        className="w-full"
                        size="sm"
                        onClick={handleSaveConfig}
                        data-ocid="leitor.salvar_progresso_button"
                      >
                        Salvar configurações
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Notes side panel */}
          <AnimatePresence>
            {notesPanelOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l border-border/40 bg-card overflow-hidden shrink-0"
              >
                <div className="flex flex-col h-full w-[300px]">
                  <div className="flex items-center justify-between p-4 border-b border-border/40 shrink-0">
                    <h2 className="font-semibold text-sm flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-amber-600" />
                      Anotações
                      {anotacoes && anotacoes.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {anotacoes.length}
                        </Badge>
                      )}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setNotesPanelOpen(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Add note form */}
                  <div className="p-4 border-b border-border/40 shrink-0">
                    <Textarea
                      placeholder="Nova anotação..."
                      value={newNote.conteudo}
                      onChange={(e) =>
                        setNewNote((n) => ({
                          ...n,
                          conteudo: e.target.value,
                        }))
                      }
                      rows={3}
                      className="resize-none text-sm mb-3"
                      data-ocid="leitor.anotacao_input"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {ANNOTATION_COLORS.map((c) => (
                          <button
                            type="button"
                            key={c.value}
                            onClick={() =>
                              setNewNote((n) => ({ ...n, cor: c.value }))
                            }
                            title={c.label}
                            className={cn(
                              "h-6 w-6 rounded-full border-2 transition-all",
                              newNote.cor === c.value
                                ? "border-foreground scale-110"
                                : "border-transparent hover:border-foreground/30",
                            )}
                            style={{ backgroundColor: c.hex }}
                            data-ocid="leitor.anotacao_cor_select"
                          />
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={isCriandoAnotacao || !newNote.conteudo.trim()}
                        className="h-7 text-xs"
                        data-ocid="leitor.anotacao_add_button"
                      >
                        {isCriandoAnotacao ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Adicionar"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Notes list */}
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-3">
                      {!anotacoes || anotacoes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs">
                            Nenhuma anotação ainda. Adicione a primeira acima.
                          </p>
                        </div>
                      ) : (
                        anotacoes.map((nota, i) => (
                          <div
                            key={nota.id.toString()}
                            className={cn(
                              "p-3 rounded-lg text-sm",
                              `annotation-${nota.cor}`,
                            )}
                            data-ocid={`reader.annotation.item.${i + 1}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-foreground text-xs leading-relaxed flex-1">
                                {nota.conteudo}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(nota.id)}
                                className="shrink-0 text-foreground/40 hover:text-destructive transition-colors p-0.5 rounded mt-0.5"
                                title="Remover anotação"
                                data-ocid={`reader.annotation.delete_button.${i + 1}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div
                              className="w-3 h-0.5 rounded-full mt-2"
                              style={{
                                backgroundColor:
                                  ANNOTATION_BORDER_COLORS[nota.cor] || "#ccc",
                              }}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
