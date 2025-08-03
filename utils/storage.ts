import AsyncStorage from '@react-native-async-storage/async-storage';
import { Devedor, Emprestimo } from '@/types';

const DEVEDORES_KEY = '@devedores';
const EMPRESTIMOS_KEY = '@emprestimos';

export const storage = {
  // Devedores
  async getDevedores(): Promise<Devedor[]> {
    try {
      const data = await AsyncStorage.getItem(DEVEDORES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar devedores:', error);
      return [];
    }
  },

  async saveDevedores(devedores: Devedor[]): Promise<void> {
    try {
      await AsyncStorage.setItem(DEVEDORES_KEY, JSON.stringify(devedores));
    } catch (error) {
      console.error('Erro ao salvar devedores:', error);
    }
  },

  async addDevedor(devedor: Devedor): Promise<void> {
    const devedores = await this.getDevedores();
    devedores.push(devedor);
    await this.saveDevedores(devedores);
  },

  async updateDevedor(devedorAtualizado: Devedor): Promise<void> {
    const devedores = await this.getDevedores();
    const index = devedores.findIndex(d => d.id === devedorAtualizado.id);
    if (index !== -1) {
      devedores[index] = devedorAtualizado;
      await this.saveDevedores(devedores);
    }
  },

  // Empréstimos
  async getEmprestimos(): Promise<Emprestimo[]> {
    try {
      const data = await AsyncStorage.getItem(EMPRESTIMOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
      return [];
    }
  },

  async saveEmprestimos(emprestimos: Emprestimo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(EMPRESTIMOS_KEY, JSON.stringify(emprestimos));
    } catch (error) {
      console.error('Erro ao salvar empréstimos:', error);
    }
  },

  async addEmprestimo(emprestimo: Emprestimo): Promise<void> {
    const emprestimos = await this.getEmprestimos();
    emprestimos.push(emprestimo);
    await this.saveEmprestimos(emprestimos);
  },

  async updateEmprestimo(emprestimoAtualizado: Emprestimo): Promise<void> {
    const emprestimos = await this.getEmprestimos();
    const index = emprestimos.findIndex(e => e.id === emprestimoAtualizado.id);
    if (index !== -1) {
      emprestimos[index] = emprestimoAtualizado;
      await this.saveEmprestimos(emprestimos);
    }
  },

  async getEmprestimosByDevedor(devedorId: string): Promise<Emprestimo[]> {
    const emprestimos = await this.getEmprestimos();
    return emprestimos.filter(e => e.devedorId === devedorId);
  }
};