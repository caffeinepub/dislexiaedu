import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Library,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Texto } from "../backend.d.ts";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBuscarTextos,
  useCriarTexto,
  useDeletarTexto,
} from "../hooks/useQueries";

const CATEGORIAS = ["Todos", "Resumos", "Artigos", "Anotações", "Exercícios"];

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
  });
}

export default function BibliotecaPage() {
  const { identity } = useInternetIdentity();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);

  const { data: textos, isLoading, isError } = useBuscarTextos(searchTerm);
  const { mutateAsync: criarTexto, isPending: isCriando } = useCriarTexto();
  const { mutateAsync: deletarTexto, isPending: isDeletando } =
    useDeletarTexto();

  const [form, setForm] = useState({
    titulo: "",
    conteudo: "",
    categoria: "Resumos",
    autor: "",
  });

  const filteredTextos = (textos ?? []).filter((t) =>
    activeCategory === "Todos" ? true : t.categoria === activeCategory,
  );

  const principalName =
    identity?.getPrincipal().toString().slice(0, 8) ?? "Usuário";

  async function handleCriar() {
    if (!form.titulo.trim() || !form.conteudo.trim() || !form.autor.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      await criarTexto(form);
      toast.success("Texto adicionado com sucesso!");
      setAddOpen(false);
      setForm({ titulo: "", conteudo: "", categoria: "Resumos", autor: "" });
    } catch {
      toast.error("Erro ao adicionar texto.");
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await deletarTexto(id);
      toast.success("Texto removido.");
      setDeleteTarget(null);
    } catch {
      toast.error("Erro ao remover texto.");
    }
  }

  return (
    <div
      className="min-h-screen pb-20 md:pb-8 animate-fade-slide-up"
      data-ocid="biblioteca.page"
    >
      {/* Header */}
      <div className="px-6 md:px-8 pt-8 pb-6 border-b border-border/40">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Library className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Biblioteca</h1>
              <p className="text-muted-foreground text-sm">
                {filteredTextos.length} texto
                {filteredTextos.length !== 1 ? "s" : ""} disponível
                {filteredTextos.length !== 1 ? "is" : ""}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="shrink-0"
            data-ocid="biblioteca.add_button"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-ocid="biblioteca.search_input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <Tabs
          value={activeCategory}
          onValueChange={setActiveCategory}
          data-ocid="biblioteca.filter.tab"
        >
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/60 p-1">
            {CATEGORIAS.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs"
                data-ocid="biblioteca.filter.tab"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Text list */}
      <div className="px-6 md:px-8 py-6">
        {isError && (
          <div
            className="flex items-center gap-2 text-destructive text-sm mb-4 p-3 rounded-lg bg-destructive/10"
            data-ocid="biblioteca.error_state"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            Erro ao carregar textos. Tente recarregar a página.
          </div>
        )}

        {isLoading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-ocid="biblioteca.loading_state"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTextos.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="biblioteca.empty_state"
          >
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium mb-1">
              Nenhum texto encontrado
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              {searchTerm
                ? `Nenhum resultado para "${searchTerm}"`
                : "Adicione seu primeiro texto na biblioteca"}
            </p>
            {!searchTerm && (
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar texto
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {filteredTextos.map((texto, idx) => (
                <TextoCard
                  key={texto.id.toString()}
                  texto={texto}
                  index={idx + 1}
                  onDelete={() => setDeleteTarget(texto.id)}
                  isOwner={
                    texto.usuarioId === identity?.getPrincipal().toString()
                  }
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add text dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg" data-ocid="biblioteca.dialog">
          <DialogHeader>
            <DialogTitle>Adicionar novo texto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                placeholder="Título do texto"
                value={form.titulo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titulo: e.target.value }))
                }
                data-ocid="biblioteca.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="autor">Autor *</Label>
              <Input
                id="autor"
                placeholder={`ex: ${principalName}`}
                value={form.autor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, autor: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}
              >
                <SelectTrigger id="categoria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.slice(1).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conteudo">Conteúdo *</Label>
              <Textarea
                id="conteudo"
                placeholder="Cole ou digite o texto aqui..."
                value={form.conteudo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, conteudo: e.target.value }))
                }
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="biblioteca.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriar}
              disabled={isCriando}
              data-ocid="biblioteca.submit_button"
            >
              {isCriando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="biblioteca.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover texto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O texto e todas as suas anotações
              serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="biblioteca.cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              disabled={isDeletando}
              className="bg-destructive hover:bg-destructive/90"
              data-ocid="biblioteca.confirm_button"
            >
              {isDeletando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TextoCard({
  texto,
  index,
  onDelete,
  isOwner,
}: {
  texto: Texto;
  index: number;
  onDelete: () => void;
  isOwner: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      }}
      exit={{ opacity: 0, scale: 0.97 }}
      data-ocid={`biblioteca.item.${index}`}
    >
      <Card className="group hover:shadow-card transition-all duration-200 border-border/60 hover:border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm leading-snug group-hover:text-primary transition-colors truncate">
                  {texto.titulo}
                </h3>
              </div>
              <p className="text-muted-foreground text-xs">
                {texto.autor} · {formatDate(texto.dataCriacao)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                className={
                  categoryColors[texto.categoria] || "bg-gray-100 text-gray-700"
                }
                variant="secondary"
              >
                {texto.categoria}
              </Badge>
            </div>
          </div>

          <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-4">
            {texto.conteudo.slice(0, 150)}
            {texto.conteudo.length > 150 ? "..." : ""}
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <Progress value={0} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">0%</span>
            </div>
            <div className="flex items-center gap-1">
              {isOwner && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete();
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remover texto"
                  data-ocid={`biblioteca.delete_button.${index}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <Link to="/leitor/$id" params={{ id: texto.id.toString() }}>
                <Button variant="ghost" size="sm" className="h-7 px-3 text-xs">
                  Ler
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
