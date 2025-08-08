import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import auth from '@react-native-firebase/auth';
import { AuthState, User, LoginCredentials, RegisterData } from '@/types/auth';
import { authNative } from '@/utils/authNative';
import { storageNative } from '@/utils/storageNative';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  checkAuthState: () => Promise<void>;
  syncData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  const [syncListenersCleanup, setSyncListenersCleanup] = useState<(() => void) | null>(null);

  const checkAuthState = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Use Firebase onAuthStateChanged para estado em tempo real
      const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          const user = authNative.convertFirebaseUser ? 
            authNative.convertFirebaseUser(firebaseUser) : 
            {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              password: '',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };

          setAuthState({
            isAuthenticated: true,
            user,
            isLoading: false,
          });

          // Configura listeners de sincronização
          const cleanup = storageNative.setupSyncListeners();
          setSyncListenersCleanup(() => cleanup);

          // Tenta sincronizar dados pendentes
          await storageNative.syncPendingData();
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });

          // Limpa listeners de sincronização
          if (syncListenersCleanup) {
            syncListenersCleanup();
            setSyncListenersCleanup(null);
          }

          // Limpa cache do usuário
          await storageNative.clearUserCache();
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao verificar estado de autenticação:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const result = await authNative.login(credentials);
      
      if (result.success && result.user) {
        setAuthState({
          isAuthenticated: true,
          user: result.user,
          isLoading: false,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      
      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, message: 'Erro interno. Tente novamente.' };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const result = await authNative.register(userData);
      
      if (result.success && result.user) {
        // Após registro bem-sucedido, faz login automático
        const loginResult = await authNative.login({
          email: userData.email,
          password: userData.password,
        });
        
        if (loginResult.success && loginResult.user) {
          setAuthState({
            isAuthenticated: true,
            user: loginResult.user,
            isLoading: false,
          });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      
      return result;
    } catch (error) {
      console.error('Erro no registro:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { success: false, message: 'Erro interno. Tente novamente.' };
    }
  };

  const logout = async () => {
    try {
      // Limpa listeners de sincronização
      if (syncListenersCleanup) {
        syncListenersCleanup();
        setSyncListenersCleanup(null);
      }

      await authNative.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    return await authNative.forgotPassword(email);
  };

  const syncData = async () => {
    try {
      await storageNative.syncPendingData();
    } catch (error) {
      console.error('Erro na sincronização manual:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = checkAuthState();
    
    // Cleanup na desmontagem
    return () => {
      unsubscribe?.then(unsub => unsub?.());
      if (syncListenersCleanup) {
        syncListenersCleanup();
      }
    };
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    forgotPassword,
    checkAuthState,
    syncData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}