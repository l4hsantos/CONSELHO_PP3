import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/colors';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function CoordenadorHomeScreen() {
  const { auth } = useAuth();
  const [totalProfessores, setTotalProfessores] = useState(null);
  const [totalAlunos, setTotalAlunos] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregarContadores = useCallback(async () => {
    try {
      const cabecalhos = { Authorization: `Bearer ${auth.token}` };

      const [respProfessores, respAlunos] = await Promise.all([
        fetch(`${API_URL}/professores`, { headers: cabecalhos }),
        fetch(`${API_URL}/alunos`, { headers: cabecalhos }),
      ]);

      const professores = await respProfessores.json();
      const alunos = await respAlunos.json();

      setTotalProfessores(Array.isArray(professores) ? professores.length : 0);
      setTotalAlunos(Array.isArray(alunos) ? alunos.length : 0);
    } catch (erro) {
      setTotalProfessores(null);
      setTotalAlunos(null);
    } finally {
      setCarregando(false);
    }
  }, [auth.token]);

  useFocusEffect(
    useCallback(() => {
      carregarContadores();
    }, [carregarContadores])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      refreshControl={
        <RefreshControl refreshing={carregando} onRefresh={carregarContadores} />
      }
    >
      <Text style={typography.title}>Olá, {auth.usuario?.nome_completo?.split(' ')[0] || 'Coordenador'} 👋</Text>
      <Text style={[typography.subtitle, styles.subtitulo]}>
        Aqui está um resumo rápido do CONSELHO+
      </Text>

      <View style={styles.linhaCards}>
        <View style={styles.card}>
          <Text style={styles.cardNumero}>{totalProfessores ?? '—'}</Text>
          <Text style={styles.cardLegenda}>Professores</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardNumero}>{totalAlunos ?? '—'}</Text>
          <Text style={styles.cardLegenda}>Alunos</Text>
        </View>
      </View>

      <View style={styles.avisoCard}>
        <Text style={styles.avisoTexto}>
          Use as abas abaixo para gerenciar professores e alunos, ou editar seu perfil.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  conteudo: {
    padding: spacing.lg,
  },
  subtitulo: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  linhaCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  cardNumero: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
  },
  cardLegenda: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  avisoCard: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
  },
  avisoTexto: {
    color: colors.text,
    fontSize: 13,
  },
});