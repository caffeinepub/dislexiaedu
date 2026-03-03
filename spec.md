# DislexiaEdu - Sistema de Recompensas

## Current State

O app já possui:
- Biblioteca de textos com busca e filtros por categoria
- Leitor adaptado com controles de acessibilidade (tamanho de fonte, espaçamento, cor de fundo, modo foco, régua de leitura)
- Anotações coloridas vinculadas aos textos
- Progresso de leitura salvo automaticamente
- Configurações padrão persistentes por usuário
- Autenticação com controle de acesso (admin/user)

## Requested Changes (Diff)

### Add

**Backend:**
- `Desafio`: tipo com id, titulo, descricao, tipo (leitura/anotacao/sequencia/quiz), metaValor (Nat), recompensaToken (Nat), dataInicio, dataFim, ativo
- `DesafioAluno`: progresso do aluno em um desafio (desafioId, usuarioId, progressoAtual, concluido, dataConlusao)
- `Recompensa`: tipo com id, usuarioId, valor (Nat, representando centavos/tokens), tipo, descricao, data
- `SaldoAluno`: saldo acumulado de tokens por usuário
- `Conquista`: badges conquistados (id, nome, descricao, icone, dataConquista, usuarioId)
- APIs: `getDesafios`, `getDesafiosAtivos`, `registrarProgressoDesafio`, `concluirDesafio`, `getSaldoAluno`, `getRecompensas`, `getConquistas`, `resgatar`
- Manter todas as APIs existentes de textos, progresso, anotações e configuração

**Frontend:**
- Aba/seção "Desafios & Recompensas" no menu de navegação
- Dashboard de recompensas: saldo atual em tokens, histórico de ganhos, conquistas/badges
- Lista de desafios ativos com progresso visual (barra de progresso)
- Tipos de desafio:
  - Leitura: completar X% de um texto
  - Anotação: criar X anotações
  - Sequência: ler N textos seguidos
- Notificação visual ao completar desafio e ganhar tokens
- Seção de conquistas (badges) com ícones e descrições
- Integrar ganho de tokens ao salvar progresso de leitura e criar anotações
- Leaderboard simples (ranking dos alunos com mais tokens)

### Modify

- `salvarProgresso`: ao salvar 100% verificar se algum desafio de leitura foi concluído
- `criarAnotacao`: ao criar anotação verificar se desafio de anotação foi concluído
- Navegação do frontend: adicionar item "Recompensas"

### Remove

- Nada a remover

## Implementation Plan

1. Reescrever backend com todos os tipos existentes + novos tipos de desafios, recompensas, saldo e conquistas
2. Adicionar funções: criar/listar desafios, registrar progresso em desafios, concluir desafio e creditar tokens, consultar saldo, listar recompensas e conquistas, resgatar saldo
3. Incluir desafios de exemplo pré-carregados (seed data via query)
4. Frontend: adicionar página "Recompensas" com dashboard de tokens, lista de desafios com progresso, badges conquistados e leaderboard
5. Integrar hooks de ganho de tokens nas ações de leitura e anotação existentes
6. Mostrar notificações toast ao completar desafios e ganhar recompensas
