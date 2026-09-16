
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/colors';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

function rotuloTurma(turma) {
  if (!turma) return '—';
  return `${turma.ano}º${turma.letra}`;
}

export default function CoordenadorProfessoresScreen() {
  const { auth } = useAuth();

  const [professores, setProfessores] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [vinculos, setVinculos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);

  const [professorId, setProfessorId] = useState(null);
  const [disciplinaId, setDisciplinaId] = useState(null);
  const [turmaIds, setTurmaIds] = useState([]);

  const cabecalhos = {
    Authorization: `Bearer ${auth.token}`,
  };

  // Carrega professores, disciplinas, turmas e vínculos.
  const carregarDados = useCallback(async () => {
    setCarregando(true);

    try {
      const [
        respProfessores,
        respDisciplinas,
        respTurmas,
        respVinculos,
      ] = await Promise.all([
        fetch(`${API_URL}/professores`, {
          headers: cabecalhos,
        }),
        fetch(`${API_URL}/vinculos/disciplinas`, {
          headers: cabecalhos,
        }),
        fetch(`${API_URL}/turmas`, {
          headers: cabecalhos,
        }),
        fetch(`${API_URL}/vinculos`, {
          headers: cabecalhos,
        }),
      ]);

      const respostas = [
        respProfessores,
        respDisciplinas,
        respTurmas,
        respVinculos,
      ];

      if (respostas.some((resposta) => !resposta.ok)) {
        throw new Error('Falha ao carregar os dados.');
      }

      const [
        dadosProfessores,
        dadosDisciplinas,
        dadosTurmas,
        dadosVinculos,
      ] = await Promise.all(
        respostas.map((resposta) => resposta.json())
      );

      setProfessores(
        Array.isArray(dadosProfessores) ? dadosProfessores : []
      );

      setDisciplinas(
        Array.isArray(dadosDisciplinas) ? dadosDisciplinas : []
      );

      setTurmas(
        Array.isArray(dadosTurmas) ? dadosTurmas : []
      );

      setVinculos(
        Array.isArray(dadosVinculos) ? dadosVinculos : []
      );
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro ao carregar',
        'Não foi possível carregar os professores e seus vínculos.'
      );
    } finally {
      setCarregando(false);
    }
  }, [auth.token]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  // Organiza os vínculos por professor.
  const professoresOrganizados = professores
    .map((professor) => ({
      ...professor,
      vinculos: vinculos.filter(
        (vinculo) =>
          Number(vinculo.professor_id) === Number(professor.id)
      ),
    }))
    .sort((a, b) =>
      a.nome_completo.localeCompare(b.nome_completo, 'pt-BR')
    );

  function limparFormulario() {
    setProfessorId(null);
    setDisciplinaId(null);
    setTurmaIds([]);
  }

  function abrirModal() {
    limparFormulario();
    setModalVisivel(true);
  }

  // Cadastra o professor, a disciplina e todas as turmas selecionadas.
  async function handleCadastrarVinculo() {
    if (
      !professorId ||
      !disciplinaId ||
      turmaIds.length === 0
    ) {
      Alert.alert(
        'Campos obrigatórios',
        'Selecione o professor, a disciplina e pelo menos uma turma.'
      );
      return;
    }

    setSalvando(true);

    try {
      const resposta = await fetch(`${API_URL}/vinculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...cabecalhos,
        },
        body: JSON.stringify({
          professorId,
          disciplinaId,
          turmaIds,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Não foi possível vincular',
          dados.erro || 'Tente novamente.'
        );
        return;
      }

      const quantidadeSalva = dados.quantidade || turmaIds.length;

      setModalVisivel(false);
      limparFormulario();

      await carregarDados();

      Alert.alert(
        'Sucesso',
        `${quantidadeSalva} vínculo(s) cadastrado(s) com sucesso!`
      );
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro de conexão',
        'Não foi possível falar com a API.'
      );
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(vinculo) {
    Alert.alert(
      'Remover vínculo',
      `Deseja remover ${vinculo.disciplina} da turma ${rotuloTurma({
        ano: vinculo.turma_ano,
        letra: vinculo.turma_letra,
      })} para este professor?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => excluirVinculo(vinculo.vinculo_id),
        },
      ]
    );
  }

  async function excluirVinculo(id) {
    try {
      const resposta = await fetch(`${API_URL}/vinculos/${id}`, {
        method: 'DELETE',
        headers: cabecalhos,
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Não foi possível remover',
          dados.erro || 'Tente novamente.'
        );
        return;
      }

      await carregarDados();
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro de conexão',
        'Não foi possível falar com a API.'
      );
    }
  }

  function renderProfessor({ item }) {
    return (
      <View style={styles.cartaoProfessor}>
        <View style={styles.professorCabecalho}>
          <View style={styles.iconeProfessor}>
            <Ionicons
              name="person-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.dadosProfessor}>
            <Text style={styles.nomeProfessor}>
              {item.nome_completo}
            </Text>

            <Text style={styles.emailProfessor}>
              {item.email}
            </Text>
          </View>
        </View>

        <View style={styles.divisor} />

        <Text style={styles.tituloVinculos}>
          <Ionicons
            name="book-outline"
            size={15}
            color={colors.primary}
          />{' '}
          Disciplinas e turmas
        </Text>

        {item.vinculos.length === 0 ? (
          <View style={styles.semVinculo}>
            <Text style={styles.semVinculoTexto}>
              Nenhuma disciplina vinculada.
            </Text>
          </View>
        ) : (
          item.vinculos.map((vinculo) => (
            <View
              key={vinculo.vinculo_id}
              style={styles.linhaVinculo}
            >
              <View style={styles.dadosVinculo}>
                <Text style={styles.nomeDisciplina}>
                  {vinculo.disciplina}
                </Text>

                <View style={styles.badgeTurma}>
                  <Text style={styles.badgeTurmaTexto}>
                    {rotuloTurma({
                      ano: vinculo.turma_ano,
                      letra: vinculo.turma_letra,
                    })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.botaoRemover}
                onPress={() => confirmarExclusao(vinculo)}
                accessibilityLabel={`Remover vínculo de ${vinculo.disciplina}`}
              >
                <Ionicons
                  name="trash-outline"
                  size={19}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTexto}>
          <Text style={typography.title}>Professores</Text>

          <Text style={typography.subtitle}>
            Gerencie os professores e seus vínculos.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={abrirModal}
          accessibilityLabel="Vincular professor"
        >
          <Ionicons
            name="add"
            size={25}
            color={colors.surface}
          />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator
          style={{ marginTop: spacing.xl }}
          color={colors.primary}
          size="large"
        />
      ) : (
        <FlatList
          data={professoresOrganizados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProfessor}
          contentContainerStyle={styles.lista}
          refreshing={carregando}
          onRefresh={carregarDados}
          ListEmptyComponent={
            <View style={styles.vazioContainer}>
              <Ionicons
                name="people-outline"
                size={42}
                color={colors.textMuted}
              />

              <Text style={styles.vazioTitulo}>
                Nenhum professor cadastrado
              </Text>

              <Text style={styles.vazioTexto}>
                Os professores cadastrados aparecerão aqui.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisivel}
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.modalConteudo}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={typography.title}>
                  Novo vínculo
                </Text>

                <Text style={typography.subtitle}>
                  Selecione o professor, a disciplina e uma ou mais turmas.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisivel(false)}
                style={styles.botaoFechar}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Seleção do professor */}
            <View style={styles.campo}>
              <Text style={typography.label}>Professor</Text>

              {professores.length === 0 ? (
                <Text style={styles.aviso}>
                  Não há professores cadastrados.
                </Text>
              ) : (
                <View style={styles.opcoes}>
                  {professores.map((professor) => {
                    const selecionado =
                      Number(professorId) === Number(professor.id);

                    return (
                      <TouchableOpacity
                        key={professor.id}
                        style={[
                          styles.opcao,
                          selecionado && styles.opcaoAtiva,
                        ]}
                        onPress={() => setProfessorId(professor.id)}
                      >
                        <Text
                          style={[
                            styles.opcaoTexto,
                            selecionado && styles.opcaoTextoAtivo,
                          ]}
                        >
                          {professor.nome_completo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Seleção da disciplina */}
            <View style={styles.campo}>
              <Text style={typography.label}>Disciplina</Text>

              {disciplinas.length === 0 ? (
                <Text style={styles.aviso}>
                  Nenhuma disciplina encontrada.
                </Text>
              ) : (
                <View style={styles.opcoes}>
                  {disciplinas.map((disciplina) => {
                    const selecionada =
                      Number(disciplinaId) === Number(disciplina.id);

                    return (
                      <TouchableOpacity
                        key={disciplina.id}
                        style={[
                          styles.opcao,
                          selecionada && styles.opcaoAtiva,
                        ]}
                        onPress={() => setDisciplinaId(disciplina.id)}
                      >
                        <Text
                          style={[
                            styles.opcaoTexto,
                            selecionada && styles.opcaoTextoAtivo,
                          ]}
                        >
                          {disciplina.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Seleção de várias turmas */}
            <View style={styles.campo}>
              <Text style={typography.label}>Turmas</Text>

              <Text style={styles.avisoTurmas}>
                Selecione uma ou mais turmas.
              </Text>

              {turmas.length === 0 ? (
                <Text style={styles.aviso}>
                  Nenhuma turma encontrada.
                </Text>
              ) : (
                <View style={styles.opcoes}>
                  {turmas.map((turma) => {
                    const id = Number(turma.id);
                    const selecionada = turmaIds.includes(id);

                    return (
                      <TouchableOpacity
                        key={turma.id}
                        style={[
                          styles.opcao,
                          styles.opcaoTurma,
                          selecionada && styles.opcaoAtiva,
                        ]}
                        onPress={() => {
                          setTurmaIds((anteriores) =>
                            anteriores.includes(id)
                              ? anteriores.filter((item) => item !== id)
                              : [...anteriores, id]
                          );
                        }}
                      >
                        <Ionicons
                          name={
                            selecionada
                              ? 'checkbox'
                              : 'square-outline'
                          }
                          size={18}
                          color={
                            selecionada
                              ? colors.surface
                              : colors.primary
                          }
                        />

                        <Text
                          style={[
                            styles.opcaoTexto,
                            selecionada && styles.opcaoTextoAtivo,
                          ]}
                        >
                          {rotuloTurma(turma)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {turmaIds.length > 0 && (
                <Text style={styles.contadorTurmas}>
                  {turmaIds.length}{' '}
                  {turmaIds.length === 1
                    ? 'turma selecionada'
                    : 'turmas selecionadas'}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.botaoPrimario,
                salvando && styles.botaoDesabilitado,
              ]}
              onPress={handleCadastrarVinculo}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.botaoPrimarioTexto}>
                  Salvar vínculos
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => setModalVisivel(false)}
              disabled={salvando}
            >
              <Text style={styles.botaoCancelarTexto}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },

  headerTexto: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  botaoAdicionar: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lista: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  cartaoProfessor: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  professorCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconeProfessor: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },

  dadosProfessor: {
    flex: 1,
  },

  nomeProfessor: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  emailProfessor: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },

  divisor: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  tituloVinculos: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  semVinculo: {
    backgroundColor: colors.accent,
    padding: spacing.sm,
    borderRadius: 8,
  },

  semVinculoTexto: {
    fontSize: 13,
    color: colors.text,
  },

  linhaVinculo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E6',
  },

  dadosVinculo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  nomeDisciplina: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  badgeTurma: {
    backgroundColor: colors.accentStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  badgeTurmaTexto: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  botaoRemover: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },

  vazioContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },

  vazioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },

  vazioTexto: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  modalConteudo: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },

  botaoFechar: {
    padding: spacing.xs,
  },

  campo: {
    marginTop: spacing.lg,
  },

  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  opcao: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },

  opcaoTurma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  opcaoAtiva: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  opcaoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },

  opcaoTextoAtivo: {
    color: colors.surface,
  },

  aviso: {
    fontSize: 13,
    color: colors.textMuted,
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 10,
  },

  avisoTurmas: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  contadorTurmas: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },

  botaoPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },

  botaoDesabilitado: {
    opacity: 0.6,
  },

  botaoPrimarioTexto: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },

  botaoCancelar: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },

  botaoCancelarTexto: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});