# DislexiaEdu - App para Alunos com Dislexia no Ensino Superior

## Current State
Novo projeto. Nenhuma funcionalidade existente.

## Requested Changes (Diff)

### Add

**Backend (Motoko):**
- Entidade `Texto`: id, titulo, conteudo, categoria, dataCriacao
- Entidade `Anotacao`: id, textoId, conteudo, cor, dataCriacao
- Entidade `Progresso`: usuarioId, textoId, percentualLido, ultimaLeitura
- CRUD de textos e materiais de estudo
- CRUD de anotações pessoais por aluno
- Registro de progresso de leitura
- Categorias de conteúdo: Resumos, Artigos, Anotações, Exercícios

**Frontend (React):**
- Tela inicial com painel de boas-vindas e acesso rápido a recursos
- Leitor de textos adaptado para dislexia:
  - Fonte OpenDyslexic ou fonte sem serifa com espaçamento aumentado
  - Controle de tamanho da fonte (pequeno, médio, grande, extra-grande)
  - Controle de espaçamento entre letras e linhas
  - Modo de foco (destaque linha por linha)
  - Régua de leitura (highlight da linha atual)
  - Paleta de cores de fundo (branco, creme, azul claro, amarelo claro, verde claro)
  - Controle de largura da coluna de texto
- Painel de materiais de estudo:
  - Listagem de textos por categoria
  - Busca por título
  - Indicador de progresso de leitura
- Editor de anotações pessoais:
  - Anotações em cor destacada
  - Vinculadas a textos específicos ou avulsas
- Painel de acessibilidade (configurações persistentes de leitura)
- Navegação simples e intuitiva (menu lateral fixo)
- Conteúdo de exemplo pré-carregado para demonstração

### Modify
- Nenhum (projeto novo)

### Remove
- Nenhum (projeto novo)

## Implementation Plan

1. Criar modelo de dados no backend: Texto, Anotacao, Progresso, ConfiguracaoLeitura
2. Implementar endpoints CRUD para textos, anotações e progresso
3. Criar dados de exemplo (textos educativos sobre temas universitários comuns)
4. Frontend: Layout principal com menu lateral e área de conteúdo
5. Frontend: Componente de leitor adaptado com todos os controles de acessibilidade
6. Frontend: Painel de materiais com categorias e busca
7. Frontend: Editor e visualizador de anotações
8. Frontend: Painel de configurações de acessibilidade
9. Integração frontend com backend via bindings gerados
