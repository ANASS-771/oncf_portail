import { createContext, useContext, useState } from 'react';
import type { AuthResponse } from '../types';

interface AuthState {
  isLoggedIn: boolean;
  clientCode: string;
  clientName: string;
  isAdmin: boolean;
  userRole: 'admin' | 'agent' | 'client';
}

interface AuthContextValue extends AuthState {
  setAuth: (data: AuthResponse) => void;
  clearAuth: () => void;
  impersonate: (clientCode: string, clientName: string) => void;
  clearImpersonation: () => void;
}

const DEFAULTS: AuthState = {
  isLoggedIn: false,
  clientCode: '',
  clientName: '',
  isAdmin: false,
  userRole: 'client',
};

function readFromStorage(): AuthState {
  return {
    isLoggedIn: sessionStorage.getItem('isLoggedIn') === '1',
    clientCode: sessionStorage.getItem('clientCode') ?? '',
    clientName: sessionStorage.getItem('clientName') ?? '',
    isAdmin:    sessionStorage.getItem('isAdmin') === '1',
    userRole:   (sessionStorage.getItem('userRole') as AuthState['userRole']) ?? 'client',
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue>({
  ...DEFAULTS,
  setAuth: () => {},
  clearAuth: () => {},
  impersonate: () => {},
  clearImpersonation: () => {},
});

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<AuthState>(readFromStorage);

  const setAuth = (data: AuthResponse) => {
    const userRole: AuthState['userRole'] = data.isAdmin ? 'admin' : data.isAgent ? 'agent' : 'client';
    sessionStorage.setItem('isLoggedIn', '1');
    sessionStorage.setItem('clientCode', data.clientCode ?? '');
    sessionStorage.setItem('clientName', data.nomClient ?? '');
    sessionStorage.setItem('isAdmin',    data.isAdmin ? '1' : '0');
    sessionStorage.setItem('userRole',   userRole);
    setState({ isLoggedIn: true, clientCode: data.clientCode ?? '', clientName: data.nomClient ?? '', isAdmin: data.isAdmin, userRole });
  };

  const clearAuth = () => {
    sessionStorage.clear();
    setState(DEFAULTS);
  };

  const impersonate = (clientCode: string, clientName: string) => {
    sessionStorage.setItem('clientCode', clientCode);
    sessionStorage.setItem('clientName', clientName);
    setState(prev => ({ ...prev, clientCode, clientName }));
  };

  const clearImpersonation = () => {
    sessionStorage.removeItem('clientCode');
    sessionStorage.removeItem('clientName');
    setState(prev => ({ ...prev, clientCode: '', clientName: '' }));
  };

  return (
    <AuthContext.Provider value={{ ...state, setAuth, clearAuth, impersonate, clearImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
