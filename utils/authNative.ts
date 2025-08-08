import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, RegisterData } from '@/types/auth';
import { firebaseNative } from './firebaseNative';

const REMEMBER_ME_KEY = '@remember_me';

export const authNative = {
  /**
   * Valida formato de email
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida força da senha
   */
  validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 6) {
      return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Senha deve conter pelo menos uma letra minúscula' };
    }
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Senha deve conter pelo menos um número' };
    }
    return { isValid: true, message: 'Senha válida' };
  },

  /**
   * Registra novo usuário
   */
  async register(userData: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const { name, email, password, confirmPassword } = userData;

      // Validações
      if (!name.trim()) {
        return { success: false, message: 'Nome é obrigatório' };
      }

      if (!this.validateEmail(email)) {
        return { success: false, message: 'Email inválido' };
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message };
      }

      if (password !== confirmPassword) {
        return { success: false, message: 'Senhas não coincidem' };
      }

      // Cria usuário no Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Atualiza o perfil com o nome
      await firebaseUser.updateProfile({
        displayName: name
      });

      // Salva dados adicionais no Firestore
      await firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .set({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });

      const user = firebaseNative.convertFirebaseUser(firebaseUser);
      return { success: true, message: 'Usuário cadastrado com sucesso!', user };
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      let message = 'Erro interno. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Email já cadastrado';
      } else if (error.code === 'auth/weak-password') {
        message = 'Senha muito fraca';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Erro de conexão. Verifique sua internet.';
      }
      
      return { success: false, message };
    }
  },

  /**
   * Faz login do usuário
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const { email, password, rememberMe } = credentials;

      // Validações básicas
      if (!email.trim() || !password.trim()) {
        return { success: false, message: 'Email e senha são obrigatórios' };
      }

      // Faz login no Firebase
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;

      // Atualiza último login no Firestore
      await firestore()
        .collection('users')
        .doc(firebaseUser.uid)
        .update({
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });

      // Salva preferência "Lembrar-me"
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ email, rememberMe: true }));
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      }

      const user = firebaseNative.convertFirebaseUser(firebaseUser);
      return { success: true, message: 'Login realizado com sucesso!', user };
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let message = 'Erro interno. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        message = 'Email não encontrado';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Senha incorreta';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido';
      } else if (error.code === 'auth/user-disabled') {
        message = 'Conta desabilitada';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas. Tente novamente mais tarde';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Erro de conexão. Verifique sua internet.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Credenciais inválidas';
      }
      
      return { success: false, message };
    }
  },

  /**
   * Faz logout do usuário
   */
  async logout(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  },

  /**
   * Busca usuário atual
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = auth().currentUser;
      if (firebaseUser) {
        return firebaseNative.convertFirebaseUser(firebaseUser);
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return null;
    }
  },

  /**
   * Busca dados salvos do "Lembrar-me"
   */
  async getRememberedCredentials(): Promise<{ email: string; rememberMe: boolean } | null> {
    try {
      const data = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao buscar credenciais salvas:', error);
      return null;
    }
  },

  /**
   * Envia email de recuperação de senha
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validateEmail(email)) {
        return { success: false, message: 'Email inválido' };
      }

      await auth().sendPasswordResetEmail(email);
      return { 
        success: true, 
        message: 'Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.' 
      };
    } catch (error: any) {
      console.error('Erro na recuperação de senha:', error);
      
      let message = 'Erro interno. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        message = 'Email não encontrado';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Email inválido';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Erro de conexão. Verifique sua internet.';
      }
      
      return { success: false, message };
    }
  },

  /**
   * Observa mudanças no estado de autenticação
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const user = firebaseNative.convertFirebaseUser(firebaseUser);
        callback(user);
      } else {
        callback(null);
      }
    });
  },

  /**
   * Converte FirebaseUser para User local (compatibilidade)
   */
  convertFirebaseUser(firebaseUser: FirebaseAuthTypes.User): User {
    return firebaseNative.convertFirebaseUser(firebaseUser);
  }
};

// Export para compatibilidade
export const authService = authNative;
export default authNative;