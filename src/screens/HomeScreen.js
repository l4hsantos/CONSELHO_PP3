import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
export default function HomeScreen({ route, navigation }) {
  const { sair } = useAuth();
  const { perfil, usuario } = route.params ?? {};
  const nome = usuario?.nome_completo || usuario?.matricula || '—';

  function handleSair() {
    sair();
    navigation.replace('Login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={typography.title}>Login realizado ✅</Text>
        <Text style={[typography.subtitle, styles.linha]}>
          Perfil: <Text style={styles.destaque}>{perfil}</Text>
        </Text>
        <Text style={[typography.subtitle, styles.linha]}>
          Nome/Matrícula: <Text style={styles.destaque}>{nome}</Text>
        </Text>

        <TouchableOpacity style={styles.botaoSair} onPress={handleSair}>
          <Text style={styles.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  linha: {
    marginTop: spacing.sm,
  },
  destaque: {
    color: colors.primary,
    fontWeight: '700',
  },
  botaoSair: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  botaoSairTexto: {
    color: colors.danger,
    fontWeight: '700',
  },
});