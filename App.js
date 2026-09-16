import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import CoordenadorTabs from './src/navigation/CoordenadorTabs';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
          {/* Home genérica: usada por aluno e professor até criarmos as telas deles */}
          <Stack.Screen name="Home" component={HomeScreen} />
          {/* Coordenador vai direto pras abas dele */}
          <Stack.Screen name="CoordenadorTabs" component={CoordenadorTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}