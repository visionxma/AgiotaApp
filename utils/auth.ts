import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'react-native-crypto-js';
import { User, LoginCredentials, RegisterData } from '@/types/auth';
import uuid from 'react-native-uuid';
import dayjs from 'dayjs';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@current_user';
const REMEMBER_ME_KEY = '@remember_me';

// Chave para criptografia (em produção, use uma chave mais segura)
const ENCRYPTION_KEY = 'loan_app_secret_key_2024';

export const authService = {
  /**
   * Criptografa a senha usando AES
   */
  encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
  },

  /**
   * Descriptografa a senha
   */
  decryptPassword(encryptedPassword: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  },

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
   * Busca todos os usuários
   */
  async getUsers(): Promise<User[]> {
    try {
      const data = await AsyncStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  /**
   * Salva lista de usuários
   */
  async saveUsers(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Erro ao salvar usuários:', error);
      throw new Error('Falha ao salvar dados do usuário');
    }
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

      // Verifica se usuário já existe
      const users = await this.getUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        return { success: false, message: 'Email já cadastrado' };
      }

      // Cria novo usuário
      const newUser: User = {
        id: uuid.v4() as string,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: this.encryptPassword(password),
        createdAt: dayjs().toISOString(),
      };

      // Salva usuário
      users.push(newUser);
      await this.saveUsers(users);

      return { success: true, message: 'Usuário cadastrado com sucesso!', user: newUser };
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, message: 'Erro interno. Tente novamente.' };
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

      // Busca usuário
      const users = await this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

      if (!user) {
        return { success: false, message: 'Email não encontrado' };
      }

      // Verifica senha
      const decryptedPassword = this.decryptPassword(user.password);
      if (decryptedPassword !== password) {
        return { success: false, message: 'Senha incorreta' };
      }

      // Atualiza último login
      const updatedUser = { ...user, lastLogin: dayjs().toISOString() };
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      await this.saveUsers(updatedUsers);

      // Salva usuário atual
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

      // Salva preferência "Lembrar-me"
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ email, rememberMe: true }));
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      }

      return { success: true, message: 'Login realizado com sucesso!', user: updatedUser };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro interno. Tente novamente.' };
    }
  },

  /**
   * Faz logout do usuário
   */
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  },

  /**
   * Busca usuário atual
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
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
   * Simula recuperação de senha (em produção, enviaria email)
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validateEmail(email)) {
        return { success: false, message: 'Email inválido' };
      }

      const users = await this.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

      if (!user) {
        return { success: false, message: 'Email não encontrado' };
      }

      // Em produção, aqui enviaria um email com link de recuperação
      return { 
        success: true, 
        message: 'Instruções de recuperação foram enviadas para seu email (funcionalidade simulada)' 
      };
    } catch (error) {
      console.error('Erro na recuperação de senha:', error);
      return { success: false, message: 'Erro interno. Tente novamente.' };
    }
  }
};