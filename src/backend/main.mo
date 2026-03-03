import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  public type UserProfile = {
    name : Text;
  };

  public type Texto = {
    id : Nat;
    titulo : Text;
    conteudo : Text;
    categoria : Text;
    autor : Text;
    dataCriacao : Int;
    usuarioId : Text;
  };

  module Texto {
    public func compare(texto1 : Texto, texto2 : Texto) : Order.Order {
      Nat.compare(texto1.id, texto2.id);
    };

    public func compareByCategoria(texto1 : Texto, texto2 : Texto) : Order.Order {
      switch (Text.compare(texto1.categoria, texto2.categoria)) {
        case (#equal) { Nat.compare(texto1.id, texto2.id) };
        case (order) { order };
      };
    };

    public func compareByTitulo(texto1 : Texto, texto2 : Texto) : Order.Order {
      func getFirstChar(text : Text) : Text {
        switch (text.chars().next()) {
          case (null) { "z" };
          case (?ch) { Text.fromChar(ch).toLower() };
        };
      };

      let texto1PrimeiroCaractere : Text = getFirstChar(texto1.titulo);
      let texto2PrimeiroCaractere : Text = getFirstChar(texto2.titulo);

      switch (Text.compare(texto1PrimeiroCaractere, texto2PrimeiroCaractere)) {
        case (#equal) {
          switch (Text.compare(texto1.titulo, texto2.titulo)) {
            case (#equal) { Nat.compare(texto1.id, texto2.id) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };

    public func compareByTituloIgnoreCase(texto1 : Texto, texto2 : Texto) : Order.Order {
      Text.compare(texto1.titulo.toLower(), texto2.titulo.toLower());
    };
  };

  public type Progresso = {
    textoId : Nat;
    usuarioId : Text;
    percentualLido : Nat;
    ultimaLeitura : Int;
  };

  module Progresso {
    public func compare(progresso1 : Progresso, progresso2 : Progresso) : Order.Order {
      switch (Nat.compare(progresso1.textoId, progresso2.textoId)) {
        case (#equal) { Text.compare(progresso1.usuarioId, progresso2.usuarioId) };
        case (order) { order };
      };
    };
  };

  public type ConfiguracaoLeitura = {
    usuarioId : Text;
    tamanhoFonte : Nat;
    espacamentoLetras : Text;
    espacamentoLinhas : Text;
    corFundo : Text;
    larguraColuna : Nat;
    modoFoco : Bool;
  };

  module ConfiguracaoLeitura {
    public func compare(confs1 : ConfiguracaoLeitura, confs2 : ConfiguracaoLeitura) : Order.Order {
      switch (Text.compare(confs1.usuarioId, confs2.usuarioId)) {
        case (#equal) { Nat.compare(confs1.tamanhoFonte, confs2.tamanhoFonte) };
        case (order) { order };
      };
    };
  };

  public type Anotacao = {
    id : Nat;
    textoId : Nat;
    conteudo : Text;
    cor : Text;
    dataCriacao : Int;
    usuarioId : Text;
  };

  module Anotacao {
    public func compare(anotacao1 : Anotacao, anotacao2 : Anotacao) : Order.Order {
      Nat.compare(anotacao1.id, anotacao2.id);
    };
  };

  public type Desafio = {
    id : Nat;
    titulo : Text;
    descricao : Text;
    tipo : Text;
    metaValor : Nat;
    recompensaTokens : Nat;
    ativo : Bool;
  };

  public type ProgressoDesafio = {
    desafioId : Nat;
    usuarioId : Text;
    progressoAtual : Nat;
    concluido : Bool;
    dataConclusao : Int;
  };

  public type Recompensa = {
    id : Nat;
    usuarioId : Text;
    valor : Nat;
    descricao : Text;
    data : Int;
  };

  public type Conquista = {
    id : Nat;
    nome : Text;
    descricao : Text;
    marco : Text;
    dataConquista : Int;
    usuarioId : Text;
  };

  public type EntradaRanking = {
    nome : Text;
    tokens : Nat;
  };

  // Custom comparison for (Text, Nat) tuples
  module TupleStringNat {
    public func compare(tuple1 : (Text, Nat), tuple2 : (Text, Nat)) : Order.Order {
      switch (Text.compare(tuple1.0, tuple2.0)) {
        case (#equal) { Nat.compare(tuple1.1, tuple2.1) };
        case (order) { order };
      };
    };
  };

  // State
  let userProfiles = Map.empty<Principal, UserProfile>();
  let textos = Map.empty<Nat, Texto>();
  let progressos = Map.empty<(Text, Nat), Progresso>();
  let configuracoesLeitura = Map.empty<Text, ConfiguracaoLeitura>();
  let anotacoes = Map.empty<Nat, Anotacao>();
  let desafios = Map.empty<Nat, Desafio>();
  let progressosDesafio = Map.empty<(Text, Nat), ProgressoDesafio>();
  let recompensas = Map.empty<Nat, Recompensa>();
  let saldos = Map.empty<Text, Nat>();
  let conquistas = Map.empty<Nat, Conquista>();
  var nextTextoId : Nat = 1;
  var nextAnotacaoId : Nat = 1;
  var nextDesafioId : Nat = 1;
  var nextRecompensaId : Nat = 1;
  var nextConquistaId : Nat = 1;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Textos CRUD
  public shared ({ caller }) func criarTexto(
    titulo : Text,
    conteudo : Text,
    categoria : Text,
    autor : Text
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create texts");
    };

    let usuarioId = caller.toText();
    let id = nextTextoId;
    nextTextoId += 1;

    let novoTexto : Texto = {
      id;
      titulo;
      conteudo;
      categoria;
      autor;
      dataCriacao = Time.now();
      usuarioId;
    };
    textos.add(id, novoTexto);
    id;
  };

  public shared ({ caller }) func editarTexto(id : Nat, titulo : Text, conteudo : Text, categoria : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can edit texts");
    };

    let usuarioId = caller.toText();
    switch (textos.get(id)) {
      case (null) { Runtime.trap("Texto não encontrado") };
      case (?texto) {
        if (texto.usuarioId != usuarioId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the creator or admin can edit this text");
        };
        let textoEditado : Texto = {
          id;
          titulo;
          conteudo;
          categoria;
          autor = texto.autor;
          dataCriacao = texto.dataCriacao;
          usuarioId = texto.usuarioId;
        };
        textos.add(id, textoEditado);
      };
    };
  };

  public shared ({ caller }) func deletarTexto(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete texts");
    };

    let usuarioId = caller.toText();
    switch (textos.get(id)) {
      case (null) { Runtime.trap("Texto não encontrado") };
      case (?texto) {
        if (texto.usuarioId != usuarioId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the creator or admin can delete this text");
        };
        textos.remove(id);
      };
    };
  };

  public query ({ caller }) func getTexto(id : Nat) : async ?Texto {
    // Anyone can read texts (including guests)
    textos.get(id);
  };

  public query ({ caller }) func getTodosTextos() : async [Texto] {
    // Anyone can list texts (including guests)
    textos.values().toArray().sort();
  };

  public query ({ caller }) func listarTextosPorCategoria(categoria : Text) : async [Texto] {
    // Anyone can list texts by category (including guests)
    textos.values().filter(func(texto) { texto.categoria == categoria }).toArray();
  };

  public query ({ caller }) func buscarTextosPorTitulo(parteTitulo : Text) : async [Texto] {
    // Anyone can search texts (including guests)
    let textoFiltrados = textos.values().filter(
      func(texto) {
        let tituloMinusculo = texto.titulo.toLower();
        let buscaMinusculo = parteTitulo.toLower();
        tituloMinusculo.contains(#text buscaMinusculo);
      }
    );
    textoFiltrados.toArray().sort(Texto.compareByTitulo);
  };

  public query ({ caller }) func getTextosExemplo() : async [Texto] {
    // Anyone can access example texts (including guests)
    let texto1 : Texto = {
      id = 1;
      titulo = "Metodologia Científica";
      conteudo =
        "A metodologia científica fornece as etapas e processos fundamentais para a pesquisa acadêmica. Envolve a definição de objetivos, formulação de hipóteses, coleta e análise de dados, além da disseminação dos resultados encontrados.";
      categoria = "Educacao";
      autor = "Universidade XYZ";
      dataCriacao = 0;
      usuarioId = "admin";
    };

    let texto2 : Texto = {
      id = 2;
      titulo = "Comunicação Acadêmica";
      conteudo =
        "A comunicação acadêmica é essencial para transmitir conhecimento de forma clara e objetiva. Inclui a participação em seminários, produção de artigos científicos e colaboração em projetos interdisciplinares.";
      categoria = "Educacao";
      autor = "Universidade XYZ";
      dataCriacao = 0;
      usuarioId = "admin";
    };

    let texto3 : Texto = {
      id = 3;
      titulo = "Gestão do Tempo";
      conteudo =
        "Organizar suas atividades ajuda a administrar o tempo de modo mais eficiente. Utilize agendas, cronogramas e ferramentas de priorização de tarefas para melhorar seu desempenho nos estudos.";
      categoria = "Educacao";
      autor = "Universidade XYZ";
      dataCriacao = 0;
      usuarioId = "admin";
    };

    [texto1, texto2, texto3];
  };

  // Progresso CRUD
  public shared ({ caller }) func salvarProgresso(textoId : Nat, percentualLido : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save progress");
    };

    let usuarioId = caller.toText();
    let progresso : Progresso = {
      textoId;
      usuarioId;
      percentualLido;
      ultimaLeitura = Time.now();
    };
    progressos.add((usuarioId, textoId), progresso);

    // Check if reading is complete and trigger challenge verification
    if (percentualLido >= 100) {
      verificarDesafiosLeitura(caller, textoId);
      verificarConquistas(caller);
    };
  };

  public query ({ caller }) func getProgresso(textoId : Nat) : async ?Progresso {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access progress");
    };

    let usuarioId = caller.toText();
    progressos.get((usuarioId, textoId));
  };

  // ConfiguracaoLeitura CRUD
  public shared ({ caller }) func salvarConfiguracaoLeitura(config : ConfiguracaoLeitura) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save reading configuration");
    };

    let usuarioId = caller.toText();
    let novaConfig : ConfiguracaoLeitura = {
      config with usuarioId;
    };
    configuracoesLeitura.add(usuarioId, novaConfig);
  };

  public query ({ caller }) func getConfiguracaoLeitura() : async ?ConfiguracaoLeitura {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access reading configuration");
    };

    let usuarioId = caller.toText();
    configuracoesLeitura.get(usuarioId);
  };

  // Anotação CRUD
  public shared ({ caller }) func criarAnotacao(textoId : Nat, conteudo : Text, cor : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create annotations");
    };

    let usuarioId = caller.toText();
    if (not textos.containsKey(textoId)) {
      Runtime.trap("Texto não encontrado. Anotação não pode ser salva.");
    };

    let id = nextAnotacaoId;
    nextAnotacaoId += 1;

    let novaAnotacao : Anotacao = {
      id;
      textoId;
      conteudo;
      cor;
      dataCriacao = Time.now();
      usuarioId;
    };

    anotacoes.add(id, novaAnotacao);

    // Trigger annotation challenge verification
    verificarDesafiosAnotacao(caller);
    verificarConquistas(caller);

    id;
  };

  public shared ({ caller }) func editarAnotacao(id : Nat, conteudo : Text, cor : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can edit annotations");
    };

    switch (anotacoes.get(id)) {
      case (null) { Runtime.trap("Anotação não encontrada") };
      case (?anotacao) {
        let usuarioId = caller.toText();
        if (anotacao.usuarioId != usuarioId) {
          Runtime.trap("Unauthorized: Only the creator can edit this annotation");
        };

        let anotacaoEditada : Anotacao = {
          id = anotacao.id;
          textoId = anotacao.textoId;
          conteudo;
          cor;
          dataCriacao = Time.now();
          usuarioId = anotacao.usuarioId;
        };
        anotacoes.add(id, anotacaoEditada);
      };
    };
  };

  public shared ({ caller }) func deletarAnotacao(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete annotations");
    };

    switch (anotacoes.get(id)) {
      case (null) { Runtime.trap("Anotação não encontrada") };
      case (?anotacao) {
        let usuarioId = caller.toText();
        if (anotacao.usuarioId != usuarioId) {
          Runtime.trap("Unauthorized: Only the creator can delete this annotation");
        };
        anotacoes.remove(id);
      };
    };
  };

  public query ({ caller }) func getAnotacao(id : Nat) : async ?Anotacao {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access annotations");
    };

    anotacoes.get(id);
  };

  public query ({ caller }) func getTodasAnotacoes() : async [Anotacao] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list annotations");
    };

    let usuarioId = caller.toText();
    // Users can only see their own annotations
    anotacoes.values().filter(func(anotacao) { anotacao.usuarioId == usuarioId }).toArray().sort();
  };

  public query ({ caller }) func getAnotacoesTexto(textoId : Nat) : async [Anotacao] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access annotations");
    };

    let usuarioId = caller.toText();
    // Users can only see their own annotations for a text
    anotacoes.values().filter(func(anotacao) { anotacao.textoId == textoId and anotacao.usuarioId == usuarioId }).toArray();
  };

  // Desafios CRUD
  public shared ({ caller }) func criarDesafio(
    titulo : Text,
    descricao : Text,
    tipo : Text,
    metaValor : Nat,
    recompensaTokens : Nat
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create challenges");
    };

    let id = nextDesafioId;
    nextDesafioId += 1;

    let novoDesafio : Desafio = {
      id;
      titulo;
      descricao;
      tipo;
      metaValor;
      recompensaTokens;
      ativo = true;
    };
    desafios.add(id, novoDesafio);
    id;
  };

  public query ({ caller }) func getDesafio(id : Nat) : async ?Desafio {
    // Anyone can view challenges (including guests)
    desafios.get(id);
  };

  public query ({ caller }) func getDesafiosAtivos() : async [Desafio] {
    // Anyone can view active challenges (including guests)
    desafios.values().filter(func(desafio) { desafio.ativo }).toArray();
  };

  public query ({ caller }) func getDesafiosExemplo() : async [Desafio] {
    // Anyone can view example challenges (including guests)
    let desafio1 : Desafio = {
      id = 1;
      titulo = "Primeiro Texto";
      descricao = "Leia seu primeiro texto completo";
      tipo = "leitura";
      metaValor = 1;
      recompensaTokens = 10;
      ativo = true;
    };

    let desafio2 : Desafio = {
      id = 2;
      titulo = "Leitor Dedicado";
      descricao = "Leia 5 textos completos";
      tipo = "leitura";
      metaValor = 5;
      recompensaTokens = 50;
      ativo = true;
    };

    let desafio3 : Desafio = {
      id = 3;
      titulo = "Primeira Anotação";
      descricao = "Crie sua primeira anotação";
      tipo = "anotacao";
      metaValor = 1;
      recompensaTokens = 5;
      ativo = true;
    };

    let desafio4 : Desafio = {
      id = 4;
      titulo = "Anotador Ativo";
      descricao = "Crie 10 anotações";
      tipo = "anotacao";
      metaValor = 10;
      recompensaTokens = 30;
      ativo = true;
    };

    [desafio1, desafio2, desafio3, desafio4];
  };

  // Progresso em desafios
  public query ({ caller }) func getProgressoDesafio(desafioId : Nat) : async ?ProgressoDesafio {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access challenge progress");
    };

    let usuarioId = caller.toText();
    progressosDesafio.get((usuarioId, desafioId));
  };

  public query ({ caller }) func getTodosProgressosDesafio() : async [ProgressoDesafio] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list challenge progress");
    };

    let usuarioId = caller.toText();
    // Users can only see their own challenge progress
    progressosDesafio.values().filter(func(progresso) { progresso.usuarioId == usuarioId }).toArray();
  };

  // Recompensas e Saldo
  public query ({ caller }) func getSaldoAluno() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access balance");
    };

    let usuarioId = caller.toText();
    switch (saldos.get(usuarioId)) {
      case (null) { 0 };
      case (?saldo) { saldo };
    };
  };

  public query ({ caller }) func getRecompensas() : async [Recompensa] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access rewards");
    };

    let usuarioId = caller.toText();
    // Users can only see their own rewards
    recompensas.values().filter(func(recompensa) { recompensa.usuarioId == usuarioId }).toArray();
  };

  public shared ({ caller }) func resgatarSaldo() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can redeem balance");
    };

    let usuarioId = caller.toText();
    let saldoAtual = switch (saldos.get(usuarioId)) {
      case (null) { 0 };
      case (?saldo) { saldo };
    };

    // Reset balance to zero
    saldos.add(usuarioId, 0);

    saldoAtual;
  };

  // Conquistas
  public query ({ caller }) func getConquistas() : async [Conquista] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access achievements");
    };

    let usuarioId = caller.toText();
    // Users can only see their own achievements
    conquistas.values().filter(func(conquista) { conquista.usuarioId == usuarioId }).toArray();
  };

  // Ranking
  public query ({ caller }) func getRanking() : async [EntradaRanking] {
    // Anyone can view ranking (including guests)
    let entradas = Map.empty<Text, Nat>();

    // Collect all user balances
    for ((usuarioId, saldo) in saldos.entries()) {
      // Get user profile name
      let nome = switch (userProfiles.entries().find(func((principal, profile) : (Principal, UserProfile)) : Bool {
        principal.toText() == usuarioId;
      })) {
        case (null) { usuarioId };
        case (?(_, profile)) { profile.name };
      };

      entradas.add(usuarioId, saldo);
    };

    // Convert to array and sort by balance (descending)
    let rankingArray = Array.tabulate(
      entradas.size(),
      func(i : Nat) : EntradaRanking {
        let entries = entradas.entries().toArray();
        if (i < entries.size()) {
          let (usuarioId, saldo) = entries[i];
          let nome = switch (userProfiles.entries().find(func((principal, profile) : (Principal, UserProfile)) : Bool {
            principal.toText() == usuarioId;
          })) {
            case (null) { usuarioId };
            case (?(_, profile)) { profile.name };
          };
          { nome; tokens = saldo };
        } else {
          { nome = ""; tokens = 0 };
        };
      }
    );

    // Sort by tokens descending and take top 10
    let sorted = rankingArray.sort(
      func(a : EntradaRanking, b : EntradaRanking) : Order.Order {
        Nat.compare(b.tokens, a.tokens);
      }
    );

    let top10 = if (sorted.size() > 10) {
      Array.tabulate(10, func(i : Nat) : EntradaRanking { sorted[i] });
    } else {
      sorted;
    };

    top10;
  };

  // Private helper functions
  private func verificarDesafiosLeitura(caller : Principal, textoId : Nat) {
    let usuarioId = caller.toText();

    // Count completed texts by user
    let textosLidos = progressos.values().filter(
      func(progresso) {
        progresso.usuarioId == usuarioId and progresso.percentualLido >= 100;
      }
    ).toArray().size();

    // Check all active reading challenges
    for (desafio in desafios.values()) {
      if (desafio.ativo and (desafio.tipo == "leitura" or desafio.tipo == "sequencia")) {
        let progressoAtual = textosLidos;

        // Check if challenge is already completed
        let jaCompleto = switch (progressosDesafio.get((usuarioId, desafio.id))) {
          case (null) { false };
          case (?progresso) { progresso.concluido };
        };

        if (not jaCompleto and progressoAtual >= desafio.metaValor) {
          // Mark challenge as completed
          let novoProgresso : ProgressoDesafio = {
            desafioId = desafio.id;
            usuarioId;
            progressoAtual;
            concluido = true;
            dataConclusao = Time.now();
          };
          progressosDesafio.add((usuarioId, desafio.id), novoProgresso);

          // Credit tokens
          creditarTokens(usuarioId, desafio.recompensaTokens, "Desafio concluído: " # desafio.titulo);
        } else if (not jaCompleto) {
          // Update progress
          let novoProgresso : ProgressoDesafio = {
            desafioId = desafio.id;
            usuarioId;
            progressoAtual;
            concluido = false;
            dataConclusao = 0;
          };
          progressosDesafio.add((usuarioId, desafio.id), novoProgresso);
        };
      };
    };
  };

  private func verificarDesafiosAnotacao(caller : Principal) {
    let usuarioId = caller.toText();

    // Count annotations by user
    let totalAnotacoes = anotacoes.values().filter(
      func(anotacao) {
        anotacao.usuarioId == usuarioId;
      }
    ).toArray().size();

    // Check all active annotation challenges
    for (desafio in desafios.values()) {
      if (desafio.ativo and desafio.tipo == "anotacao") {
        let progressoAtual = totalAnotacoes;

        // Check if challenge is already completed
        let jaCompleto = switch (progressosDesafio.get((usuarioId, desafio.id))) {
          case (null) { false };
          case (?progresso) { progresso.concluido };
        };

        if (not jaCompleto and progressoAtual >= desafio.metaValor) {
          // Mark challenge as completed
          let novoProgresso : ProgressoDesafio = {
            desafioId = desafio.id;
            usuarioId;
            progressoAtual;
            concluido = true;
            dataConclusao = Time.now();
          };
          progressosDesafio.add((usuarioId, desafio.id), novoProgresso);

          // Credit tokens
          creditarTokens(usuarioId, desafio.recompensaTokens, "Desafio concluído: " # desafio.titulo);
        } else if (not jaCompleto) {
          // Update progress
          let novoProgresso : ProgressoDesafio = {
            desafioId = desafio.id;
            usuarioId;
            progressoAtual;
            concluido = false;
            dataConclusao = 0;
          };
          progressosDesafio.add((usuarioId, desafio.id), novoProgresso);
        };
      };
    };
  };

  private func creditarTokens(usuarioId : Text, valor : Nat, descricao : Text) {
    // Update balance
    let saldoAtual = switch (saldos.get(usuarioId)) {
      case (null) { 0 };
      case (?saldo) { saldo };
    };
    saldos.add(usuarioId, saldoAtual + valor);

    // Record reward
    let id = nextRecompensaId;
    nextRecompensaId += 1;

    let novaRecompensa : Recompensa = {
      id;
      usuarioId;
      valor;
      descricao;
      data = Time.now();
    };
    recompensas.add(id, novaRecompensa);
  };

  private func verificarConquistas(caller : Principal) {
    let usuarioId = caller.toText();

    // Check if user already has achievements
    let conquistasUsuario = conquistas.values().filter(
      func(conquista) {
        conquista.usuarioId == usuarioId;
      }
    ).toArray();

    // Count texts read
    let textosLidos = progressos.values().filter(
      func(progresso) {
        progresso.usuarioId == usuarioId and progresso.percentualLido >= 100;
      }
    ).toArray().size();

    // Count annotations
    let totalAnotacoes = anotacoes.values().filter(
      func(anotacao) {
        anotacao.usuarioId == usuarioId;
      }
    ).toArray().size();

    // Count completed challenges
    let desafiosConcluidos = progressosDesafio.values().filter(
      func(progresso) {
        progresso.usuarioId == usuarioId and progresso.concluido;
      }
    ).toArray().size();

    // Achievement: First text read
    if (textosLidos >= 1 and conquistasUsuario.find(func(c) { c.marco == "1_texto_lido" }) == null) {
      let id = nextConquistaId;
      nextConquistaId += 1;
      let conquista : Conquista = {
        id;
        nome = "Primeira Leitura";
        descricao = "Completou a leitura do primeiro texto";
        marco = "1_texto_lido";
        dataConquista = Time.now();
        usuarioId;
      };
      conquistas.add(id, conquista);
    };

    // Achievement: 5 texts read
    if (textosLidos >= 5 and conquistasUsuario.find(func(c) { c.marco == "5_textos_lidos" }) == null) {
      let id = nextConquistaId;
      nextConquistaId += 1;
      let conquista : Conquista = {
        id;
        nome = "Leitor Dedicado";
        descricao = "Completou a leitura de 5 textos";
        marco = "5_textos_lidos";
        dataConquista = Time.now();
        usuarioId;
      };
      conquistas.add(id, conquista);
    };

    // Achievement: 10 annotations
    if (totalAnotacoes >= 10 and conquistasUsuario.find(func(c) { c.marco == "10_anotacoes" }) == null) {
      let id = nextConquistaId;
      nextConquistaId += 1;
      let conquista : Conquista = {
        id;
        nome = "Anotador Ativo";
        descricao = "Criou 10 anotações";
        marco = "10_anotacoes";
        dataConquista = Time.now();
        usuarioId;
      };
      conquistas.add(id, conquista);
    };

    // Achievement: First challenge completed
    if (desafiosConcluidos >= 1 and conquistasUsuario.find(func(c) { c.marco == "1_desafio_concluido" }) == null) {
      let id = nextConquistaId;
      nextConquistaId += 1;
      let conquista : Conquista = {
        id;
        nome = "Primeiro Desafio";
        descricao = "Completou o primeiro desafio";
        marco = "1_desafio_concluido";
        dataConquista = Time.now();
        usuarioId;
      };
      conquistas.add(id, conquista);
    };
  };
};
