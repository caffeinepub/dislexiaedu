import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  Library,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { useGetTextosExemplo } from "../hooks/useQueries";

const categoryColors: Record<string, string> = {
  Resumos: "bg-blue-100 text-blue-800",
  Artigos: "bg-purple-100 text-purple-800",
  Anotações: "bg-amber-100 text-amber-800",
  Exercícios: "bg-green-100 text-green-800",
};

function formatDate(nanos: bigint): string {
  const ms = Number(nanos / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function HomePage() {
  const { data: textos, isLoading } = useGetTextosExemplo();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8" data-ocid="home.page">
      {/* Hero banner */}
      <div className="relative overflow-hidden">
        <img
          src="/assets/generated/hero-dislexia.dim_1200x400.jpg"
          alt="DislexiaEdu"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, oklch(0.27 0.04 210 / 0.85) 0%, oklch(0.35 0.08 155 / 0.6) 60%, transparent 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-center px-8 md:px-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-white/70" />
              <span className="text-white/70 text-sm font-medium">
                DislexiaEdu
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Bem-vindo à sua
              <br />
              biblioteca acessível
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-xs">
              Leia, anote e configure tudo para sua melhor experiência.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-8">
        {/* Quick access cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          <motion.div variants={itemVariants}>
            <Link to="/biblioteca">
              <Card
                className="group hover:shadow-card transition-all duration-200 cursor-pointer border-border/60 hover:border-primary/40"
                data-ocid="home.read_button"
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Library className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-0.5">
                      Ler Textos
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Acesse sua biblioteca de textos acadêmicos
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto self-center shrink-0 group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/anotacoes">
              <Card
                className="group hover:shadow-card transition-all duration-200 cursor-pointer border-border/60 hover:border-amber-reader/40"
                data-ocid="home.notes_button"
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                    <FileText className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-0.5">
                      Minhas Anotações
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Revise seus destaques e notas
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto self-center shrink-0 group-hover:text-amber-600 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/configuracoes">
              <Card
                className="group hover:shadow-card transition-all duration-200 cursor-pointer border-border/60 hover:border-sage/40"
                data-ocid="home.settings_button"
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-sage-light flex items-center justify-center shrink-0 group-hover:bg-sage/20 transition-colors">
                    <Settings className="h-5 w-5 text-sage-dark" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-0.5">
                      Configurações
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Personalize sua experiência de leitura
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto self-center shrink-0 group-hover:text-sage-dark transition-colors" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>

        {/* Recent texts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Textos em destaque
              </h2>
            </div>
            <Link
              to="/biblioteca"
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : textos && textos.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {textos.slice(0, 6).map((texto, idx) => (
                <motion.div key={texto.id.toString()} variants={itemVariants}>
                  <Link to="/leitor/$id" params={{ id: texto.id.toString() }}>
                    <Card className="group hover:shadow-card transition-all duration-200 cursor-pointer border-border/60 hover:border-primary/30">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 group-hover:text-primary transition-colors truncate">
                              {texto.titulo}
                            </h3>
                            <p className="text-muted-foreground text-xs">
                              {texto.autor} · {formatDate(texto.dataCriacao)}
                            </p>
                          </div>
                          <Badge
                            className={
                              categoryColors[texto.categoria] ||
                              "bg-gray-100 text-gray-700"
                            }
                            variant="secondary"
                          >
                            {texto.categoria}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-3">
                          {texto.conteudo.slice(0, 120)}...
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={0} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground shrink-0">
                            0% lido
                          </span>
                        </div>
                        {/* Invisible index marker */}
                        <span
                          className="sr-only"
                          data-ocid={`home.item.${idx + 1}`}
                        />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Nenhum texto disponível.
                </p>
                <Link
                  to="/biblioteca"
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Adicionar textos na biblioteca
                </Link>
              </CardContent>
            </Card>
          )}
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
