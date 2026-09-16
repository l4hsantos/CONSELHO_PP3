import React, { useState, useCallback } from 'react';
import {View,Text,FlatList,TouchableOpacity,StyleSheet,Modal,TextInput,ScrollView,Alert,ActivityIndicator,KeyboardAvoidingView,Platform,} from 'react-native';
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
  if (numeros.length > 0) partes.push(numeros.slice(0, 2));
  if (numeros.length > 2) partes.push(numeros.slice(2, 4));
  if (numeros.length > 4) partes.push(numeros.slice(4, 8));
  return partes.join('/');
}

function dataValida(data) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(data);
}

function paraFormatoBanco(dataBr) {
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
}

export default function CoordenadorAlunosScreen() {
  const { auth } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [turmaFiltroId, setTurmaFiltroId] = useState(null); // null = "Todas"
  const [carregando, setCarregando] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Campos do formulário de novo aluno
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [matricula, setMatricula] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [turmaFormId, setTurmaFormId] = useState(null);
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');

  const cabecalhos = { Authorization: `Bearer ${auth.token}` };

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [respTurmas, respAlunos] = await Promise.all([
        fetch(`${API_URL}/turmas`, { headers: cabecalhos }),
        fetch(`${API_URL}/alunos`, { headers: cabecalhos }),
      ]);
      const dadosTurmas = await respTurmas.json();
      const dadosAlunos = await respAlunos.json();
      setTurmas(Array.isArray(dadosTurmas) ? dadosTurmas : []);
      setAlunos(Array.isArray(dadosAlunos) ? dadosAlunos : []);
    } catch (erro) {
      Alert.alert('Erro de conexão', 'Não foi possível carregar os alunos.');
    } finally {
      setCarregando(false);
    }
  }, [auth.token]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const alunosFiltrados = alunos
    .filter((a) => (turmaFiltroId ? a.turma_id === turmaFiltroId : true))
    .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'));

  function limparFormulario() {
    setNomeCompleto('');
    setMatricula('');
    setDataNascimento('');
    setTurmaFormId(null);
    setTelefone('');
    setEndereco('');
    setNomeResponsavel('');
  }

  function abrirModal() {
    limparFormulario();
    setModalVisivel(true);
  }

  async function handleCadastrarAluno() {
    if (!nomeCompleto.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome completo do aluno.');
      return;
    }
    if (!matricula.trim()) {
      Alert.alert('Campo obrigatório', 'Informe a matrícula.');
      return;
    }
    if (!dataValida(dataNascimento)) {
      Alert.alert('Data inválida', 'Informe a data de nascimento no formato DD/MM/AAAA.');
      return;
    }
    if (!turmaFormId) {
      Alert.alert('Campo obrigatório', 'Selecione a turma do aluno.');
      return;
    }

    setSalvando(true);
    try {
      const resposta = await fetch(`${API_URL}/alunos/pre-cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabecalhos },
        body: JSON.stringify({
          matricula: matricula.trim(),
          nomeCompleto: nomeCompleto.trim(),
          dataNascimento: paraFormatoBanco(dataNascimento),
          turmaId: turmaFormId,
          telefone: telefone.trim() || undefined,
          endereco: endereco.trim() || undefined,
          nomeResponsavel: nomeResponsavel.trim() || undefined,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert('Não foi possível cadastrar', dados.erro || 'Tente novamente.');
        return;
      }

      setModalVisivel(false);
      limparFormulario();
      carregarDados();
      Alert.alert('Sucesso', 'Aluno pré-cadastrado! Ele já pode ativar o acesso dele no app.');
    } catch (erro) {
      Alert.alert('Erro de conexão', 'Não foi possível falar com a API.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(aluno) {
    Alert.alert(
      'Excluir aluno',
      `Tem certeza que deseja excluir ${aluno.nome_completo}? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => excluirAluno(aluno.id) },
      ]
    );
  }

  async function excluirAluno(id) {
    try {
      const resposta = await fetch(`${API_URL}/alunos/${id}`, {
        method: 'DELETE',
        headers: cabecalhos,
      });
      const dados = await resposta.json();
      if (!resposta.ok) {
        Alert.alert('Não foi possível excluir', dados.erro || 'Tente novamente.');
        return;
      }
      carregarDados();
    } catch (erro) {
      Alert.alert('Erro de conexão', 'Não foi possível falar com a API.');
    }
  }

  function renderAluno({ item }) {
    const turmaDoAluno = item.turma_ano ? { ano: item.turma_ano, letra: item.turma_letra } : null;
    return (
      <View style={styles.linhaAluno}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nomeAluno}>{item.nome_completo}</Text>
          <Text style={styles.detalheAluno}>
            Matrícula: {item.matricula} · Turma: {rotuloTurma(turmaDoAluno)}
          </Text>
          <View style={[styles.badge, item.ativado ? styles.badgeAtivo : styles.badgePendente]}>
            <Text style={styles.badgeTexto}>{item.ativado ? 'Ativo' : 'Pendente ativação'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => confirmarExclusao(item)} style={styles.botaoExcluir}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.title}>Alunos</Text>
        <TouchableOpacity style={styles.botaoAdicionar} onPress={abrirModal}>
          <Ionicons name="add" size={22} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroLinha}>
        <TouchableOpacity
          style={[styles.chip, turmaFiltroId === null && styles.chipAtivo]}
          onPress={() => setTurmaFiltroId(null)}
        >
          <Text style={[styles.chipTexto, turmaFiltroId === null && styles.chipTextoAtivo]}>Todas</Text>
        </TouchableOpacity>
        {turmas.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, turmaFiltroId === t.id && styles.chipAtivo]}
            onPress={() => setTurmaFiltroId(t.id)}
          >
            <Text style={[styles.chipTexto, turmaFiltroId === t.id && styles.chipTextoAtivo]}>
              {rotuloTurma(t)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: spacing.lg }} color={colors.primary} />
      ) : (
        <FlatList
          data={alunosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAluno}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum aluno encontrado nessa turma.</Text>
          }
        />
      )}

      <Modal visible={modalVisivel} animationType="slide" onRequestClose={() => setModalVisivel(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalConteudo}>
            <Text style={typography.title}>Novo aluno</Text>

            <View style={styles.campo}>
              <Text style={typography.label}>Nome completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome completo do aluno"
                placeholderTextColor={colors.placeholder}
                value={nomeCompleto}
                onChangeText={setNomeCompleto}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.campo}>
              <Text style={typography.label}>Matrícula</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de matrícula"
                placeholderTextColor={colors.placeholder}
                value={matricula}
                onChangeText={setMatricula}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.campo}>
              <Text style={typography.label}>Data de nascimento</Text>
              <TextInput
                style={styles.input}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.placeholder}
                value={dataNascimento}
                onChangeText={(t) => setDataNascimento(formatarDataDigitada(t))}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.campo}>
              <Text style={typography.label}>Turma</Text>
              <View style={styles.chipsForm}>
                {turmas.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, turmaFormId === t.id && styles.chipAtivo]}
                    onPress={() => setTurmaFormId(t.id)}
                  >
                    <Text style={[styles.chipTexto, turmaFormId === t.id && styles.chipTextoAtivo]}>
                      {rotuloTurma(t)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.campo}>
              <Text style={typography.label}>Telefone (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="(00) 00000-0000"
                placeholderTextColor={colors.placeholder}
                value={telefone}
                onChangeText={setTelefone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.campo}>
              <Text style={typography.label}>Endereço (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Endereço completo"
                placeholderTextColor={colors.placeholder}
                value={endereco}
                onChangeText={setEndereco}
              />
            </View>

            <View style={styles.campo}>
              <Text style={typography.label}>Nome do responsável (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do responsável"
                placeholderTextColor={colors.placeholder}
                value={nomeResponsavel}
                onChangeText={setNomeResponsavel}
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={styles.botaoPrimario}
              onPress={handleCadastrarAluno}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.botaoPrimarioTexto}>Cadastrar aluno</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setModalVisivel(false)}>
              <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
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
  botaoExcluir: {
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