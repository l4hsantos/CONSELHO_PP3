import React, { useState, useCallback } from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,Modal,TextInput,ScrollView,Alert,
  ActivityIndicator,KeyboardAvoidingView,Platform,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { colors, spacing, typography } from '../../theme/colors';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

function rotuloTurma(turma) {
  if (!turma) return '—';
  return `${turma.ano}º${turma.letra}`;
}

function formatarDataDigitada(texto) {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);

  const partes = [];

  if (numeros.length > 0) {
    partes.push(numeros.slice(0, 2));
  }

  if (numeros.length > 2) {
    partes.push(numeros.slice(2, 4));
  }

  if (numeros.length > 4) {
    partes.push(numeros.slice(4, 8));
  }

  return partes.join('/');
}

function dataValida(data) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(data);
}

function paraFormatoBanco(dataBr) {
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
}

function paraFormatoBrasileiro(dataBanco) {
  if (!dataBanco) return '';

  const data = String(dataBanco).slice(0, 10);

  const partes = data.split('-');

  if (partes.length !== 3) {
    return '';
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

export default function CoordenadorAlunosScreen() {
  const { auth } = useAuth();

  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);

  const [turmaFiltroId, setTurmaFiltroId] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Define se o modal está cadastrando ou editando
  const [modoEdicao, setModoEdicao] = useState(false);

  // Guarda o ID do aluno que está sendo editado
  const [alunoEditandoId, setAlunoEditandoId] = useState(null);

  // Campos do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [matricula, setMatricula] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [turmaFormId, setTurmaFormId] = useState(null);
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');

  const cabecalhos = {
    Authorization: `Bearer ${auth.token}`,
  };

  const carregarDados = useCallback(async () => {
    setCarregando(true);

    try {
      const [respTurmas, respAlunos] = await Promise.all([
        fetch(`${API_URL}/turmas`, {
          headers: cabecalhos,
        }),

        fetch(`${API_URL}/alunos`, {
          headers: cabecalhos,
        }),
      ]);

      const dadosTurmas = await respTurmas.json();
      const dadosAlunos = await respAlunos.json();

      if (!respTurmas.ok) {
        throw new Error(dadosTurmas.erro || 'Erro ao carregar turmas.');
      }

      if (!respAlunos.ok) {
        throw new Error(dadosAlunos.erro || 'Erro ao carregar alunos.');
      }

      setTurmas(Array.isArray(dadosTurmas) ? dadosTurmas : []);
      setAlunos(Array.isArray(dadosAlunos) ? dadosAlunos : []);
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro de conexão',
        'Não foi possível carregar os alunos.'
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

  // Filtro por turma + ordem alfabética
  const alunosFiltrados = alunos
    .filter((aluno) =>
      turmaFiltroId
        ? aluno.turma_id === turmaFiltroId
        : true
    )
    .sort((a, b) =>
      a.nome_completo.localeCompare(
        b.nome_completo,
        'pt-BR'
      )
    );

  function limparFormulario() {
    setNomeCompleto('');
    setMatricula('');
    setDataNascimento('');
    setTurmaFormId(null);
    setTelefone('');
    setEndereco('');
    setNomeResponsavel('');
    setAlunoEditandoId(null);
    setModoEdicao(false);
  }

  // Abre modal para NOVO aluno
  function abrirModal() {
    limparFormulario();
    setModalVisivel(true);
  }

  // Abre modal para EDITAR aluno
  function abrirModalEdicao(aluno) {
    setModoEdicao(true);
    setAlunoEditandoId(aluno.id);

    setNomeCompleto(aluno.nome_completo || '');
    setMatricula(aluno.matricula || '');
    setDataNascimento(
      paraFormatoBrasileiro(aluno.data_nascimento)
    );
    setTurmaFormId(aluno.turma_id || null);
    setTelefone(aluno.telefone || '');
    setEndereco(aluno.endereco || '');
    setNomeResponsavel(aluno.nome_responsavel || '');

    setModalVisivel(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalVisivel(false);
    limparFormulario();
  }

  async function handleSalvarAluno() {
    // Validação do nome
    if (!nomeCompleto.trim()) {
      Alert.alert(
        'Campo obrigatório',
        'Informe o nome completo do aluno.'
      );
      return;
    }

    // Matrícula só é obrigatória no cadastro.
    if (!modoEdicao && !matricula.trim()) {
      Alert.alert(
        'Campo obrigatório',
        'Informe a matrícula.'
      );
      return;
    }

    // Data
    if (!dataValida(dataNascimento)) {
      Alert.alert(
        'Data inválida',
        'Informe a data de nascimento no formato DD/MM/AAAA.'
      );
      return;
    }

    // Turma
    if (!turmaFormId) {
      Alert.alert(
        'Campo obrigatório',
        'Selecione a turma do aluno.'
      );
      return;
    }

    setSalvando(true);

    try {
      let resposta;

  
      // CADASTRO
      if (!modoEdicao) {
        resposta = await fetch(
          `${API_URL}/alunos/pre-cadastro`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...cabecalhos,
            },
            body: JSON.stringify({
              matricula: matricula.trim(),
              nomeCompleto: nomeCompleto.trim(),
              dataNascimento:
                paraFormatoBanco(dataNascimento),
              turmaId: turmaFormId,
              telefone: telefone.trim() || undefined,
              endereco: endereco.trim() || undefined,
              nomeResponsavel:
                nomeResponsavel.trim() || undefined,
            }),
          }
        );
      }


      // EDIÇÃO
      else {
        resposta = await fetch(
          `${API_URL}/alunos/${alunoEditandoId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...cabecalhos,
            },
            body: JSON.stringify({
              nomeCompleto: nomeCompleto.trim(),
              dataNascimento:
                paraFormatoBanco(dataNascimento),
              turmaId: turmaFormId,
              telefone: telefone.trim() || null,
              endereco: endereco.trim() || null,
              nomeResponsavel:
                nomeResponsavel.trim() || null,
            }),
          }
        );
      }

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          modoEdicao
            ? 'Não foi possível atualizar'
            : 'Não foi possível cadastrar',
          dados.erro || 'Tente novamente.'
        );

        return;
      }

      setModalVisivel(false);
      limparFormulario();

      await carregarDados();

      Alert.alert(
        'Sucesso',
        modoEdicao
          ? 'Aluno atualizado com sucesso!'
          : 'Aluno pré-cadastrado! Ele já pode ativar o acesso dele no app.'
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


  // EXCLUSÃO

  function confirmarExclusao(aluno) {
    Alert.alert(
      'Excluir aluno',
      `Tem certeza que deseja excluir ${aluno.nome_completo}? Essa ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirAluno(aluno.id),
        },
      ]
    );
  }

  async function excluirAluno(id) {
    try {
      const resposta = await fetch(
        `${API_URL}/alunos/${id}`,
        {
          method: 'DELETE',
          headers: cabecalhos,
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert(
          'Não foi possível excluir',
          dados.erro || 'Tente novamente.'
        );
        return;
      }

      await carregarDados();

      Alert.alert(
        'Aluno excluído',
        'O aluno foi removido com sucesso.'
      );
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro de conexão',
        'Não foi possível excluir o aluno.'
      );
    }
  }

  function renderAluno({ item }) {
    const turmaDoAluno = item.turma_ano
      ? {
          ano: item.turma_ano,
          letra: item.turma_letra,
        }
      : null;

    return (
      <View style={styles.linhaAluno}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nomeAluno}>
            {item.nome_completo}
          </Text>

          <Text style={styles.detalheAluno}>
            Matrícula: {item.matricula} · Turma:{' '}
            {rotuloTurma(turmaDoAluno)}
          </Text>

          <View
            style={[
              styles.badge,
              item.ativado
                ? styles.badgeAtivo
                : styles.badgePendente,
            ]}
          >
            <Text style={styles.badgeTexto}>
              {item.ativado
                ? 'Ativo'
                : 'Pendente ativação'}
            </Text>
          </View>
        </View>

        {/* Botão editar */}
        <TouchableOpacity
          onPress={() => abrirModalEdicao(item)}
          style={styles.botaoAcao}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        {/* Botão excluir */}
        <TouchableOpacity
          onPress={() => confirmarExclusao(item)}
          style={styles.botaoAcao}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={colors.danger}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER/CABEÇALHO*/}

      <View style={styles.header}>
        <Text style={typography.title}>
          Alunos
        </Text>

        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={abrirModal}
        >
          <Ionicons
            name="add"
            size={22}
            color={colors.surface}
          />
        </TouchableOpacity>
      </View>

      {/*FILTRO POR TURMA*/}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtroLinha}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            turmaFiltroId === null &&
              styles.chipAtivo,
          ]}
          onPress={() => setTurmaFiltroId(null)}
        >
          <Text
            style={[
              styles.chipTexto,
              turmaFiltroId === null &&
                styles.chipTextoAtivo,
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>

        {turmas.map((turma) => (
          <TouchableOpacity
            key={turma.id}
            style={[
              styles.chip,
              turmaFiltroId === turma.id &&
                styles.chipAtivo,
            ]}
            onPress={() =>
              setTurmaFiltroId(turma.id)
            }
          >
            <Text
              style={[
                styles.chipTexto,
                turmaFiltroId === turma.id &&
                  styles.chipTextoAtivo,
              ]}
            >
              {rotuloTurma(turma)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/*LISTA*/}

      {carregando ? (
        <ActivityIndicator
          style={{ marginTop: spacing.lg }}
          color={colors.primary}
        />
      ) : (
        <FlatList
          data={alunosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAluno}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingTop: spacing.sm,
          }}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Nenhum aluno encontrado nessa turma.
            </Text>
          }
        />
      )}

      {/*MODAL CADASTRO / EDIÇÃO*/}

      <Modal
        visible={modalVisivel}
        animationType="slide"
        onRequestClose={fecharModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={
              styles.modalConteudo
            }
          >
            <Text style={typography.title}>
              {modoEdicao
                ? 'Editar aluno'
                : 'Novo aluno'}
            </Text>

            {/* NOME */}

            <View style={styles.campo}>
              <Text style={typography.label}>
                Nome completo
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nome completo do aluno"
                placeholderTextColor={
                  colors.placeholder
                }
                value={nomeCompleto}
                onChangeText={setNomeCompleto}
                autoCapitalize="words"
              />
            </View>

            {/* MATRÍCULA */}

            <View style={styles.campo}>
              <Text style={typography.label}>
                Matrícula
              </Text>

              <TextInput
                style={[
                  styles.input,
                  modoEdicao &&
                    styles.inputDesabilitado,
                ]}
                placeholder="Número de matrícula"
                placeholderTextColor={
                  colors.placeholder
                }
                value={matricula}
                onChangeText={setMatricula}
                autoCapitalize="none"
                editable={!modoEdicao}
              />

              {modoEdicao && (
                <Text style={styles.avisoCampo}>
                  A matrícula não pode ser alterada.
                </Text>
              )}
            </View>

            {/* DATA DE NASCIMENTO */}

            <View style={styles.campo}>
              <Text style={typography.label}>
                Data de nascimento
              </Text>

              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={
                  colors.placeholder
                }
                value={dataNascimento}
                onChangeText={(texto) =>
                  setDataNascimento(
                    formatarDataDigitada(texto)
                  )
                }
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            {/* TURMA */}

            <View style={styles.campo}>
              <Text style={typography.label}>
                Turma
              </Text>

              <View style={styles.chipsForm}>
                {turmas.map((turma) => (
                  <TouchableOpacity
                    key={turma.id}
                    style={[
                      styles.chip,
                      turmaFormId === turma.id &&
                        styles.chipAtivo,
                    ]}
                    onPress={() =>
                      setTurmaFormId(turma.id)
                    }
                  >
                    <Text
                      style={[
                        styles.chipTexto,
                        turmaFormId === turma.id &&
                          styles.chipTextoAtivo,
                      ]}
                    >
                      {rotuloTurma(turma)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TELEFONE */}

            <View style={styles.campo}>
              <Text style={typography.label}>
                Telefone (opcional)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                placeholderTextColor={
                  colors.placeholder
                }
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />
            </View>

            {/* ENDEREÇO */}

            <View style={styles.campo}>
              <Text style={typography.label}>
                Endereço (opcional)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Endereço completo"
                placeholderTextColor={
                  colors.placeholder
                }
                value={endereco}
                onChangeText={setEndereco}
              />
            </View>

            {/* RESPONSÁVEL */}

            <View style={styles.campo}>
              <Text style={typography.label}>
                Nome do responsável (opcional)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nome do responsável"
                placeholderTextColor={
                  colors.placeholder
                }
                value={nomeResponsavel}
                onChangeText={setNomeResponsavel}
                autoCapitalize="words"
              />
            </View>

            {/* BOTÃO SALVAR */}

            <TouchableOpacity
              style={styles.botaoPrimario}
              onPress={handleSalvarAluno}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator
                  color={colors.surface}
                />
              ) : (
                <Text
                  style={
                    styles.botaoPrimarioTexto
                  }
                >
                  {modoEdicao
                    ? 'Salvar alterações'
                    : 'Cadastrar aluno'}
                </Text>
              )}
            </TouchableOpacity>

            {/* BOTÃO CANCELAR */}

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={fecharModal}
              disabled={salvando}
            >
              <Text
                style={styles.botaoCancelarTexto}
              >
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
    paddingBottom: spacing.sm,
  },

  botaoAdicionar: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filtroLinha: {
    paddingLeft: spacing.lg,
    marginBottom: spacing.sm,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },

  chipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  chipTexto: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  chipTextoAtivo: {
    color: colors.surface,
  },

  chipsForm: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  linhaAluno: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },

  nomeAluno: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  detalheAluno: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  badge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  badgeAtivo: {
    backgroundColor: colors.accentStrong,
  },

  badgePendente: {
    backgroundColor: colors.accent,
  },

  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },

  botaoAcao: {
    padding: spacing.sm,
  },

  vazio: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },

  modalConteudo: {
    padding: spacing.lg,
  },

  campo: {
    marginTop: spacing.md,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },

  inputDesabilitado: {
    backgroundColor: colors.border,
    opacity: 0.7,
  },

  avisoCampo: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },

  botaoPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
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