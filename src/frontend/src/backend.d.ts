import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ConfiguracaoLeitura {
    espacamentoLetras: string;
    corFundo: string;
    espacamentoLinhas: string;
    modoFoco: boolean;
    larguraColuna: bigint;
    usuarioId: string;
    tamanhoFonte: bigint;
}
export interface ProgressoDesafio {
    concluido: boolean;
    dataConclusao: bigint;
    desafioId: bigint;
    usuarioId: string;
    progressoAtual: bigint;
}
export interface Progresso {
    percentualLido: bigint;
    textoId: bigint;
    usuarioId: string;
    ultimaLeitura: bigint;
}
export interface Desafio {
    id: bigint;
    recompensaTokens: bigint;
    titulo: string;
    descricao: string;
    ativo: boolean;
    tipo: string;
    metaValor: bigint;
}
export interface Anotacao {
    id: bigint;
    cor: string;
    conteudo: string;
    textoId: bigint;
    dataCriacao: bigint;
    usuarioId: string;
}
export interface Recompensa {
    id: bigint;
    descricao: string;
    valor: bigint;
    data: bigint;
    usuarioId: string;
}
export interface Conquista {
    id: bigint;
    marco: string;
    dataConquista: bigint;
    descricao: string;
    nome: string;
    usuarioId: string;
}
export interface EntradaRanking {
    nome: string;
    tokens: bigint;
}
export interface Texto {
    id: bigint;
    categoria: string;
    titulo: string;
    autor: string;
    conteudo: string;
    dataCriacao: bigint;
    usuarioId: string;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    buscarTextosPorTitulo(parteTitulo: string): Promise<Array<Texto>>;
    criarAnotacao(textoId: bigint, conteudo: string, cor: string): Promise<bigint>;
    criarDesafio(titulo: string, descricao: string, tipo: string, metaValor: bigint, recompensaTokens: bigint): Promise<bigint>;
    criarTexto(titulo: string, conteudo: string, categoria: string, autor: string): Promise<bigint>;
    deletarAnotacao(id: bigint): Promise<void>;
    deletarTexto(id: bigint): Promise<void>;
    editarAnotacao(id: bigint, conteudo: string, cor: string): Promise<void>;
    editarTexto(id: bigint, titulo: string, conteudo: string, categoria: string): Promise<void>;
    getAnotacao(id: bigint): Promise<Anotacao | null>;
    getAnotacoesTexto(textoId: bigint): Promise<Array<Anotacao>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConfiguracaoLeitura(): Promise<ConfiguracaoLeitura | null>;
    getConquistas(): Promise<Array<Conquista>>;
    getDesafio(id: bigint): Promise<Desafio | null>;
    getDesafiosAtivos(): Promise<Array<Desafio>>;
    getDesafiosExemplo(): Promise<Array<Desafio>>;
    getProgresso(textoId: bigint): Promise<Progresso | null>;
    getProgressoDesafio(desafioId: bigint): Promise<ProgressoDesafio | null>;
    getRanking(): Promise<Array<EntradaRanking>>;
    getRecompensas(): Promise<Array<Recompensa>>;
    getSaldoAluno(): Promise<bigint>;
    getTexto(id: bigint): Promise<Texto | null>;
    getTextosExemplo(): Promise<Array<Texto>>;
    getTodasAnotacoes(): Promise<Array<Anotacao>>;
    getTodosProgressosDesafio(): Promise<Array<ProgressoDesafio>>;
    getTodosTextos(): Promise<Array<Texto>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listarTextosPorCategoria(categoria: string): Promise<Array<Texto>>;
    resgatarSaldo(): Promise<bigint>;
    salvarConfiguracaoLeitura(config: ConfiguracaoLeitura): Promise<void>;
    salvarProgresso(textoId: bigint, percentualLido: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
