import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlignJustify,
  CheckCircle2,
  Eye,
  LayoutTemplate,
  Loader2,
  Palette,
  Settings,
  Type,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetConfiguracaoLeitura,
  useSalvarConfiguracaoLeitura,
} from "../hooks/useQueries";

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
}

const DEFAULT_CONFIG: ReadingConfig = {
  fontSize: 20,
  letterSpacing: "wide",
  lineSpacing: "relaxed",
  bgColor: "#FFF8E7",
  columnWidth: "medium",
  focusMode: false,
};

const BG_COLORS = [
  { hex: "#FFFFFF", label: "Branco" },
  { hex: "#FFF8E7", label: "Creme" },
  { hex: "#E8F4FD", label: "Azul claro" },
  { hex: "#FFFDE7", label: "Amarelo claro" },
  { hex: "#E8F5E9", label: "Verde claro" },
];

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

export default function ConfiguracoesPage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";

  const { data: configSaved, isLoading } = useGetConfiguracaoLeitura();
  const { mutateAsync: salvarConfig, isPending: isSaving } =
    useSalvarConfiguracaoLeitura();

  const [config, setConfig] = useState<ReadingConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (configSaved) {
      const colMap: Record<string, ColumnWidth> = {
        "520": "narrow",
        "680": "medium",
        "820": "wide",
        "1200": "full",
      };
      setConfig({
        fontSize: (Number(configSaved.tamanhoFonte) as FontSize) || 20,
        letterSpacing:
          (configSaved.espacamentoLetras as LetterSpacing) || "wide",
        lineSpacing:
          (configSaved.espacamentoLinhas as LineSpacing) || "relaxed",
        bgColor: configSaved.corFundo || "#FFF8E7",
        columnWidth: colMap[configSaved.larguraColuna.toString()] || "medium",
        focusMode: configSaved.modoFoco,
      });
    }
  }, [configSaved]);

  function updateConfig<K extends keyof ReadingConfig>(
    key: K,
    value: ReadingConfig[K],
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (!principal) {
      toast.error("Você precisa estar logado.");
      return;
    }
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
      setSaved(true);
      toast.success("Configurações salvas com sucesso!");
    } catch {
      toast.error("Erro ao salvar configurações.");
    }
  }

  // Preview text style
  const previewStyle = {
    fontSize: `${config.fontSize}px`,
    letterSpacing: letterSpacingMap[config.letterSpacing],
    lineHeight: lineSpacingMap[config.lineSpacing],
    backgroundColor: config.bgColor,
    fontFamily: "'Figtree', 'Segoe UI', system-ui, sans-serif",
  };

  return (
    <div
      className="min-h-screen pb-20 md:pb-8 animate-fade-slide-up"
      data-ocid="settings.page"
    >
      {/* Header */}
      <div className="px-6 md:px-8 pt-8 pb-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sage-light flex items-center justify-center">
            <Settings className="h-5 w-5 text-sage-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
              Configurações
            </h1>
            <p className="text-muted-foreground text-sm">
              Personalize sua experiência de leitura padrão
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings form */}
          <div className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Carregando configurações...
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Font size */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Type className="h-4 w-4 text-primary" />
                      Tamanho da Fonte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      {([16, 20, 24, 28, 32] as FontSize[]).map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => updateConfig("fontSize", s)}
                          className={cn(
                            "flex-1 h-10 rounded-lg text-sm font-medium transition-all",
                            config.fontSize === s
                              ? "bg-primary text-primary-foreground shadow-soft"
                              : "bg-muted hover:bg-muted/80 text-foreground",
                          )}
                          data-ocid="settings.font_size_select"
                        >
                          {s}px
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Letter spacing */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <AlignJustify className="h-4 w-4 text-primary" />
                      Espaçamento entre Letras
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2">
                      {(["normal", "wide", "wider"] as LetterSpacing[]).map(
                        (s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => updateConfig("letterSpacing", s)}
                            className={cn(
                              "h-10 rounded-lg text-sm font-medium transition-all",
                              config.letterSpacing === s
                                ? "bg-primary text-primary-foreground shadow-soft"
                                : "bg-muted hover:bg-muted/80 text-foreground",
                            )}
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
                  </CardContent>
                </Card>

                {/* Line spacing */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-primary" />
                      Espaçamento entre Linhas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2">
                      {(["normal", "relaxed", "loose"] as LineSpacing[]).map(
                        (s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => updateConfig("lineSpacing", s)}
                            className={cn(
                              "h-10 rounded-lg text-sm font-medium transition-all",
                              config.lineSpacing === s
                                ? "bg-primary text-primary-foreground shadow-soft"
                                : "bg-muted hover:bg-muted/80 text-foreground",
                            )}
                          >
                            {s === "normal"
                              ? "Normal"
                              : s === "relaxed"
                                ? "Relaxado"
                                : "Solto"}
                          </button>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Background color */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      Cor de Fundo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-3 flex-wrap">
                      {BG_COLORS.map((c, i) => (
                        <button
                          type="button"
                          key={c.hex}
                          onClick={() => updateConfig("bgColor", c.hex)}
                          title={c.label}
                          className={cn(
                            "group relative h-12 w-12 rounded-xl border-2 transition-all flex items-center justify-center",
                            config.bgColor === c.hex
                              ? "border-primary scale-110 shadow-soft"
                              : "border-border/60 hover:border-primary/50 hover:scale-105",
                          )}
                          style={{ backgroundColor: c.hex }}
                          data-ocid={`settings.bg_color_button.${i + 1}`}
                        >
                          {config.bgColor === c.hex && (
                            <div className="h-3 w-3 rounded-full bg-primary/60" />
                          )}
                          <span className="sr-only">{c.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-3 flex-wrap">
                      {BG_COLORS.map((c) => (
                        <span
                          key={c.hex}
                          className="text-xs text-muted-foreground w-12 text-center"
                        >
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Column width */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-primary" />
                      Largura da Coluna
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        ["narrow", "medium", "wide", "full"] as ColumnWidth[]
                      ).map((w) => (
                        <button
                          type="button"
                          key={w}
                          onClick={() => updateConfig("columnWidth", w)}
                          className={cn(
                            "h-10 rounded-lg text-sm font-medium transition-all",
                            config.columnWidth === w
                              ? "bg-primary text-primary-foreground shadow-soft"
                              : "bg-muted hover:bg-muted/80 text-foreground",
                          )}
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
                  </CardContent>
                </Card>

                {/* Focus mode */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Eye className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">
                            Modo Foco
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Destaca o parágrafo ao passar o mouse
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={config.focusMode}
                        onCheckedChange={(v) => updateConfig("focusMode", v)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Save button */}
                <div className="flex items-center gap-3">
                  <Button
                    className="flex-1"
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving}
                    data-ocid="configuracoes.salvar_button"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Configurações"
                    )}
                  </Button>
                </div>

                {saved && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3"
                    data-ocid="settings.success_state"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Configurações salvas e aplicadas em todas as leituras.
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Preview panel */}
          <div className="lg:sticky lg:top-6 self-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Pré-visualização
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className="rounded-xl p-5 transition-all duration-300"
                  style={previewStyle}
                >
                  <p className="font-semibold text-foreground mb-3">
                    Técnicas de Leitura para Estudantes
                  </p>
                  <p className="text-foreground">
                    A leitura ativa é uma estratégia fundamental para estudantes
                    no ensino superior. Ao ajustar o espaçamento e o tamanho da
                    fonte, é possível tornar o texto muito mais acessível e
                    confortável para a leitura prolongada.
                  </p>
                  <p className="text-foreground mt-4">
                    Experimente diferentes configurações de cor de fundo para
                    encontrar a que melhor reduz o desconforto visual durante o
                    estudo.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Esta pré-visualização reflete suas configurações atuais
                </p>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="mt-4 bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Dicas para dislexia
                </p>
                <ul className="text-xs text-foreground/70 space-y-1.5">
                  <li>• Tamanho 20–24px é o mais confortável para leitura</li>
                  <li>
                    • Espaçamento "Largo" entre letras facilita a decodificação
                  </li>
                  <li>• Fundo creme ou amarelo reduz o brilho excessivo</li>
                  <li>
                    • Espaçamento "Relaxado" entre linhas evita confusão entre
                    linhas
                  </li>
                  <li>• Coluna estreita reduz o movimento ocular</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
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
