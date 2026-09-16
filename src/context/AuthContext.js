import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(null); // { token, perfil, usuário }

  function entrar(dados) {
    setAuth(dados);
  }

  function sair() {
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pra usar em qlqr tela: const { auth, sair } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}