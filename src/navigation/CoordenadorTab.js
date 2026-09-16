import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import CoordenadorHomeScreen from '../screens/coordenador/CoordenadorHomeScreen';
import CoordenadorProfessoresScreen from '../screens/coordenador/CoordenadorProfessoresScreen';
import CoordenadorAlunosScreen from '../screens/coordenador/CoordenadorAlunosScreen';
import CoordenadorPerfilScreen from '../screens/coordenador/CoordenadorPerfilScreen';

const Tab = createBottomTabNavigator();

const ICONES = {
  Início: 'home-outline',
  Professores: 'people-outline',
  Alunos: 'school-outline',
  Perfil: 'person-circle-outline',
};

export default function CoordenadorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONES[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Início" component={CoordenadorHomeScreen} />
      <Tab.Screen name="Professores" component={CoordenadorProfessoresScreen} />
      <Tab.Screen name="Alunos" component={CoordenadorAlunosScreen} />
      <Tab.Screen name="Perfil" component={CoordenadorPerfilScreen} />
    </Tab.Navigator>
  );
}