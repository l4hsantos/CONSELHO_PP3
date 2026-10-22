import React, { useCallback, useState } from "react";
import {View,Text,FlatList,TouchableOpacity,StyleSheet,ActivityIndicator,Alert,} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function ProfessorHomeScreen() {
  const { auth } = useAuth();

  const [vinculos, setVinculos] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [vinculoSelecionado, setVinculoSelecionado] = useState(null);
  const [faltantes, setFaltantes] = useState(new Set());
  const [carregando, setCarregando] = useState(false);

  const [tela, setTela] = useState("turmas");
  const [chamadas, setChamadas] = useState([]);
  const [chamadaDetalhe, setChamadaDetalhe] = useState(null);

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

      const dados = await resposta.json();

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
      setCarregando(true);
      setVinculoSelecionado(vinculo);
      setAlunos([]);
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

      const dados = await resposta.json();

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

  async function abrirHistorico() {
    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/professores/chamadas`,
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar o histórico.");
      }

      setChamadas(Array.isArray(dados) ? dados : []);
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

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível abrir esta chamada.");
      }

      setChamadaDetalhe(dados);
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

  function voltarTurmas() {
    setVinculoSelecionado(null);
    setAlunos([]);
    setFaltantes(new Set());
    setChamadaDetalhe(null);
    setTela("turmas");
  }

  function voltarHistorico() {
    setChamadaDetalhe(null);
    setTela("historico");
  }

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
        data_aula: dataDeHoje(),
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

      const dados = await resposta.json();

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
      {tela === "detalhe" && chamadaDetalhe ? (
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

          <Text style={styles.subtitulo}>
            Data: {formatarData(chamadaDetalhe.chamada.data_aula)}
          </Text>

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
              <View
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
              </View>
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

          <Text style={styles.instrucao}>
            Todos começam como presentes. Toque nos alunos que faltaram.
          </Text>

          <FlatList
            data={alunos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista}
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
          />

          <TouchableOpacity
            style={[
              styles.botaoRegistrar,
              alunos.length === 0 && styles.botaoDesativado,
            ]}
            onPress={registrarChamada}
            disabled={alunos.length === 0}
          >
            <Text style={styles.textoBotaoRegistrar}>Registrar chamada</Text>
          </TouchableOpacity>
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
            Toque em uma chamada para ver os alunos.
          </Text>

          <FlatList
            data={chamadas}
            keyExtractor={(item) => String(item.chamada_id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Você ainda não registrou chamadas.
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
                    Data: {formatarData(item.data_aula)}
                  </Text>
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
                  <Ionicons name="people" size={28} color={colors.primary} />
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
});