import React, { useCallback, useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Modal, Pressable, ScrollView, } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect,useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function ProfessorHomeScreen() {
  const navigation = useNavigation();
  const { auth } = useAuth();
  

  const [vinculos, setVinculos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [frequencia, setFrequencia] = useState([]);
  const [vinculoSelecionado, setVinculoSelecionado] = useState(null);
  const [faltantes, setFaltantes] = useState(new Set());
  const [carregando, setCarregando] = useState(false);

  const [tela, setTela] = useState("turmas");
  const [chamadas, setChamadas] = useState([]);
  const [chamadaDetalhe, setChamadaDetalhe] = useState(null);

  const [dataSelecionada, setDataSelecionada] = useState(() => dataDeHoje());
  const [mesCalendario, setMesCalendario] = useState(() => new Date());
  const [editandoChamada, setEditandoChamada] = useState(false);
  const [dataEditada, setDataEditada] = useState("");
  const [seletorDataVisivel, setSeletorDataVisivel] = useState(false);
  const [modoSeletor, setModoSeletor] = useState("chamada");

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [avaliacaoDetalhe, setAvaliacaoDetalhe] = useState(null);
  const [notasEdicao, setNotasEdicao] = useState({});

  const [tituloAvaliacao, setTituloAvaliacao] = useState("");
  const [tipoAvaliacao, setTipoAvaliacao] = useState("Prova");
  const [bimestreAvaliacao, setBimestreAvaliacao] = useState("1");
  const [dataAvaliacao, setDataAvaliacao] = useState(() => dataDeHoje());
  const [valorMaximoAvaliacao, setValorMaximoAvaliacao] = useState("10");

  useEffect(() => {
  const cancelarInscricao = navigation.addListener("tabPress", () => {
    setTela("turmas");
    setVinculoSelecionado(null);
    setAlunos([]);
    setFrequencia([]);
    setFaltantes(new Set());
    setChamadaDetalhe(null);
    setEditandoChamada(false);
    setSeletorDataVisivel(false);
  });

  return cancelarInscricao;
}, [navigation]);

  function dataDeHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  function formatarData(data) {
    if (!data) return "";

    const partes = String(data).slice(0, 10).split("-");

    if (partes.length !== 3) return data;

    const [ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
  }

  async function lerResposta(resposta) {
    const texto = await resposta.text();

    try {
      return texto ? JSON.parse(texto) : {};
    } catch {
      throw new Error(
        `A API respondeu em formato inesperado (HTTP ${resposta.status}).`,
      );
    }
  }

  const carregarVinculos = useCallback(async () => {
    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/professores/minhas-vinculos`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar suas turmas.");
      }

      const lista = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.vinculos)
          ? dados.vinculos
          : [];

      setVinculos(
        lista.filter(
          (item) => item.turma_id != null && item.disciplina_id != null,
        ),
      );
    } catch (erro) {
      Alert.alert("Erro", erro.message);
    } finally {
      setCarregando(false);
    }
  }, [auth?.token]);

  useFocusEffect(
    useCallback(() => {
      carregarVinculos();
    }, [carregarVinculos]),
  );

  async function abrirVinculo(vinculo) {
    try {
      const hoje = dataDeHoje();

      setDataSelecionada(hoje);
      setMesCalendario(new Date(`${hoje}T00:00:00`));
      setSeletorDataVisivel(false);
      setCarregando(true);
      setVinculoSelecionado(vinculo);
      setAlunos([]);
      setFrequencia([]);
      setFaltantes(new Set());

      const resposta = await fetch(
        `${API_URL}/alunos/turma/${vinculo.turma_id}`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar os alunos.");
      }

      setAlunos(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      Alert.alert("Erro", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function abrirFrequencia() {
    if (!vinculoSelecionado) {
      Alert.alert("Atenção", "Selecione uma turma e disciplina primeiro.");
      return;
    }

    try {
      setCarregando(true);

      const turmaId = encodeURIComponent(vinculoSelecionado.turma_id);
      const disciplinaId = encodeURIComponent(
        vinculoSelecionado.disciplina_id,
      );

      const resposta = await fetch(
        `${API_URL}/professores/frequencia?turma_id=${turmaId}&disciplina_id=${disciplinaId}`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível carregar a frequência.",
        );
      }

      const lista = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.frequencia)
          ? dados.frequencia
          : [];

      setFrequencia(lista);
      setTela("frequencia");
    } catch (erro) {
      Alert.alert("Erro ao consultar frequência", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function voltarDaFrequencia() {
    setTela("turmas");
  }

  async function abrirHistorico() {
    try {
      setCarregando(true);

      const resposta = await fetch(`${API_URL}/professores/chamadas`, {
        headers: {
          Authorization: `Bearer ${auth?.token}`,
          "Content-Type": "application/json",
        },
      });

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar o histórico.");
      }

      const lista = Array.isArray(dados) ? dados : [];
      setChamadas(lista);

      const primeiraData = lista[0]?.data_aula
        ? String(lista[0].data_aula).slice(0, 10)
        : dataDeHoje();

      setDataSelecionada(primeiraData);
      setMesCalendario(new Date(`${primeiraData}T00:00:00`));
      setTela("historico");
    } catch (erro) {
      Alert.alert("Erro", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function abrirDetalheChamada(chamadaId) {
    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/professores/chamadas/${chamadaId}`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível abrir esta chamada.");
      }

      setChamadaDetalhe(dados);
      setDataEditada(String(dados.chamada.data_aula).slice(0, 10));
      setEditandoChamada(false);
      setTela("detalhe");
    } catch (erro) {
      Alert.alert("Erro", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function alternarFalta(alunoId) {
    setFaltantes((atuais) => {
      const atualizados = new Set(atuais);

      if (atualizados.has(alunoId)) {
        atualizados.delete(alunoId);
      } else {
        atualizados.add(alunoId);
      }

      return atualizados;
    });
  }

  function alternarMesCalendario(diferenca) {
    const novoMes = new Date(
      mesCalendario.getFullYear(),
      mesCalendario.getMonth() + diferenca,
      1,
    );

    const ano = novoMes.getFullYear();
    const mes = String(novoMes.getMonth() + 1).padStart(2, "0");

    setMesCalendario(novoMes);
    setDataSelecionada(`${ano}-${mes}-01`);
  }

  function selecionarDiaCalendario(dia) {
    const data = new Date(
      mesCalendario.getFullYear(),
      mesCalendario.getMonth(),
      dia,
    );

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const diaFormatado = String(data.getDate()).padStart(2, "0");

    setDataSelecionada(`${ano}-${mes}-${diaFormatado}`);
  }

  function alternarMesSeletor(diferenca) {
    setMesCalendario((mesAtual) =>
      new Date(
        mesAtual.getFullYear(),
        mesAtual.getMonth() + diferenca,
        1,
      ),
    );
  }

  function selecionarDataChamada(dia) {
    const data = new Date(
      mesCalendario.getFullYear(),
      mesCalendario.getMonth(),
      dia,
    );

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const diaFormatado = String(data.getDate()).padStart(2, "0");

    const dataISO = `${ano}-${mes}-${diaFormatado}`;

    if (modoSeletor === "avaliacao") {
      setDataAvaliacao(dataISO);
    } else {
      setDataSelecionada(dataISO);
    }
    setSeletorDataVisivel(false);
  }

  function alternarFaltaNoHistorico(alunoId) {
    setChamadaDetalhe((atual) => ({
      ...atual,
      alunos: atual.alunos.map((aluno) =>
        Number(aluno.aluno_id) === Number(alunoId)
          ? { ...aluno, presente: !aluno.presente }
          : aluno,
      ),
    }));
  }

  function cancelarEdicaoChamada() {
    if (chamadaDetalhe?.chamada?.data_aula) {
      setDataEditada(String(chamadaDetalhe.chamada.data_aula).slice(0, 10));
    }

    setEditandoChamada(false);
  }

  function confirmarSalvarEdicao() {
    Alert.alert(
      "Salvar alterações?",
      "A data e as presenças desta chamada serão atualizadas.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salvar", onPress: salvarEdicaoChamada },
      ],
    );
  }

  async function salvarEdicaoChamada() {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataEditada);

    if (!partes) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD.");
      return;
    }

    const ano = Number(partes[1]);
    const mes = Number(partes[2]);
    const dia = Number(partes[3]);
    const dataVerificada = new Date(ano, mes - 1, dia);

    if (
      dataVerificada.getFullYear() !== ano ||
      dataVerificada.getMonth() !== mes - 1 ||
      dataVerificada.getDate() !== dia
    ) {
      Alert.alert(
        "Data inválida",
        "Informe uma data real no formato AAAA-MM-DD.",
      );
      return;
    }

    try {
      setCarregando(true);

      const alunosAtualizados = (chamadaDetalhe.alunos || []).map((aluno) => ({
        ...aluno,
        presente: Boolean(aluno.presente),
      }));

      const chamadaId = chamadaDetalhe.chamada.chamada_id;

      const resposta = await fetch(
        `${API_URL}/professores/chamadas/${chamadaId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data_aula: dataEditada,
            alunos: alunosAtualizados.map((aluno) => ({
              aluno_id: Number(aluno.aluno_id),
              presente: aluno.presente,
            })),
          }),
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Não foi possível atualizar a chamada.",
        );
      }

      const presentes = alunosAtualizados.filter(
        (aluno) => aluno.presente,
      ).length;
      const faltas = alunosAtualizados.length - presentes;

      setChamadaDetalhe((atual) => ({
        ...atual,
        chamada: { ...atual.chamada, data_aula: dataEditada },
        alunos: alunosAtualizados,
      }));

      setChamadas((atuais) =>
        atuais.map((chamada) =>
          Number(chamada.chamada_id) === Number(chamadaId)
            ? { ...chamada, data_aula: dataEditada, presentes, faltas }
            : chamada,
        ),
      );

      setDataSelecionada(dataEditada);
      setMesCalendario(new Date(`${dataEditada}T00:00:00`));
      setEditandoChamada(false);
      Alert.alert("Pronto", "A chamada foi atualizada com sucesso.");
    } catch (erro) {
      Alert.alert("Não foi possível atualizar", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function voltarTurmas() {
    setVinculoSelecionado(null);
    setAlunos([]);
    setFrequencia([]);
    setFaltantes(new Set());
    setChamadaDetalhe(null);
    setEditandoChamada(false);
    setTela("turmas");
  }

  function voltarHistorico() {
    setChamadaDetalhe(null);
    setEditandoChamada(false);
    setTela("historico");
  }

  async function registrarChamada() {
    if (alunos.length === 0) {
      Alert.alert("Atenção", "Esta turma não possui alunos para registrar.");
      return;
    }

    try {
      setCarregando(true);

      const corpo = {
        turma_id: Number(vinculoSelecionado.turma_id),
        disciplina_id: Number(vinculoSelecionado.disciplina_id),
        data_aula: dataSelecionada,
        alunos: alunos.map((aluno) => ({
          aluno_id: Number(aluno.id),
          presente: !faltantes.has(aluno.id),
        })),
      };

      const resposta = await fetch(`${API_URL}/professores/chamadas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corpo),
      });

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível registrar a chamada.");
      }

      voltarTurmas();
      Alert.alert("Pronto", "A chamada foi registrada com sucesso.");
      await carregarVinculos();
    } catch (erro) {
      Alert.alert("Não foi possível registrar", erro.message);
    } finally {
      setCarregando(false);
    }
  }
  async function abrirAvaliacoes() {
    if (!vinculoSelecionado) {
      Alert.alert("Atenção", "Selecione uma turma e disciplina primeiro.");
      return;
    }

    try {
      setCarregando(true);

      const turmaId = encodeURIComponent(vinculoSelecionado.turma_id);
      const disciplinaId = encodeURIComponent(
        vinculoSelecionado.disciplina_id,
      );

      const resposta = await fetch(
        `${API_URL}/professores/avaliacoes?turma_id=${turmaId}&disciplina_id=${disciplinaId}`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar as avaliações.");
      }

      const lista = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.avaliacoes)
          ? dados.avaliacoes
          : [];

      setAvaliacoes(lista);
      setTela("avaliacoes");
    } catch (erro) {
      Alert.alert("Erro ao carregar avaliações", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function iniciarCriacaoAvaliacao() {
    setBimestreAvaliacao("1");
    setTituloAvaliacao("");
    setTipoAvaliacao("Prova");
    setDataAvaliacao(dataDeHoje());
    setValorMaximoAvaliacao("10");
    setTela("avaliacoesCriar");
  }

  async function criarAvaliacao() {
    const titulo = tituloAvaliacao.trim();
    const tipo = tipoAvaliacao.trim();
    const valorTexto = valorMaximoAvaliacao.trim().replace(",", ".");
    const partesData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataAvaliacao);

    const quantidadeLetras = titulo.match(/[A-Za-zÀ-ÿ]/g)?.length ?? 0;
    const nomeValido = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-.,:ºª]*$/.test(titulo);

    if (quantidadeLetras < 3 || titulo.length > 120 || !nomeValido) {
      Alert.alert(
        "Nome da avaliação",
        "Digite um nome com pelo menos 3 letras e sem números.",
      );
      return;
    }

    if (!tipo || tipo.length > 40) {
      Alert.alert("Tipo inválido", "Informe o tipo com até 40 caracteres.");
      return;
    }

    if (!partesData) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD.");
      return;
    }

    const ano = Number(partesData[1]);
    const mes = Number(partesData[2]);
    const dia = Number(partesData[3]);
    const dataVerificada = new Date(ano, mes - 1, dia);

    if (
      dataVerificada.getFullYear() !== ano ||
      dataVerificada.getMonth() !== mes - 1 ||
      dataVerificada.getDate() !== dia
    ) {
      Alert.alert("Data inválida", "Informe uma data real no formato AAAA-MM-DD.");
      return;
    }

    if (!/^\d+(?:\.\d{1,2})?$/.test(valorTexto)) {
      Alert.alert(
        "Valor máximo inválido",
        "Informe um número positivo com até duas casas decimais.",
      );
      return;
    }

    const valorMaximo = Number(valorTexto);

    if (!Number.isFinite(valorMaximo) || valorMaximo <= 0) {
      Alert.alert("Valor máximo inválido", "O valor deve ser maior que zero.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(`${API_URL}/professores/avaliacoes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turma_id: Number(vinculoSelecionado.turma_id),
          disciplina_id: Number(vinculoSelecionado.disciplina_id),
          bimestre: Number(bimestreAvaliacao),
          titulo,
          tipo,
          data_avaliacao: dataAvaliacao,
          valor_maximo: valorMaximo,
        }),
      });

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível criar a avaliação.");
      }

      Alert.alert("Pronto", "A avaliação foi criada com sucesso.");
      await abrirAvaliacoes();
    } catch (erro) {
      Alert.alert("Não foi possível criar a avaliação", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function abrirDetalheAvaliacao(avaliacaoId) {
    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/professores/avaliacoes/${encodeURIComponent(avaliacaoId)}`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível abrir a avaliação.");
      }

      setAvaliacaoDetalhe(dados);

      const notasIniciais = {};
      (dados.alunos || []).forEach((aluno) => {
        notasIniciais[String(aluno.aluno_id)] =
          aluno.nota == null ? "" : String(aluno.nota);
      });

      setNotasEdicao(notasIniciais);
      setTela("avaliacaoDetalhe");
    } catch (erro) {
      Alert.alert("Erro ao abrir avaliação", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  async function salvarNotasAvaliacao() {
    if (!avaliacaoDetalhe?.avaliacao) {
      Alert.alert("Erro", "Não foi possível identificar esta avaliação.");
      return;
    }

    const valorMaximo = Number(avaliacaoDetalhe.avaliacao.valor_maximo);
    const alunos = (avaliacaoDetalhe.alunos || []).map((aluno) => {
      const texto = String(notasEdicao[String(aluno.aluno_id)] ?? "")
        .trim()
        .replace(",", ".");

      if (texto === "") {
        return { aluno_id: Number(aluno.aluno_id), nota: null };
      }

      if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
        throw new Error(
          `A nota de ${aluno.nome_completo} deve ter até duas casas decimais.`,
        );
      }

      const nota = Number(texto);

      if (!Number.isFinite(nota) || nota < 0) {
        throw new Error(`A nota de ${aluno.nome_completo} não pode ser negativa.`);
      }

      if (nota > valorMaximo) {
        throw new Error(
          `A nota de ${aluno.nome_completo} não pode passar de ${valorMaximo}.`,
        );
      }

      return { aluno_id: Number(aluno.aluno_id), nota };
    });

    try {
      setCarregando(true);

      const avaliacaoId = avaliacaoDetalhe.avaliacao.avaliacao_id;
      const resposta = await fetch(
        `${API_URL}/professores/avaliacoes/${encodeURIComponent(avaliacaoId)}/notas`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ alunos }),
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível salvar as notas.");
      }

      const respostaDetalhe = await fetch(
        `${API_URL}/professores/avaliacoes/${encodeURIComponent(avaliacaoId)}`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const detalheAtualizado = await lerResposta(respostaDetalhe);

      if (!respostaDetalhe.ok) {
        throw new Error(
          detalheAtualizado.erro || "As notas foram salvas, mas não foi possível atualizar a tela.",
        );
      }

      setAvaliacaoDetalhe(detalheAtualizado);

      const notasAtualizadas = {};
      (detalheAtualizado.alunos || []).forEach((aluno) => {
        notasAtualizadas[String(aluno.aluno_id)] =
          aluno.nota == null ? "" : String(aluno.nota);
      });

      setNotasEdicao(notasAtualizadas);
      Alert.alert("Pronto", "As notas foram salvas com sucesso.");
    } catch (erro) {
      Alert.alert("Não foi possível salvar as notas", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  function alterarNota(alunoId, texto, valorMaximo) {

    if (texto !== "" && !/^\d*[.,]?\d{0,2}$/.test(texto)) {
      Alert.alert("Nota inválida", "Digite apenas números, com até duas casas decimais.");
      return;
    }
    const nota = Number(texto.replace(",", "."));

    if (
      texto.trim() !== "" &&
      Number.isFinite(nota) &&
      nota > Number(valorMaximo)
    ) {
      Alert.alert(
        "Nota acima do máximo",
        `A nota não pode ultrapassar ${valorMaximo}.`,
      );
      return;
    }

    setNotasEdicao((atuais) => ({
      ...atuais,
      [String(alunoId)]: texto,
    }));
  }
  function confirmarExclusaoAvaliacao() {
    Alert.alert(
      "Apagar avaliação?",
      "A avaliação e todas as notas lançadas nela serão apagadas. Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: excluirAvaliacao,
        },
      ],
    );
  }

  async function excluirAvaliacao() {
    const avaliacaoId = avaliacaoDetalhe?.avaliacao?.avaliacao_id;

    if (!avaliacaoId) {
      Alert.alert("Erro", "Não foi possível identificar a avaliação.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/professores/avaliacoes/${encodeURIComponent(avaliacaoId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível apagar a avaliação.");
      }

      setAvaliacaoDetalhe(null);
      await abrirAvaliacoes();

      Alert.alert("Pronto", "A avaliação foi apagada.");
    } catch (erro) {
      Alert.alert("Não foi possível apagar", erro.message);
    } finally {
      setCarregando(false);
    }
  }

  const tiposAvaliacao = ["Prova", "Trabalho", "Atividade", "Seminário", "Outros"];

  function abrirCalendarioAvaliacao() {
    setMesCalendario(new Date(`${dataAvaliacao}T00:00:00`));
    setModoSeletor("avaliacao");
    setSeletorDataVisivel(true);
  }

  function abrirCalendarioChamada() {
    setModoSeletor("chamada");
    setSeletorDataVisivel(true);
  }

  function alterarValorMaximo(texto) {
    if (texto !== "" && !/^\d*[.,]?\d{0,2}$/.test(texto)) {
      Alert.alert(
        "Valor inválido",
        "Digite apenas números, com até duas casas decimais.",
      );
      return;
    }
    setValorMaximoAvaliacao(texto);
  }

  const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const anoCalendario = mesCalendario.getFullYear();
  const mesCalendarioNumero = mesCalendario.getMonth();
  const primeiroDiaSemana = new Date(
    anoCalendario,
    mesCalendarioNumero,
    1,
  ).getDay();
  const totalDiasMes = new Date(
    anoCalendario,
    mesCalendarioNumero + 1,
    0,
  ).getDate();

  const celulasCalendario = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: totalDiasMes }, (_, indice) => indice + 1),
  ];

  const datasComChamada = new Set(
    chamadas.map((chamada) => String(chamada.data_aula).slice(0, 10)),
  );

  const chamadasDoDia = chamadas.filter(
    (chamada) =>
      String(chamada.data_aula).slice(0, 10) === dataSelecionada,
  );

  const totalFrequenciaBaixa = frequencia.filter(
    (item) => item.situacao === "ABAIXO_DO_MINIMO",
  ).length;

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.carregando}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {tela === "avaliacaoDetalhe" && avaliacaoDetalhe ? (
        <>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => setTela("avaliacoes")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Voltar às avaliações</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>
            {avaliacaoDetalhe.avaliacao.titulo}
          </Text>
          <Text style={styles.subtitulo}>
            {avaliacaoDetalhe.avaliacao.tipo} —{" "}
            {formatarData(avaliacaoDetalhe.avaliacao.data_avaliacao)}
          </Text>
          <Text style={styles.subtitulo}>
            Nota máxima: {avaliacaoDetalhe.avaliacao.valor_maximo}
          </Text>

          <FlatList
            data={avaliacaoDetalhe.alunos || []}
            keyExtractor={(item) => String(item.aluno_id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vazio}>Não há alunos nesta avaliação.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.cardNota}>
                <View style={styles.infoNota}>
                  <Text style={styles.nome}>{item.nome_completo}</Text>
                  <Text style={styles.detalhe}>Matrícula: {item.matricula}</Text>
                </View>

                <TextInput
                  style={styles.campoNota}
                  value={notasEdicao[String(item.aluno_id)] ?? ""}
                  onChangeText={(texto) =>
                    alterarNota(
                      item.aluno_id,
                      texto,
                      avaliacaoDetalhe.avaliacao.valor_maximo,
                    )
                  }
                  placeholder="—"
                  keyboardType="decimal-pad"
                  maxLength={7}
                />
              </View>
            )}
          />

          <TouchableOpacity
            style={styles.botaoRegistrar}
            onPress={salvarNotasAvaliacao}
            disabled={!avaliacaoDetalhe.alunos?.length}
          >
            <Text style={styles.textoBotaoRegistrar}>Salvar notas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botaoApagarAvaliacao}
            onPress={confirmarExclusaoAvaliacao}
            activeOpacity={0.75}
          >
            <Ionicons name="trash-outline" size={19} color="#FFFFFF" />
            <Text style={styles.textoBotaoApagarAvaliacao}>
              Apagar avaliação
            </Text>
          </TouchableOpacity>
        </>
      ) : tela === "avaliacoesCriar" ? (
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => setTela("avaliacoes")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Voltar às avaliações</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>Nova avaliação</Text>
          <Text style={styles.subtitulo}>
            {vinculoSelecionado?.ano}º Ano {vinculoSelecionado?.letra} —{" "}
            {vinculoSelecionado?.disciplina}
          </Text>

          <Text style={styles.rotuloCampo}>Bimestre</Text>

          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            {["1", "2", "3", "4"].map((numero) => {
              const selecionado = bimestreAvaliacao === numero;

              return (
                <TouchableOpacity
                  key={numero}
                  onPress={() => setBimestreAvaliacao(numero)}
                  activeOpacity={0.75}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: selecionado ? colors.primary : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Text
                    style={{
                      color: selecionado ? "#FFFFFF" : colors.primary,
                      fontWeight: "bold",
                    }}
                  >
                    {numero}º
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.rotuloCampo}>Nome da atividade</Text>
          <TextInput
            style={styles.campoAvaliacao}
            value={tituloAvaliacao}
            onChangeText={setTituloAvaliacao}
            placeholder="Ex.: Avaliação do capítulo 1"
            maxLength={120}
          />

          <Text style={styles.rotuloCampo}>Tipo</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {tiposAvaliacao.map((opcao) => {
              const selecionado = tipoAvaliacao === opcao;

              return (
                <TouchableOpacity
                  key={opcao}
                  onPress={() => setTipoAvaliacao(opcao)}
                  activeOpacity={0.75}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    backgroundColor: selecionado ? colors.primary : "#FFFFFF",
                  }}
                >
                  <Text style={{ color: selecionado ? "#FFFFFF" : colors.primary, fontWeight: "bold" }}>
                    {opcao}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.rotuloCampo}>Data</Text>
          <TouchableOpacity
            style={styles.botaoEscolherData}
            onPress={abrirCalendarioAvaliacao}
            activeOpacity={0.75}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            <Text style={styles.textoEscolherData}>{formatarData(dataAvaliacao)}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.primary} />
          </TouchableOpacity>

          <Text style={styles.rotuloCampo}>Nota máxima</Text>
          <TextInput
            style={styles.campoAvaliacao}
            value={valorMaximoAvaliacao}
            onChangeText={alterarValorMaximo}
            placeholder="Ex.: 10"
            keyboardType="decimal-pad"
            maxLength={8}
          />

          <TouchableOpacity
            style={styles.botaoRegistrar}
            onPress={criarAvaliacao}
          >
            <Text style={styles.textoBotaoRegistrar}>Criar avaliação</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : tela === "avaliacoes" && vinculoSelecionado ? (
        <>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => setTela("turmas")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Voltar à turma</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>Avaliações</Text>
          <Text style={styles.subtitulo}>
            {vinculoSelecionado.ano}º Ano {vinculoSelecionado.letra} —{" "}
            {vinculoSelecionado.disciplina}
          </Text>

          <TouchableOpacity
            style={styles.botaoRegistrar}
            onPress={iniciarCriacaoAvaliacao}
          >
            <Text style={styles.textoBotaoRegistrar}>Criar avaliação</Text>
          </TouchableOpacity>

          <FlatList
            data={avaliacoes}
            keyExtractor={(item) =>
              String(item.avaliacao_id ?? item.id)
            }
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Ainda não há avaliações para esta turma e disciplina.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cardAvaliacao}
                onPress={() =>
                  abrirDetalheAvaliacao(item.avaliacao_id ?? item.id)
                }
                activeOpacity={0.75}
              >
                <View style={styles.infoNota}>
                  <Text style={styles.nome}>{item.titulo}</Text>
                  <Text style={styles.detalhe}>
                    {item.tipo} — {formatarData(item.data_avaliacao)}
                  </Text>
                  <Text style={styles.detalhe}>
                    Notas lançadas: {item.notas_lancadas ?? 0} de{" "}
                    {item.total_alunos ?? 0}
                  </Text>
                  <Text style={styles.detalhe}>
                    {item.bimestre
                      ? `${item.bimestre}º Bimestre`
                      : "Bimestre não informado"}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          />
        </>
      ) : tela === "detalhe" && chamadaDetalhe ? (
        <>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={voltarHistorico}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Voltar ao histórico</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>
            {chamadaDetalhe.chamada.ano}º Ano{" "}
            {chamadaDetalhe.chamada.letra}
          </Text>

          <Text style={styles.subtitulo}>
            Disciplina: {chamadaDetalhe.chamada.disciplina}
          </Text>

          {editandoChamada ? (
            <TextInput
              style={styles.campoData}
              value={dataEditada}
              onChangeText={setDataEditada}
              placeholder="AAAA-MM-DD"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          ) : (
            <Text style={styles.subtitulo}>
              Data: {formatarData(chamadaDetalhe.chamada.data_aula)}
            </Text>
          )}

          <View style={styles.botoesEdicao}>
            {editandoChamada ? (
              <>
                <TouchableOpacity
                  style={styles.botaoEdicao}
                  onPress={confirmarSalvarEdicao}
                >
                  <Text style={styles.textoBotaoEdicao}>
                    Salvar alterações
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoCancelarEdicao}
                  onPress={cancelarEdicaoChamada}
                >
                  <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.botaoEdicao}
                onPress={() => setEditandoChamada(true)}
              >
                <Text style={styles.textoBotaoEdicao}>Editar chamada</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={chamadaDetalhe.alunos || []}
            keyExtractor={(item) => String(item.aluno_id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Não há alunos nesta chamada.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                disabled={!editandoChamada}
                activeOpacity={0.75}
                onPress={() => alternarFaltaNoHistorico(item.aluno_id)}
                style={[
                  styles.cardAluno,
                  !item.presente && styles.cardFalta,
                ]}
              >
                <View style={styles.info}>
                  <Text style={styles.nome}>{item.nome_completo}</Text>
                  <Text style={styles.detalhe}>
                    Matrícula: {item.matricula}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.status,
                    !item.presente && styles.statusFalta,
                  ]}
                >
                  {item.presente ? "PRESENTE" : "FALTOU"}
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      ) : tela === "frequencia" && vinculoSelecionado ? (
        <>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={voltarDaFrequencia}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Voltar à chamada</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>Frequência da turma</Text>
          <Text style={styles.subtitulo}>
            {vinculoSelecionado.ano}º Ano {vinculoSelecionado.letra} —{" "}
            {vinculoSelecionado.disciplina}
          </Text>

          {frequencia.length > 0 && (
            <View style={styles.resumoFrequencia}>
              <Text style={styles.textoResumoFrequencia}>
                Abaixo do mínimo de 75%: {totalFrequenciaBaixa} de{" "}
                {frequencia.length} alunos
              </Text>
            </View>
          )}

          <FlatList
            data={frequencia}
            keyExtractor={(item) => String(item.aluno_id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Não há dados de frequência para esta turma e disciplina.
              </Text>
            }
            renderItem={({ item }) => {
              const semAulas = Number(item.total_aulas) === 0;
              const abaixoDoMinimo =
                item.situacao === "ABAIXO_DO_MINIMO";

              let textoSituacao = "Dentro do mínimo";
              if (semAulas || item.situacao === "SEM_REGISTROS") {
                textoSituacao = "Sem aulas registradas";
              } else if (abaixoDoMinimo) {
                textoSituacao = "Abaixo do mínimo";
              }

              const percentual =
                item.percentual == null || semAulas
                  ? "—"
                  : `${Number(item.percentual).toFixed(0)}%`;

              return (
                <View
                  style={[
                    styles.cardFrequencia,
                    abaixoDoMinimo && styles.cardFrequenciaBaixa,
                  ]}
                >
                  <View style={styles.infoFrequencia}>
                    <Text style={styles.nome}>{item.nome_completo}</Text>
                    <Text style={styles.detalhe}>
                      Matrícula: {item.matricula}
                    </Text>
                    <Text style={styles.detalhe}>
                      Aulas: {item.total_aulas} | Presenças: {item.presencas} |
                      {" "}Faltas: {item.faltas}
                    </Text>
                  </View>

                  <View style={styles.colunaPercentual}>
                    <Text
                      style={[
                        styles.percentual,
                        abaixoDoMinimo && styles.percentualBaixo,
                      ]}
                    >
                      {percentual}
                    </Text>
                    <Text
                      style={[
                        styles.situacaoFrequencia,
                        abaixoDoMinimo && styles.situacaoFrequenciaBaixa,
                        semAulas && styles.situacaoSemAulas,
                      ]}
                    >
                      {textoSituacao}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        </>
      ) : tela === "historico" ? (
        <>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={() => setTela("turmas")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Minhas turmas</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>Histórico de chamadas</Text>
          <Text style={styles.subtitulo}>
            Selecione uma data para consultar as chamadas.
          </Text>

          <View style={styles.calendario}>
            <View style={styles.cabecalhoCalendario}>
              <TouchableOpacity
                onPress={() => alternarMesCalendario(-1)}
                style={styles.botaoMes}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <Text style={styles.tituloMes}>
                {nomesMeses[mesCalendarioNumero]} {anoCalendario}
              </Text>

              <TouchableOpacity
                onPress={() => alternarMesCalendario(1)}
                style={styles.botaoMes}
              >
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.gradeCalendario}>
              {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, indice) => (
                <Text key={`semana-${indice}`} style={styles.nomeDiaSemana}>
                  {dia}
                </Text>
              ))}
            </View>

            <View style={styles.gradeCalendario}>
              {celulasCalendario.map((dia, indice) => {
                if (dia === null) {
                  return (
                    <View
                      key={`vazio-${indice}`}
                      style={styles.celulaDia}
                    />
                  );
                }

                const dataDia = new Date(
                  anoCalendario,
                  mesCalendarioNumero,
                  dia,
                );
                const ano = dataDia.getFullYear();
                const mes = String(dataDia.getMonth() + 1).padStart(2, "0");
                const diaFormatado = String(dataDia.getDate()).padStart(
                  2,
                  "0",
                );
                const dataISO = `${ano}-${mes}-${diaFormatado}`;
                const selecionado = dataISO === dataSelecionada;
                const temChamada = datasComChamada.has(dataISO);

                return (
                  <TouchableOpacity
                    key={dataISO}
                    style={[
                      styles.celulaDia,
                      selecionado && styles.diaSelecionado,
                    ]}
                    onPress={() => selecionarDiaCalendario(dia)}
                  >
                    <Text
                      style={[
                        styles.textoDia,
                        selecionado && styles.textoDiaSelecionado,
                      ]}
                    >
                      {dia}
                    </Text>

                    {temChamada && (
                      <View
                        style={[
                          styles.marcadorChamada,
                          selecionado && styles.marcadorSelecionado,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={styles.subtitulo}>
            Chamadas de {formatarData(dataSelecionada)}
          </Text>

          <FlatList
            data={chamadasDoDia}
            keyExtractor={(item) => String(item.chamada_id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Não há chamadas registradas neste dia.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cardTurma}
                onPress={() => abrirDetalheChamada(item.chamada_id)}
                activeOpacity={0.75}
              >
                <View style={styles.infoSemMargem}>
                  <Text style={styles.nome}>
                    {item.ano}º Ano {item.letra}
                  </Text>
                  <Text style={styles.detalhe}>{item.disciplina}</Text>
                  <Text style={styles.detalhe}>
                    Presentes: {item.presentes} | Faltas: {item.faltas}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          />
        </>
      ) : vinculoSelecionado ? (
        <>
          <TouchableOpacity style={styles.botaoVoltar} onPress={voltarTurmas}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Minhas turmas</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>
            {vinculoSelecionado.ano}º Ano {vinculoSelecionado.letra}
          </Text>

          <Text style={styles.subtitulo}>
            Disciplina: {vinculoSelecionado.disciplina}
          </Text>

          <FlatList
            data={alunos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista}
            ListHeaderComponent={
              <View>
                <Text style={styles.instrucao}>
                  Todos começam como presentes. Toque nos alunos que faltaram.
                </Text>

                <TouchableOpacity
                  style={styles.botaoFrequencia}
                  onPress={abrirFrequencia}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="stats-chart-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.textoBotaoFrequencia}>
                    Consultar frequência da turma
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoAvaliacoes}
                  onPress={abrirAvaliacoes}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="clipboard-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.textoBotaoAvaliacoes}>
                    Avaliações e notas
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoEscolherData}
                  onPress={abrirCalendarioChamada}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <Text style={styles.textoEscolherData}>
                    Data da chamada: {formatarData(dataSelecionada)}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Nenhum aluno cadastrado nesta turma.
              </Text>
            }
            renderItem={({ item }) => {
              const faltou = faltantes.has(item.id);

              return (
                <TouchableOpacity
                  style={[styles.cardAluno, faltou && styles.cardFalta]}
                  onPress={() => alternarFalta(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.info}>
                    <Text style={styles.nome}>{item.nome_completo}</Text>
                    <Text style={styles.detalhe}>
                      Matrícula: {item.matricula}
                    </Text>
                  </View>

                  <Text style={[styles.status, faltou && styles.statusFalta]}>
                    {faltou ? "FALTOU" : "PRESENTE"}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              <TouchableOpacity
                style={[
                  styles.botaoRegistrar,
                  alunos.length === 0 && styles.botaoDesativado,
                ]}
                onPress={registrarChamada}
                disabled={alunos.length === 0}
              >
                <Text style={styles.textoBotaoRegistrar}>
                  Registrar chamada
                </Text>
              </TouchableOpacity>
            }
          />
        </>
      ) : (
        <>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Minhas turmas</Text>
            <Text style={styles.subtitulo}>
              Escolha uma turma para iniciar a chamada ou consulte o histórico.
            </Text>

            <TouchableOpacity
              style={styles.botaoHistorico}
              onPress={abrirHistorico}
              activeOpacity={0.75}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.textoBotaoHistorico}>
                Ver histórico de chamadas
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={vinculos}
            keyExtractor={(item) =>
              `${item.turma_id}-${item.disciplina_id}`
            }
            contentContainerStyle={styles.lista}
            refreshing={carregando}
            onRefresh={carregarVinculos}
            ListEmptyComponent={
              <View style={styles.vazioContainer}>
                <Ionicons
                  name="school-outline"
                  size={48}
                  color={colors.primary}
                />
                <Text style={styles.vazio}>
                  Nenhuma turma vinculada ao seu perfil.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cardTurma}
                onPress={() => abrirVinculo(item)}
                activeOpacity={0.75}
              >
                <View style={styles.iconeTurma}>
                  <Ionicons
                    name="people"
                    size={28}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.info}>
                  <Text style={styles.nome}>
                    {item.ano}º Ano {item.letra}
                  </Text>
                  <Text style={styles.detalhe}>{item.disciplina}</Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            )}
          />
        </>
      )}

      <Modal
        visible={seletorDataVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setSeletorDataVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSeletorDataVisivel(false)}
          />

          <View style={styles.calendarioModal}>
            <Text style={styles.tituloModal}>
              {modoSeletor === "avaliacao"
                ? "Escolha a data da avaliação"
                : "Escolha a data da chamada"}
            </Text>

            <View style={styles.cabecalhoCalendario}>
              <TouchableOpacity
                onPress={() => alternarMesSeletor(-1)}
                style={styles.botaoMes}
              >
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <Text style={styles.tituloMes}>
                {nomesMeses[mesCalendarioNumero]} {anoCalendario}
              </Text>

              <TouchableOpacity
                onPress={() => alternarMesSeletor(1)}
                style={styles.botaoMes}
              >
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.gradeCalendario}>
              {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, indice) => (
                <Text
                  key={`modal-semana-${indice}`}
                  style={styles.nomeDiaSemanaCompacto}
                >
                  {dia}
                </Text>
              ))}
            </View>

            <View style={styles.gradeCalendario}>
              {celulasCalendario.map((dia, indice) => {
                if (dia === null) {
                  return (
                    <View
                      key={`modal-vazio-${indice}`}
                      style={styles.celulaDiaCompacta}
                    />
                  );
                }

                const dataDia = new Date(
                  anoCalendario,
                  mesCalendarioNumero,
                  dia,
                );
                const ano = dataDia.getFullYear();
                const mes = String(dataDia.getMonth() + 1).padStart(2, "0");
                const diaFormatado = String(dataDia.getDate()).padStart(
                  2,
                  "0",
                );
                const dataISO = `${ano}-${mes}-${diaFormatado}`;
                const selecionado = dataISO === (modoSeletor === "avaliacao" ? dataAvaliacao : dataSelecionada);
                return (
                  <TouchableOpacity
                    key={`modal-${dataISO}`}
                    style={[
                      styles.celulaDiaCompacta,
                      selecionado && styles.diaSelecionado,
                    ]}
                    onPress={() => selecionarDataChamada(dia)}
                  >
                    <Text
                      style={[
                        styles.textoDia,
                        selecionado && styles.textoDiaSelecionado,
                      ]}
                    >
                      {dia}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.botaoFecharCalendario}
              onPress={() => setSeletorDataVisivel(false)}
            >
              <Text style={styles.textoBotaoFecharCalendario}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  centralizado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  carregando: {
    marginTop: 10,
    color: colors.text,
  },
  cabecalho: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  instrucao: {
    color: colors.text,
    marginBottom: 12,
  },
  lista: {
    paddingBottom: 20,
  },
  cardTurma: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card || "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardAluno: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card || "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  cardFalta: {
    borderWidth: 1,
    borderColor: "#D9534F",
  },
  iconeTurma: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8F0FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  infoSemMargem: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  detalhe: {
    fontSize: 13,
    color: colors.text,
    marginTop: 5,
  },
  status: {
    color: "#238636",
    fontWeight: "bold",
    fontSize: 12,
  },
  statusFalta: {
    color: "#D9534F",
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  textoVoltar: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  botaoHistorico: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.card || "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    elevation: 2,
  },
  textoBotaoHistorico: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  botaoFrequencia: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.card || "#FFFFFF",
    padding: 13,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  textoBotaoFrequencia: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  resumoFrequencia: {
    backgroundColor: colors.card || "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  textoResumoFrequencia: {
    color: colors.text,
    fontWeight: "bold",
  },
  cardFrequencia: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card || "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  cardFrequenciaBaixa: {
    borderWidth: 1,
    borderColor: "#D9534F",
  },
  infoFrequencia: {
    flex: 1,
    marginRight: 8,
  },
  colunaPercentual: {
    alignItems: "flex-end",
    maxWidth: 125,
  },
  percentual: {
    color: "#238636",
    fontSize: 20,
    fontWeight: "bold",
  },
  percentualBaixo: {
    color: "#D9534F",
  },
  situacaoFrequencia: {
    color: "#238636",
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "right",
    marginTop: 3,
  },
  situacaoFrequenciaBaixa: {
    color: "#D9534F",
  },
  situacaoSemAulas: {
    color: colors.text,
  },
  botaoRegistrar: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  botaoDesativado: {
    opacity: 0.5,
  },
  textoBotaoRegistrar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  botaoEscolherData: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.card || "#FFFFFF",
    padding: 13,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  textoEscolherData: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "bold",
  },
  fundoModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  calendarioModal: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    elevation: 8,
  },
  tituloModal: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  nomeDiaSemanaCompacto: {
    width: "14.2857%",
    textAlign: "center",
    color: colors.text,
    fontWeight: "bold",
    paddingVertical: 5,
  },
  celulaDiaCompacta: {
    width: "14.2857%",
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  botaoFecharCalendario: {
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
  },
  textoBotaoFecharCalendario: {
    color: colors.primary,
    fontWeight: "bold",
  },
  vazioContainer: {
    alignItems: "center",
    marginTop: 50,
    padding: 20,
  },
  vazio: {
    textAlign: "center",
    marginTop: 12,
    color: colors.text,
    fontSize: 15,
  },
  calendario: {
    backgroundColor: colors.card || "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  cabecalhoCalendario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  botaoMes: {
    padding: 6,
  },
  tituloMes: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  gradeCalendario: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  nomeDiaSemana: {
    width: "14.2857%",
    textAlign: "center",
    color: colors.text,
    fontWeight: "bold",
    paddingVertical: 8,
  },
  celulaDia: {
    width: "14.2857%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  diaSelecionado: {
    backgroundColor: colors.primary,
  },
  textoDia: {
    color: colors.text,
    fontSize: 14,
  },
  textoDiaSelecionado: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  marcadorChamada: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    position: "absolute",
    bottom: 4,
  },
  marcadorSelecionado: {
    backgroundColor: "#FFFFFF",
  },
  campoData: {
    backgroundColor: colors.card || "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    color: colors.text,
  },
  botoesEdicao: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  botaoEdicao: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  textoBotaoEdicao: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  botaoCancelarEdicao: {
    backgroundColor: colors.card || "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  textoBotaoCancelar: {
    color: colors.primary,
    fontWeight: "bold",
  },
  botaoAvaliacoes: {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.card || "#FFFFFF",
    padding: 13,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  textoBotaoAvaliacoes: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  cardAvaliacao: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card || "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  cardNota: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card || "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  infoNota: {
    flex: 1,
    marginRight: 12,
  },
  campoNota: {
    width: 76,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    textAlign: "center",
  },
  rotuloCampo: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },
  campoAvaliacao: {
    backgroundColor: colors.card || "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    color: colors.text,
  },
  botaoApagarAvaliacao: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#D9534F",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  textoBotaoApagarAvaliacao: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
});