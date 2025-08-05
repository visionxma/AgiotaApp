import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  deleteDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Devedor, Emprestimo } from '@/types';

export const storage = {
  /**
   * Obtém o ID do usuário atual
   */
  getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    return user.uid;
  },

  // Devedores
  async getDevedores(): Promise<Devedor[]> {
    try {
      const userId = this.getCurrentUserId();
      const q = query(
        collection(db, 'devedores'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const devedores: Devedor[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        devedores.push({
          id: doc.id,
          nome: data.nome,
          telefone: data.telefone,
          observacoes: data.observacoes || '',
          createdAt: data.createdAt,
        });
      });
      
      return devedores;
    } catch (error) {
      console.error('Erro ao carregar devedores:', error);
      return [];
    }
  },

  async saveDevedores(devedores: Devedor[]): Promise<void> {
    // Este método não é mais necessário com Firestore, mas mantido para compatibilidade
    console.warn('saveDevedores não é necessário com Firestore. Use addDevedor ou updateDevedor.');
  },

  async addDevedor(devedor: Devedor): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      await setDoc(doc(db, 'devedores', devedor.id), {
        ...devedor,
        userId,
      });
    } catch (error) {
      console.error('Erro ao adicionar devedor:', error);
      throw error;
    }
  },

  async updateDevedor(devedorAtualizado: Devedor): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      await updateDoc(doc(db, 'devedores', devedorAtualizado.id), {
        ...devedorAtualizado,
        userId,
      });
    } catch (error) {
      console.error('Erro ao atualizar devedor:', error);
      throw error;
    }
  },

  async deleteDevedor(devedorId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'devedores', devedorId));
    } catch (error) {
      console.error('Erro ao excluir devedor:', error);
      throw error;
    }
  },

  // Empréstimos
  async getEmprestimos(): Promise<Emprestimo[]> {
    try {
      const userId = this.getCurrentUserId();
      const q = query(
        collection(db, 'emprestimos'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const emprestimos: Emprestimo[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        emprestimos.push({
          id: doc.id,
          devedorId: data.devedorId,
          valorInicial: data.valorInicial,
          jurosMensal: data.jurosMensal,
          dataInicio: data.dataInicio,
          saldoAtual: data.saldoAtual,
          encerrado: data.encerrado,
          historico: data.historico || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      return emprestimos;
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
      return [];
    }
  },

  async saveEmprestimos(emprestimos: Emprestimo[]): Promise<void> {
    // Este método não é mais necessário com Firestore, mas mantido para compatibilidade
    console.warn('saveEmprestimos não é necessário com Firestore. Use addEmprestimo ou updateEmprestimo.');
  },

  async addEmprestimo(emprestimo: Emprestimo): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      await setDoc(doc(db, 'emprestimos', emprestimo.id), {
        ...emprestimo,
        userId,
      });
    } catch (error) {
      console.error('Erro ao adicionar empréstimo:', error);
      throw error;
    }
  },

  async updateEmprestimo(emprestimoAtualizado: Emprestimo): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      await updateDoc(doc(db, 'emprestimos', emprestimoAtualizado.id), {
        ...emprestimoAtualizado,
        userId,
      });
    } catch (error) {
      console.error('Erro ao atualizar empréstimo:', error);
      throw error;
    }
  },

  async getEmprestimosByDevedor(devedorId: string): Promise<Emprestimo[]> {
    try {
      const userId = this.getCurrentUserId();
      const q = query(
        collection(db, 'emprestimos'),
        where('userId', '==', userId),
        where('devedorId', '==', devedorId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const emprestimos: Emprestimo[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        emprestimos.push({
          id: doc.id,
          devedorId: data.devedorId,
          valorInicial: data.valorInicial,
          jurosMensal: data.jurosMensal,
          dataInicio: data.dataInicio,
          saldoAtual: data.saldoAtual,
          encerrado: data.encerrado,
          historico: data.historico || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      return emprestimos;
    } catch (error) {
      console.error('Erro ao carregar empréstimos por devedor:', error);
      return [];
    }
  }
};