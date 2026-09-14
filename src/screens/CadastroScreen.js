import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../theme/colors';
import { API_URL } from '../config/api';

const PERFIS = [
  { key: 'aluno', label: 'Aluno' },
  { key: 'professor', label: 'Professor' },
  { key: 'coordenador', label: 'Coordenador' },
];

function formatarDataDigitada(texto) {
  // Aceita só números e formata automaticamente como DD/MM/AAAA
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

// Converte "DD/MM/AAAA" (como o usuário digita) para "AAAA-MM-DD" (como o banco espera)
function paraFormatoBanco(dataBr) {
  const [dia, mes, ano] = dataBr.split('/');
  return `${ano}-${mes}-${dia}`;
}

export default function CadastroScreen({ navigation }) {
  const [perfil, setPerfil] = useState('aluno');
  const [carregando, setCarregando] = useState(false);

  // Campos - Aluno (ativação de cadastro já feito pelo coordenador)
  const [matricula, setMatricula] = useState('');
  const [dataNascimentoAluno, setDataNascimentoAluno] = useState('');

  // Campos - Professor / Coordenador
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [chaveAcesso, setChaveAcesso] = useState('');

  // Campos comuns de senha
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  function limparCampos() {
    setMatricula('');
    setDataNascimentoAluno('');
    setNomeCompleto('');
    setEmail('');
    setChaveAcesso('');
    setSenha('');
    setConfirmarSenha('');
  }

  function validarSenhas() {
    if (!senha || senha.length < 6) {
      Alert.alert('Senha muito curta', 'A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Senhas diferentes', 'A senha e a confirmação precisam ser iguais.');
      return false;
    }
    return true;
  }

  function validarAluno() {
    if (!matricula.trim()) {
      Alert.alert('Campo obrigatório', 'Informe sua matrícula.');
      return false;
    }
    if (!dataValida(dataNascimentoAluno)) {
      Alert.alert('Data inválida', 'Informe a data de nascimento no formato DD/MM/AAAA.');
      return false;
    }
    return validarSenhas();
  }

  function validarProfessorOuCoordenador() {
    if (!nomeCompleto.trim()) {
      Alert.alert('Campo obrigatório', 'Informe seu nome completo.');
      return false;
    }
    const dominioEsperado = perfil === 'professor' ? '@docente.com' : '@coordenador.com';
    if (!email.trim().toLowerCase().endsWith(dominioEsperado)) {
      Alert.alert(
        'Email inválido',
        `O email de ${perfil} deve terminar com "${dominioEsperado}".`
      );
      return false;
    }
    if (!chaveAcesso.trim()) {
      Alert.alert('Campo obrigatório', 'Informe a chave de acesso.');
      return false;
    }
    return validarSenhas();
  }

  async function handleCadastro() {
    const valido = perfil === 'aluno' ? validarAluno() : validarProfessorOuCoordenador();
    if (!valido) return;

    setCarregando(true);
    try {
      let endpoint;
      let corpo;

      if (perfil === 'aluno') {
        endpoint = `${API_URL}/alunos/ativar`;
        corpo = {
          matricula: matricula.trim(),
          dataNascimento: paraFormatoBanco(dataNascimentoAluno),
          senha,
        };
      } else {
        endpoint =
          perfil === 'professor'
            ? `${API_URL}/professores/cadastro`
            : `${API_URL}/coordenadores/cadastro`;
        corpo = {
          nomeCompleto: nomeCompleto.trim(),
          email: email.trim(),
          chaveAcesso: chaveAcesso.trim(),
          senha,
        };
      }

      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert('Não foi possível cadastrar', dados.erro || 'Tente novamente.');
        return;
      }

      Alert.alert('Cadastro realizado', 'Agora faça login com seus dados.', [
        {
          text: 'OK',
          onPress: () => {
            limparCampos();
            navigation.navigate('Login');
          },
        },
      ]);
    } catch (erro) {
      Alert.alert(
        'Erro de conexão',
        'Não foi possível falar com a API. Confira se ela está rodando e se o celular está na mesma rede Wi-Fi.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>Criar conta</Text>
          <Text style={typography.subtitle}>Selecione seu perfil para continuar</Text>
        </View>

        <View style={styles.perfilRow}>
          {PERFIS.map((p) => {
            const ativo = perfil === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.perfilChip, ativo && styles.perfilChipAtivo]}
                onPress={() => {
                  setPerfil(p.key);
                }}
              >
                <Text style={[styles.perfilChipTexto, ativo && styles.perfilChipTextoAtivo]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.form}>
          {perfil === 'aluno' && (
            <>
              <Text style={styles.aviso}>
                Seu cadastro já foi criado por um coordenador. Confirme seus dados abaixo
                para ativar seu acesso.
              </Text>

              <View style={styles.campo}>
                <Text style={typography.label}>Matrícula</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite sua matrícula"
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
                  value={dataNascimentoAluno}
                  onChangeText={(texto) => setDataNascimentoAluno(formatarDataDigitada(texto))}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </>
          )}

          {perfil !== 'aluno' && (
            <>
              <View style={styles.campo}>
                <Text style={typography.label}>Nome completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu nome completo"
                  placeholderTextColor={colors.placeholder}
                  value={nomeCompleto}
                  onChangeText={setNomeCompleto}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.campo}>
                <Text style={typography.label}>Email institucional</Text>
                <TextInput
                  style={styles.input}
                  placeholder={perfil === 'professor' ? 'seunome@docente.com' : 'seunome@coordenador.com'}
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.campo}>
                <Text style={typography.label}>Chave de acesso</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Chave de ${perfil}`}
                  placeholderTextColor={colors.placeholder}
                  value={chaveAcesso}
                  onChangeText={setChaveAcesso}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          <View style={styles.campo}>
            <Text style={typography.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Crie uma senha (mín. 6 caracteres)"
              placeholderTextColor={colors.placeholder}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
          </View>

          <View style={styles.campo}>
            <Text style={typography.label}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Repita a senha"
              placeholderTextColor={colors.placeholder}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.botaoPrimario}
            onPress={handleCadastro}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.botaoPrimarioTexto}>Concluir cadastro</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkLoginTexto}>
              Já tem login? <Text style={styles.linkLoginDestaque}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  brand: {
    ...typography.title,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  perfilRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  perfilChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  perfilChipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  perfilChipTexto: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  perfilChipTextoAtivo: {
    color: colors.surface,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aviso: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: spacing.sm,
    color: colors.text,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  campo: {
    marginBottom: spacing.md,
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
    marginTop: spacing.sm,
  },
  botaoPrimarioTexto: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  linkLogin: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  linkLoginTexto: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkLoginDestaque: {
    color: colors.accentStrong,
    fontWeight: '700',
  },
});