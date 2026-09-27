import React, { useCallback, useState } from 'react';
import {View,Text,StyleSheet,TextInput,TouchableOpacity,Alert,ActivityIndicator,Image,Platform} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme/colors';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

function formatarTelefone(texto) {
  const numeros = texto.replace(/\D/g, '').slice(0, 11);

  if (numeros.length === 0) {
    return '';
  }

  if (numeros.length <= 2) {
    return `(${numeros}`;
  }

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

export default function CoordenadorPerfilScreen() {
  const { auth, sair } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [telefone, setTelefone] = useState('');
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const carregarPerfil = useCallback(async () => {
    if (!auth?.token) {
      return;
    }

    try {
      setCarregando(true);

      const resposta = await fetch(
        `${API_URL}/coordenadores/perfil`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro || 'Não foi possível carregar o perfil.'
        );
      }

      setPerfil(dados);
      setTelefone(formatarTelefone(dados.telefone || ''));
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro',
        erro.message || 'Não foi possível carregar o perfil.'
      );
    } finally {
      setCarregando(false);
    }
  }, [auth?.token]);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );


  // ESCOLHER FOTO
  const escolherFoto = async () => {
    try {
      const permissao =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de acesso à galeria para escolher uma foto de perfil.'
        );

        return;
      }

      const resultado =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,

          allowsEditing: true,

          aspect: [1, 1],

          quality: 0.8,
        });

      if (resultado.canceled) {
        return;
      }

      const foto = resultado.assets?.[0];

      if (!foto) {
        return;
      }

      await enviarFoto(foto);
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro',
        'Não foi possível selecionar a foto.'
      );
    }
  };

  // ENVIAR FOTO
  const enviarFoto = async (foto) => {
    try {
      setEnviandoFoto(true);

      const formulario = new FormData();

      /*
       * NO EXPO WEB:
       * a imagem pode vir como "file".
       *
       * NO CELULAR:
       * normalmente usamos uri + name + type.
       */

      if (foto.file) {
        formulario.append(
          'foto',
          foto.file,
          foto.fileName || `foto-${Date.now()}.jpg`
        );
      } else {
        formulario.append('foto', {
          uri: foto.uri,
          name:
            foto.fileName ||
            `foto-${Date.now()}.jpg`,
          type:
            foto.mimeType ||
            'image/jpeg',
        });
      }

      const resposta = await fetch(
        `${API_URL}/coordenadores/perfil/foto`,
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${auth.token}`,
          },

          /*
           * IMPORTANTE:
           * não colocar Content-Type aqui.
           * O navegador precisa criar automaticamente
           * o multipart/form-data com o boundary.
           */

          body: formulario,
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Não foi possível enviar a foto.'
        );
      }

      setPerfil((atual) => ({
        ...atual,
        foto_url: dados.fotoUrl,
      }));

      Alert.alert(
        'Sucesso',
        'Foto de perfil atualizada com sucesso.'
      );
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro',
        erro.message ||
        'Não foi possível salvar a foto.'
      );
    } finally {
      setEnviandoFoto(false);
    }
  };


  // SALVAR PERFIL
  const salvarPerfil = async () => {
    try {
      setSalvando(true);

      const resposta = await fetch(
        `${API_URL}/coordenadores/perfil`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },

          body: JSON.stringify({
            telefone: telefone.trim(),
            fotoUrl: perfil?.foto_url || null,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.erro ||
          'Não foi possível salvar o perfil.'
        );
      }

      setPerfil((atual) => ({
        ...atual,
        telefone: telefone.trim(),
      }));

      setEditando(false);

      Alert.alert(
        'Sucesso',
        'Perfil atualizado com sucesso.'
      );
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro',
        erro.message ||
        'Não foi possível salvar o perfil.'
      );
    } finally {
      setSalvando(false);
    }
  };


  // LOGOUT
const confirmarLogout = () => {
  if (Platform.OS === 'web') {
    const confirmou = window.confirm(
      'Tem certeza que deseja sair da sua conta?'
    );

    if (confirmou) {
      sair();
    }

    return;
  }

  Alert.alert(
    'Sair da conta',
    'Tem certeza que deseja sair da sua conta?',
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => sair(),
      },
    ]
  );
};;

  
  // URL DA FOTO
  const fotoCompleta = perfil?.foto_url
    ? `${API_URL.replace('/api', '')}${perfil.foto_url}`
    : null;

  
  // CARREGANDO
  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.textoCarregando}>
          Carregando perfil...
        </Text>
      </View>
    );
  }


  // ERRO
  if (!perfil) {
    return (
      <View style={styles.carregando}>
        <Text style={styles.erroTexto}>
          Não foi possível carregar seu perfil.
        </Text>
      </View>
    );
  }

  // TELA
  return (
    <View style={styles.container}>

      <Text style={typography.title}>
        Meu Perfil
      </Text>

      <Text style={typography.subtitle}>
        Visualize e edite suas informações.
      </Text>

      <View style={styles.card}>

        {/* FOTO */}

        <View style={styles.fotoContainer}>

          {fotoCompleta ? (
            <Image
              source={{ uri: fotoCompleta }}
              style={styles.foto}
            />
          ) : (
            <View style={styles.fotoPlaceholder}>
              <Ionicons
                name="person"
                size={52}
                color={colors.primary}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.botaoFoto}
            onPress={escolherFoto}
            disabled={enviandoFoto}
          >

            {enviandoFoto ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <Ionicons
                name="camera-outline"
                size={18}
                color={colors.primary}
              />
            )}

            <Text style={styles.textoBotaoFoto}>
              {enviandoFoto
                ? 'Enviando...'
                : 'Alterar foto'}
            </Text>

          </TouchableOpacity>

        </View>

        {/* NOME */}

        <View style={styles.campo}>

          <Text style={styles.label}>
            Nome completo
          </Text>

          <View style={styles.campoDesabilitado}>

            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textMuted}
            />

            <Text style={styles.valor}>
              {perfil.nome_completo}
            </Text>

          </View>

        </View>

        {/* EMAIL */}

        <View style={styles.campo}>

          <Text style={styles.label}>
            E-mail
          </Text>

          <View style={styles.campoDesabilitado}>

            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textMuted}
            />

            <Text style={styles.valor}>
              {perfil.email}
            </Text>

          </View>

        </View>

        {/* TELEFONE */}

        <View style={styles.campo}>

          <Text style={styles.label}>
            Telefone
          </Text>

          {editando ? (

            <View style={styles.inputContainer}>

              <Ionicons
                name="call-outline"
                size={20}
                color={colors.primary}
              />

              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={(texto) =>
                  setTelefone(
                    formatarTelefone(texto)
                  )
                }
                placeholder="(DDD) 98888-7777"
                placeholderTextColor={
                  colors.textMuted
                }
                keyboardType="phone-pad"
                maxLength={15}
              />

            </View>

          ) : (

            <View style={styles.campoDesabilitado}>

              <Ionicons
                name="call-outline"
                size={20}
                color={colors.textMuted}
              />

              <Text style={styles.valor}>
                {perfil.telefone ||
                  'Não informado'}
              </Text>

            </View>

          )}

        </View>

        {/* BOTÕES DE EDIÇÃO */}

        {editando ? (

          <View style={styles.botoes}>

            <TouchableOpacity
              style={styles.botaoCancelar}
              onPress={() => {
                setTelefone(
                  formatarTelefone(
                    perfil.telefone || ''
                  )
                );

                setEditando(false);
              }}
              disabled={salvando}
            >

              <Text style={styles.textoCancelar}>
                Cancelar
              </Text>

            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoSalvar}
              onPress={salvarPerfil}
              disabled={salvando}
            >

              {salvando ? (

                <ActivityIndicator
                  color={colors.primaryDark}
                />

              ) : (

                <>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primaryDark}
                  />

                  <Text style={styles.textoSalvar}>
                    Salvar
                  </Text>
                </>

              )}

            </TouchableOpacity>

          </View>

        ) : (

          <TouchableOpacity
            style={styles.botaoEditar}
            onPress={() =>
              setEditando(true)
            }
          >

            <Ionicons
              name="create-outline"
              size={20}
              color={colors.primaryDark}
            />

            <Text style={styles.textoEditar}>
              Editar perfil
            </Text>

          </TouchableOpacity>

        )}

        {/* LOGOUT */}

        <TouchableOpacity
          style={styles.botaoLogout}
          onPress={confirmarLogout}
        >

          <Ionicons
            name="log-out-outline"
            size={20}
            color={colors.danger}
          />

          <Text style={styles.textoLogout}>
            Sair da conta
          </Text>

        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },

  carregando: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  textoCarregando: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 15,
  },

  erroTexto: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  fotoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  fotoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },

  foto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: colors.accentStrong,
  },

  botaoFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 6,
  },

  textoBotaoFoto: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  campo: {
    marginBottom: spacing.md,
  },

  label: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },

  campoDesabilitado: {
    minHeight: 48,
    backgroundColor: '#F5F2F1',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  valor: {
    flex: 1,
    color: colors.primary,
    fontSize: 15,
  },

  inputContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.accentStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
  },

  input: {
    flex: 1,
    color: colors.primary,
    fontSize: 15,
  },

  botoes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
  },

  botaoCancelar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCancelar: {
    color: colors.primary,
    fontWeight: '700',
  },

  botaoSalvar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  textoSalvar: {
    color: colors.primaryDark,
    fontWeight: '800',
  },

  botaoEditar: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: spacing.sm,
  },

  textoEditar: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 15,
  },

  botaoLogout: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: spacing.lg,
  },

  textoLogout: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 15,
  },
});