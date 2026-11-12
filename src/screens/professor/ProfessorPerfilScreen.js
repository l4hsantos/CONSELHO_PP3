import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export default function ProfessorPerfilScreen() {
  const { auth, sair } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregarPerfil = useCallback(async () => {
    if (!auth?.token) {
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(`${API_URL}/professores/perfil`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const texto = await resposta.text();
      const dados = texto ? JSON.parse(texto) : {};

      if (!resposta.ok) {
        throw new Error(dados.erro || "Não foi possível carregar o perfil.");
      }

      setPerfil(dados);
    } catch (erro) {
      Alert.alert("Erro", erro.message || "Não foi possível carregar o perfil.");
    } finally {
      setCarregando(false);
    }
  }, [auth?.token]);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );

  function confirmarLogout() {
    if (Platform.OS === "web") {
      const confirmou = window.confirm("Tem certeza que deseja sair da sua conta?");
      if (confirmou) sair();
      return;
    }

    Alert.alert("Sair da conta", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => sair() },
    ]);
  }

  if (carregando) {
    return (
      <View style={styles.centralizado}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.textoAuxiliar}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!perfil) {
    return (
      <View style={styles.centralizado}>
        <Text style={styles.textoAuxiliar}>
          Não foi possível carregar as informações do perfil.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={carregarPerfil}>
          <Text style={styles.textoBotao}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
    >
      <View style={styles.fotoContainer}>
        <View style={styles.fotoPlaceholder}>
          <Ionicons name="person" size={46} color={colors.primary} />
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Nome completo</Text>
        <View style={styles.campoDesabilitado}>
          <Ionicons name="person-outline" size={18} color="#806F6F" />
          <Text style={styles.valor}>{perfil.nome_completo}</Text>
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>E-mail</Text>
        <View style={styles.campoDesabilitado}>
          <Ionicons name="mail-outline" size={18} color="#806F6F" />
          <Text style={styles.valor}>{perfil.email}</Text>
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Telefone</Text>
        <View style={styles.campoDesabilitado}>
          <Ionicons name="call-outline" size={18} color="#806F6F" />
          <Text style={styles.valor}>Não cadastrado</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.botaoLogout}
        onPress={confirmarLogout}
        activeOpacity={0.75}
      >
        <Ionicons name="log-out-outline" size={18} color="#B42318" />
        <Text style={styles.textoLogout}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 19,
    paddingTop: 16,
    paddingBottom: 24,
  },
  centralizado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  textoAuxiliar: {
    color: "#514646",
    textAlign: "center",
    marginTop: 10,
  },
  botao: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 14,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  fotoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  fotoPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: "#C6DDE8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  campo: {
    marginBottom: 14,
  },
  label: {
    color: "#382B2B",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  campoDesabilitado: {
    minHeight: 38,
    backgroundColor: "#F4F1F0",
    borderRadius: 9,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  valor: {
    flex: 1,
    color: "#514646",
    fontSize: 12,
  },
  botaoLogout: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#D66A5F",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginTop: 12,
  },
  textoLogout: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "700",
  },
});