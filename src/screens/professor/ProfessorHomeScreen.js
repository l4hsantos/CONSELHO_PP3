import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { colors } from "../../theme/colors";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function ProfessorHomeScreen() {
  const { auth } = useAuth();

  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const headers = {
    Authorization: `Bearer ${auth?.token}`,
    "Content-Type": "application/json",
  };

  const carregarTurmas = useCallback(async () => {
    try {
      setCarregando(true);

      const resposta = await fetch(`${API_URL}/vinculos/turmas/professor`, {
        headers,
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar as turmas.");
      }

      setTurmas(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      Alert.alert("Erro", erro.message);
    } finally {
      setCarregando(false);
    }
  }, [auth?.token]);

  useFocusEffect(
    useCallback(() => {
      carregarTurmas();
    }, [carregarTurmas]),
  );

  async function abrirTurma(turma) {
    try {
      setCarregando(true);
      setTurmaSelecionada(turma);
      setAlunos([]);

      const resposta = await fetch(`${API_URL}/alunos/turma/${turma.id}`, {
        headers,
      });

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

  function voltarTurmas() {
    setTurmaSelecionada(null);
    setAlunos([]);
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={styles.carregando}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {turmaSelecionada ? (
        <>
          <TouchableOpacity style={styles.botaoVoltar} onPress={voltarTurmas}>
            <Ionicons name='arrow-back' size={22} color={colors.primary} />
            <Text style={styles.textoVoltar}>Minhas turmas</Text>
          </TouchableOpacity>

          <Text style={styles.titulo}>
            {turmaSelecionada.ano}º Ano {turmaSelecionada.letra}
          </Text>

          <Text style={styles.subtitulo}>Alunos desta turma</Text>

          <FlatList
            data={alunos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={
              <Text style={styles.vazio}>
                Nenhum aluno cadastrado nesta turma.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.cardAluno}>
                <View style={styles.iconePessoa}>
                  <Ionicons name='person' size={24} color={colors.primary} />
                </View>

                <View style={styles.info}>
                  <Text style={styles.nome}>{item.nome_completo}</Text>

                  <Text style={styles.detalhe}>
                    Matrícula: {item.matricula}
                  </Text>
                </View>
              </View>
            )}
          />
        </>
      ) : (
        <>
          <View style={styles.cabecalho}>
            <Text style={styles.titulo}>Minhas turmas</Text>
            <Text style={styles.subtitulo}>
              Selecione uma turma para visualizar seus alunos.
            </Text>
          </View>

          <FlatList
            data={turmas}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista}
            refreshing={carregando}
            onRefresh={carregarTurmas}
            ListEmptyComponent={
              <View style={styles.vazioContainer}>
                <Ionicons
                  name='school-outline'
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
                onPress={() => abrirTurma(item)}
                activeOpacity={0.75}
              >
                <View style={styles.iconeTurma}>
                  <Ionicons name='people' size={28} color={colors.primary} />
                </View>

                <View style={styles.info}>
                  <Text style={styles.nome}>
                    {item.ano}º Ano {item.letra}
                  </Text>

                  <Text style={styles.detalhe}>Acessar lista de alunos</Text>
                </View>

                <Ionicons
                  name='chevron-forward'
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
  iconeTurma: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8F0FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconePessoa: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F0FA",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
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
