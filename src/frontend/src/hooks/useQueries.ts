import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Anotacao,
  ConfiguracaoLeitura,
  Conquista,
  Desafio,
  EntradaRanking,
  Progresso,
  ProgressoDesafio,
  Recompensa,
  Texto,
} from "../backend.d.ts";
import { useActor } from "./useActor";

// ─── Textos ──────────────────────────────────────────────────────────────────

export function useGetTodosTextos() {
  const { actor, isFetching } = useActor();
  return useQuery<Texto[]>({
    queryKey: ["textos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodosTextos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTextosExemplo() {
  const { actor, isFetching } = useActor();
  return useQuery<Texto[]>({
    queryKey: ["textos", "exemplo"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTextosExemplo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTexto(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Texto | null>({
    queryKey: ["texto", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getTexto(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useBuscarTextos(parteTitulo: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Texto[]>({
    queryKey: ["textos", "busca", parteTitulo],
    queryFn: async () => {
      if (!actor) return [];
      if (!parteTitulo.trim()) return actor.getTodosTextos();
      return actor.buscarTextosPorTitulo(parteTitulo);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListarTextosPorCategoria(categoria: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Texto[]>({
    queryKey: ["textos", "categoria", categoria],
    queryFn: async () => {
      if (!actor) return [];
      if (categoria === "Todos") return actor.getTodosTextos();
      return actor.listarTextosPorCategoria(categoria);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCriarTexto() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      titulo,
      conteudo,
      categoria,
      autor,
    }: {
      titulo: string;
      conteudo: string;
      categoria: string;
      autor: string;
    }) => {
      if (!actor) throw new Error("Actor não disponível");
      return actor.criarTexto(titulo, conteudo, categoria, autor);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["textos"] });
    },
  });
}

export function useDeletarTexto() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor não disponível");
      return actor.deletarTexto(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["textos"] });
    },
  });
}

// ─── Anotações ───────────────────────────────────────────────────────────────

export function useGetTodasAnotacoes() {
  const { actor, isFetching } = useActor();
  return useQuery<Anotacao[]>({
    queryKey: ["anotacoes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodasAnotacoes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAnotacoesTexto(textoId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Anotacao[]>({
    queryKey: ["anotacoes", textoId?.toString()],
    queryFn: async () => {
      if (!actor || textoId === null) return [];
      return actor.getAnotacoesTexto(textoId);
    },
    enabled: !!actor && !isFetching && textoId !== null,
  });
}

export function useCriarAnotacao() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      textoId,
      conteudo,
      cor,
    }: {
      textoId: bigint;
      conteudo: string;
      cor: string;
    }) => {
      if (!actor) throw new Error("Actor não disponível");
      return actor.criarAnotacao(textoId, conteudo, cor);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["anotacoes", vars.textoId.toString()],
      });
      void qc.invalidateQueries({ queryKey: ["anotacoes"] });
    },
  });
}

export function useDeletarAnotacao() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      textoId: _textoId,
    }: {
      id: bigint;
      textoId: bigint;
    }) => {
      if (!actor) throw new Error("Actor não disponível");
      return actor.deletarAnotacao(id);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["anotacoes", vars.textoId.toString()],
      });
      void qc.invalidateQueries({ queryKey: ["anotacoes"] });
    },
  });
}

// ─── Progresso ───────────────────────────────────────────────────────────────

export function useGetProgresso(textoId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Progresso | null>({
    queryKey: ["progresso", textoId?.toString()],
    queryFn: async () => {
      if (!actor || textoId === null) return null;
      return actor.getProgresso(textoId);
    },
    enabled: !!actor && !isFetching && textoId !== null,
  });
}

export function useSalvarProgresso() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      textoId,
      percentualLido,
    }: {
      textoId: bigint;
      percentualLido: bigint;
    }) => {
      if (!actor) throw new Error("Actor não disponível");
      return actor.salvarProgresso(textoId, percentualLido);
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["progresso", vars.textoId.toString()],
      });
    },
  });
}

// ─── Configuração de Leitura ──────────────────────────────────────────────────

export function useGetConfiguracaoLeitura() {
  const { actor, isFetching } = useActor();
  return useQuery<ConfiguracaoLeitura | null>({
    queryKey: ["configuracao"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getConfiguracaoLeitura();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSalvarConfiguracaoLeitura() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (config: ConfiguracaoLeitura) => {
      if (!actor) throw new Error("Actor não disponível");
      return actor.salvarConfiguracaoLeitura(config);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["configuracao"] });
    },
  });
}

// ─── Desafios ─────────────────────────────────────────────────────────────────

export function useGetDesafiosAtivos() {
  const { actor, isFetching } = useActor();
  return useQuery<Desafio[]>({
    queryKey: ["desafios", "ativos"],
    queryFn: async () => {
      if (!actor) return [];
      const [ativos, exemplos] = await Promise.all([
        actor.getDesafiosAtivos(),
        actor.getDesafiosExemplo(),
      ]);
      const ids = new Set(ativos.map((d) => d.id.toString()));
      const deduped = [
        ...ativos,
        ...exemplos.filter((d) => !ids.has(d.id.toString())),
      ];
      return deduped;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTodosProgressosDesafio() {
  const { actor, isFetching } = useActor();
  return useQuery<ProgressoDesafio[]>({
    queryKey: ["desafios", "progressos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodosProgressosDesafio();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Recompensas ─────────────────────────────────────────────────────────────

export function useGetSaldoAluno() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["saldo"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getSaldoAluno();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRecompensas() {
  const { actor, isFetching } = useActor();
  return useQuery<Recompensa[]>({
    queryKey: ["recompensas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecompensas();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useResgatarSaldo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor não disponível");
      return actor.resgatarSaldo();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["saldo"] });
      void qc.invalidateQueries({ queryKey: ["recompensas"] });
    },
  });
}

// ─── Conquistas ───────────────────────────────────────────────────────────────

export function useGetConquistas() {
  const { actor, isFetching } = useActor();
  return useQuery<Conquista[]>({
    queryKey: ["conquistas"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConquistas();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Ranking ─────────────────────────────────────────────────────────────────

export function useGetRanking() {
  const { actor, isFetching } = useActor();
  return useQuery<EntradaRanking[]>({
    queryKey: ["ranking"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRanking();
    },
    enabled: !!actor && !isFetching,
  });
}
