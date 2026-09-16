import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default function CoordenadorProfessoresScreen() {
  return (
    <View style={styles.container}>
      <Text style={typography.title}>Professores</Text>
      <Text style={typography.subtitle}>Em construção — próxima etapa 🚧</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});