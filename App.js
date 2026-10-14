import React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import CoordenadorTabs from './src/navigation/CoordenadorTabs';
import ProfessorTabs from './src/navigation/ProfessorTabs';

const Stack = createNativeStackNavigator();

function Navegacao() {
  const { auth } = useAuth();

  return (
    <NavigationContainer>
      <StatusBar style="dark" />

      <Stack.Navigator
        screenOptions={{ headerShown: false }}
      >
        {!auth ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />

            <Stack.Screen
              name="Cadastro"
              component={CadastroScreen}
            />
          </>
        ) : auth.perfil === 'coordenador' ? (
          <Stack.Screen
            name="CoordenadorTabs"
            component={CoordenadorTabs}
          />
        ) : auth.perfil === 'professor' ? (
          <Stack.Screen
            name="ProfessorTabs"
            component={ProfessorTabs}
          />
        ): (
          <Stack.Screen
            name="Home"
            component={HomeScreen}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navegacao />
    </AuthProvider>
  );
}