import React, { useState } from 'react';

import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, } from 'react-native';

import { colors, spacing, typography } from '../theme/colors';

import { API_URL } from '../config/api';

import { useAuth } from '../context/AuthContext';

import { Ionicons } from '@expo/vector-icons';

const PERFIS = [
  { key: 'aluno', label: 'Aluno' },
  { key: 'professor', label: 'Professor' },
  { key: 'coordenador', label: 'Coordenador' },
];

export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth();

  const [perfil, setPerfil] = useState('aluno');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [carregando, setCarregando] = useState(false);


  const usaMatricula = perfil === 'aluno';

  function validar() {
    if (usaMatricula) {
      if (!matricula.trim()) {
        Alert.alert(
          'Campo obrigatório',
          'Informe sua matrícula.'
        );

        return false;
      }
    } else {
      if (!email.trim()) {
        Alert.alert(
          'Campo obrigatório',
          'Informe seu email.'
        );

        return false;
      }

      const dominioEsperado =
        perfil === 'professor'
          ? '@docente.com'
          : '@coordenador.com';

      if (
        !email
          .trim()
          .toLowerCase()
          .endsWith(dominioEsperado)
      ) {
        Alert.alert(
          'Email inválido',
          `O email de ${perfil} deve terminar com "${dominioEsperado}".`
        );

        return false;
      }
    }

    if (!senha) {
      Alert.alert(
        'Campo obrigatório',
        'Informe sua senha.'
      );

      return false;
    }

    return true;
  }

  async function handleLogin() {
    setErroLogin('');
    if (!validar()) return;

    setCarregando(true);
    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfil,
          identificador: usaMatricula ? matricula.trim() : email.trim(),
          senha,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErroLogin(dados.erro || 'Não foi possível entrar. Tente novamente.');
        return;
      }

      const dadosAuth = {
        token: dados.token,
        perfil: dados.perfil,
        usuario: dados.usuario,
      };

      /*
       * A partir daqui o App.js vai perceber
       * que o usuário está autenticado e vai
       * mostrar automaticamente a tela correta.
       */

      entrar(dadosAuth);

    } catch (erro) {
      setErroLogin('Não foi possível falar com a API. Confira sua conexão.');
    } finally {
      setCarregando(false);
    }
  }
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>
            CONSELHO+
          </Text>

          <Text style={typography.subtitle}>
            Entre com sua conta para continuar
          </Text>
        </View>

        <View style={styles.perfilRow}>
          {PERFIS.map((p) => {
            const ativo = perfil === p.key;

            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.perfilChip,
                  ativo &&
                  styles.perfilChipAtivo,
                ]}
                onPress={() =>
                  setPerfil(p.key)
                }
              >
                <Text
                  style={[
                    styles.perfilChipTexto,
                    ativo &&
                    styles.perfilChipTextoAtivo,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.form}>
          {usaMatricula ? (
            <View style={styles.campo}>
              <Text style={typography.label}>
                Matrícula
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Digite sua matrícula"
                placeholderTextColor={
                  colors.placeholder
                }
                value={matricula}
                onChangeText={setMatricula}
                autoCapitalize="none"
                keyboardType="default"
              />
            </View>
          ) : (
            <View style={styles.campo}>
              <Text style={typography.label}>
                Email
              </Text>

              <TextInput
                style={styles.input}
                placeholder={
                  perfil === 'professor'
                    ? 'seunome@docente.com'
                    : 'seunome@coordenador.com'
                }
                placeholderTextColor={
                  colors.placeholder
                }
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}

          <View style={styles.campo}>
            <Text style={typography.label}>Senha</Text>
            <View style={styles.inputSenhaContainer}>
              <TextInput
                style={styles.inputSenha}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.placeholder}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
              />
              <TouchableOpacity
                onPress={() => setMostrarSenha(!mostrarSenha)}
                style={styles.botaoOlho}
              >
                <Ionicons
                  name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
          {erroLogin ? (
            <View style={styles.avisoErro}>
              <Text style={styles.avisoErroTexto}>{erroLogin}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.botaoPrimario}
            onPress={handleLogin}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator
                color={colors.surface}
              />
            ) : (
              <Text
                style={styles.botaoPrimarioTexto}
              >
                Entrar
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCadastro}
            onPress={() =>
              navigation.navigate('Cadastro')
            }
          >
            <Text
              style={styles.linkCadastroTexto}
            >
              Não tem login?{' '}
              <Text
                style={
                  styles.linkCadastroDestaque
                }
              >
                Cadastre-se
              </Text>
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
    marginBottom: spacing.xl,
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
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputSenha: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  botaoOlho: {
    padding: 4,
  },
  avisoErro: {
  backgroundColor: '#FDEDED',
  borderRadius: 10,
  padding: spacing.sm,
  marginBottom: spacing.sm,
},
avisoErroTexto: {
  color: colors.danger,
  fontSize: 13,
  textAlign: 'center',
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

  linkCadastro: {
    marginTop: spacing.md,
    alignItems: 'center',
  },

  linkCadastroTexto: {
    color: colors.textMuted,
    fontSize: 14,
  },

  linkCadastroDestaque: {
    color: colors.accentStrong,
    fontWeight: '700',
  },
});
