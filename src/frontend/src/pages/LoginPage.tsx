import { Button } from "@/components/ui/button";
import {
  BookMarked,
  BookOpen,
  Highlighter,
  Loader2,
  ScanText,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isLoginError } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
        <img
          src="/assets/generated/hero-dislexia.dim_1200x400.jpg"
          alt="DislexiaEdu"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.27 0.04 210 / 0.92) 0%, oklch(0.35 0.08 155 / 0.85) 100%)",
          }}
        />
        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookMarked className="h-6 w-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">DislexiaEdu</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-white leading-snug mb-4">
                Leitura mais fácil
                <br />
                para todos
              </h2>
              <p className="text-white/70 text-lg leading-relaxed max-w-md">
                Um ambiente de leitura pensado para estudantes com dislexia no
                ensino superior. Configure fontes, espaçamento, cores e foque no
                que importa.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-12 grid grid-cols-1 gap-4"
            >
              {[
                {
                  icon: BookOpen,
                  title: "Textos acessíveis",
                  desc: "Biblioteca com resumos e artigos acadêmicos",
                },
                {
                  icon: Highlighter,
                  title: "Anotações coloridas",
                  desc: "Destaque trechos importantes com cores",
                },
                {
                  icon: ScanText,
                  title: "Modo foco",
                  desc: "Leitura guiada com régua e destaque de parágrafo",
                },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <feature.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {feature.title}
                    </p>
                    <p className="text-white/60 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()}. Construído com{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline hover:text-white/60 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>

      {/* Right panel — login */}
      <div className="flex flex-col justify-center items-center flex-1 px-8 py-12 max-w-md mx-auto w-full lg:max-w-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full space-y-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookMarked className="h-7 w-7 text-primary" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Entre para acessar sua biblioteca personalizada e continuar de
              onde parou.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full text-base font-semibold h-12 bg-primary hover:bg-primary/90"
              onClick={login}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <BookMarked className="mr-2 h-5 w-5" />
                  Entrar com Internet Identity
                </>
              )}
            </Button>

            {isLoginError && (
              <p className="text-destructive text-sm text-center">
                Erro ao fazer login. Tente novamente.
              </p>
            )}

            <p className="text-muted-foreground text-xs text-center">
              O Internet Identity é um sistema de autenticação seguro e anônimo.
              Seus dados ficam protegidos.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
