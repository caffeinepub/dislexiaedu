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
  var nextTextoId : Nat = 1;
  var nextAnotacaoId : Nat = 1;

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
          Runtime.trap("Unauthorized: Only the creator can edit this text");
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
          Runtime.trap("Unauthorized: Only the creator can delete this text");
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
        if (anotacao.usuarioId != usuarioId and not AccessControl.isAdmin(accessControlState, caller)) {
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
        if (anotacao.usuarioId != usuarioId and not AccessControl.isAdmin(accessControlState, caller)) {
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
    anotacoes.values().filter(func(anotacao) { 
      anotacao.usuarioId == usuarioId or AccessControl.isAdmin(accessControlState, caller)
    }).toArray().sort();
  };

  public query ({ caller }) func getAnotacoesTexto(textoId : Nat) : async [Anotacao] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access annotations");
    };

    let usuarioId = caller.toText();
    // Users can only see their own annotations for a text
    anotacoes.values().filter(func(anotacao) { 
      anotacao.textoId == textoId and (anotacao.usuarioId == usuarioId or AccessControl.isAdmin(accessControlState, caller))
    }).toArray();
  };

  // Textos de exemplo - accessible to everyone
  public query ({ caller }) func getTextosExemplo() : async [Texto] {
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
};
