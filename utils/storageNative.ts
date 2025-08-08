import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Devedor, Emprestimo } from '@/types';

// Chaves para cache local
const CACHE_KEYS = {
  DEVEDORES: '@devedores_cache',
  EMPRESTIMOS: '@emprestimos_cache',
  LAST_SYNC: '@last_sync',
};

export const storageNative = {
  /**
   * Obtém o ID do usuário atual
   */
  getCurrentUserId(): string {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    return user.uid;
  },

  /**
   * Verifica se está online
   */
  async isOnline(): Promise<boolean> {
    try {
      // Tenta fazer uma operação simples para verificar conectividade
      await firestore().app.utils().isNetworkEnabled;
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Salva dados no cache local
   */
  async saveToCache(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  },

  /**
   * Carrega dados do cache local
   */
  async loadFromCache<T>(key: string): Promise<T[]> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar do cache:', error);
      return [];
    }
  },

  /**
   * Limpa cache do usuário
   */
  async clearUserCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.DEVEDORES),
        AsyncStorage.removeItem(CACHE_KEYS.EMPRESTIMOS),
        AsyncStorage.removeItem(CACHE_KEYS.LAST_SYNC),
      ]);
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  },

  // ==================== DEVEDORES ====================

  /**
   * Obtém devedores (online/offline)
   */
  async getDevedores(): Promise<Devedor[]> {
    try {
      const userId = this.getCurrentUserId();
      const isOnline = await this.isOnline();

      if (isOnline) {
        // Busca dados online
        const snapshot = await firestore()
          .collection('users')
          .doc(userId)
          .collection('devedores')
          .orderBy('createdAt', 'desc')
          .get();

        const devedores: Devedor[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          devedores.push({
            id: doc.id,
            nome: data.nome,
            telefone: data.telefone,
            observacoes: data.observacoes || '',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          });
        });

        // Salva no cache
        await this.saveToCache(CACHE_KEYS.DEVEDORES, devedores);
        return devedores;
      } else {
        // Busca dados do cache offline
        console.log('Modo offline: carregando devedores do cache');
        return await this.loadFromCache<Devedor>(CACHE_KEYS.DEVEDORES);
      }
    } catch (error) {
      console.error('Erro ao carregar devedores:', error);
      // Em caso de erro, tenta carregar do cache
      return await this.loadFromCache<Devedor>(CACHE_KEYS.DEVEDORES);
    }
  },

  /**
   * Adiciona devedor
   */
  async addDevedor(devedor: Devedor): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOnline = await this.isOnline();

      if (isOnline) {
        // Salva online
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('devedores')
          .doc(devedor.id)
          .set({
            ...devedor,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      }

      // Sempre salva no cache local
      const devedoresCache = await this.loadFromCache<Devedor>(CACHE_KEYS.DEVEDORES);
      const devedoresAtualizados = [devedor, ...devedoresCache.filter(d => d.id !== devedor.id)];
      await this.saveToCache(CACHE_KEYS.DEVEDORES, devedoresAtualizados);

      // Se offline, marca para sincronização posterior
      if (!isOnline) {
        await this.markForSync('devedores', devedor.id, 'create', devedor);
      }
    } catch (error) {
      console.error('Erro ao adicionar devedor:', error);
      throw error;
    }
  },

  /**
   * Atualiza devedor
   */
  async updateDevedor(devedorAtualizado: Devedor): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOnline = await this.isOnline();

      if (isOnline) {
        // Atualiza online
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('devedores')
          .doc(devedorAtualizado.id)
          .update(devedorAtualizado);
      }

      // Sempre atualiza no cache local
      const devedoresCache = await this.loadFromCache<Devedor>(CACHE_KEYS.DEVEDORES);
      const devedoresAtualizados = devedoresCache.map(d => 
        d.id === devedorAtualizado.id ? devedorAtualizado : d
      );
      await this.saveToCache(CACHE_KEYS.DEVEDORES, devedoresAtualizados);

      // Se offline, marca para sincronização posterior
      if (!isOnline) {
        await this.markForSync('devedores', devedorAtualizado.id, 'update', devedorAtualizado);
      }
    } catch (error) {
      console.error('Erro ao atualizar devedor:', error);
      throw error;
    }
  },

  /**
   * Exclui devedor
   */
  async deleteDevedor(devedorId: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOnline = await this.isOnline();

      if (isOnline) {
        // Exclui online
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('devedores')
          .doc(devedorId)
          .delete();
      }

      // Sempre remove do cache local
      const devedoresCache = await this.loadFromCache<Devedor>(CACHE_KEYS.DEVEDORES);
      const devedoresAtualizados = devedoresCache.filter(d => d.id !== devedorId);
      await this.saveToCache(CACHE_KEYS.DEVEDORES, devedoresAtualizados);

      // Se offline, marca para sincronização posterior
      if (!isOnline) {
        await this.markForSync('devedores', devedorId, 'delete', null);
      }
    } catch (error) {
      console.error('Erro ao excluir devedor:', error);
      throw error;
    }
  },

  // ==================== EMPRÉSTIMOS ====================

  /**
   * Obtém empréstimos (online/offline)
   */
  async getEmprestimos(): Promise<Emprestimo[]> {
    try {
      const userId = this.getCurrentUserId();
      const isOnline = await this.isOnline();

      if (isOnline) {
        // Busca dados online
        const snapshot = await firestore()
          .collection('users')
          .doc(userId)
          .collection('emprestimos')
          .orderBy('createdAt', 'desc')
          .get();

        const emprestimos: Emprestimo[] = [];
        snapshot.forEach((doc) => {
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
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          });
        });

        // Salva no cache
        await this.saveToCache(CACHE_KEYS.EMPRESTIMOS, emprestimos);
        return emprestimos;
      } else {
        // Busca dados do cache offline
        console.log('Modo offline: carregando empréstimos do cache');
        return await this.loadFromCache<Emprestimo>(CACHE_KEYS.EMPRESTIMOS);
      }
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
      // Em caso de erro, tenta carregar do cache
      return await this.loadFromCache<Emprestimo>(CACHE_KEYS.EMPRESTIMOS);
    }
  },

  /**
   * Adiciona empréstimo
   */
  async addEmprestimo(emprestimo: Emprestimo): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOnline = await this.isOnline();

      if (isOnline) {
        // Salva online
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('emprestimos')
          .doc(emprestimo.id)
          .set({
            ...emprestimo,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
      }

      // Sempre salva no cache local
      const emprestimosCache = await this.loadFromCache<Emprestimo>(CACHE_KEYS.EMPRESTIMOS);
      const emprestimosAtualizados = [emprestimo, ...emprestimosCache.filter(e => e.id !== emprestimo.id)];
      await this.saveToCache(CACHE_KEYS.EMPRESTIMOS, emprestimosAtualizados);

      // Se offline, marca para sincronização posterior
      if (!isOnline) {
        await this.markForSync('emprestimos', emprestimo.id, 'create', emprestimo);
      }
    } catch (error) {
      console.error('Erro ao adicionar empréstimo:', error);
      throw error;
    }
  },

  /**
   * Atualiza empréstimo
   */
  async updateEmprestimo(emprestimoAtualizado: Emprestimo): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const isOnline = await this.isOnline();

      if (isOnline) {
        // Atualiza online
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('emprestimos')
          .doc(emprestimoAtualizado.id)
          .update({
            ...emprestimoAtualizado,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
      }

      // Sempre atualiza no cache local
      const emprestimosCache = await this.loadFromCache<Emprestimo>(CACHE_KEYS.EMPRESTIMOS);
      const emprestimosAtualizados = emprestimosCache.map(e => 
        e.id === emprestimoAtualizado.id ? emprestimoAtualizado : e
      );
      await this.saveToCache(CACHE_KEYS.EMPRESTIMOS, emprestimosAtualizados);

      // Se offline, marca para sincronização posterior
      if (!isOnline) {
        await this.markForSync('emprestimos', emprestimoAtualizado.id, 'update', emprestimoAtualizado);
      }
    } catch (error) {
      console.error('Erro ao atualizar empréstimo:', error);
      throw error;
    }
  },

  /**
   * Obtém empréstimos por devedor
   */
  async getEmprestimosByDevedor(devedorId: string): Promise<Emprestimo[]> {
    try {
      const emprestimos = await this.getEmprestimos();
      return emprestimos.filter(e => e.devedorId === devedorId);
    } catch (error) {
      console.error('Erro ao carregar empréstimos por devedor:', error);
      return [];
    }
  },

  // ==================== SINCRONIZAÇÃO ====================

  /**
   * Marca item para sincronização quando voltar online
   */
  async markForSync(collection: string, id: string, operation: 'create' | 'update' | 'delete', data: any): Promise<void> {
    try {
      const syncKey = `@sync_${collection}`;
      const syncData = await AsyncStorage.getItem(syncKey);
      const syncQueue = syncData ? JSON.parse(syncData) : [];
      
      syncQueue.push({
        id,
        collection,
        operation,
        data,
        timestamp: new Date().toISOString(),
      });

      await AsyncStorage.setItem(syncKey, JSON.stringify(syncQueue));
    } catch (error) {
      console.error('Erro ao marcar para sincronização:', error);
    }
  },

  /**
   * Sincroniza dados pendentes quando voltar online
   */
  async syncPendingData(): Promise<void> {
    try {
      const isOnline = await this.isOnline();
      if (!isOnline) return;

      const userId = this.getCurrentUserId();
      
      // Sincroniza devedores
      await this.syncCollection('devedores', userId);
      
      // Sincroniza empréstimos
      await this.syncCollection('emprestimos', userId);

      console.log('Sincronização concluída com sucesso');
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  },

  /**
   * Sincroniza uma coleção específica
   */
  async syncCollection(collectionName: string, userId: string): Promise<void> {
    try {
      const syncKey = `@sync_${collectionName}`;
      const syncData = await AsyncStorage.getItem(syncKey);
      
      if (!syncData) return;

      const syncQueue = JSON.parse(syncData);
      const batch = firestore().batch();

      for (const item of syncQueue) {
        const docRef = firestore()
          .collection('users')
          .doc(userId)
          .collection(collectionName)
          .doc(item.id);

        switch (item.operation) {
          case 'create':
          case 'update':
            batch.set(docRef, {
              ...item.data,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();
      
      // Remove da fila de sincronização
      await AsyncStorage.removeItem(syncKey);
    } catch (error) {
      console.error(`Erro ao sincronizar ${collectionName}:`, error);
    }
  },

  /**
   * Configura listeners para sincronização automática
   */
  setupSyncListeners(): () => void {
    const userId = this.getCurrentUserId();
    
    // Listener para devedores
    const unsubscribeDevedores = firestore()
      .collection('users')
      .doc(userId)
      .collection('devedores')
      .onSnapshot(
        (snapshot) => {
          const devedores: Devedor[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            devedores.push({
              id: doc.id,
              nome: data.nome,
              telefone: data.telefone,
              observacoes: data.observacoes || '',
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            });
          });
          this.saveToCache(CACHE_KEYS.DEVEDORES, devedores);
        },
        (error) => {
          console.error('Erro no listener de devedores:', error);
        }
      );

    // Listener para empréstimos
    const unsubscribeEmprestimos = firestore()
      .collection('users')
      .doc(userId)
      .collection('emprestimos')
      .onSnapshot(
        (snapshot) => {
          const emprestimos: Emprestimo[] = [];
          snapshot.forEach((doc) => {
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
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            });
          });
          this.saveToCache(CACHE_KEYS.EMPRESTIMOS, emprestimos);
        },
        (error) => {
          console.error('Erro no listener de empréstimos:', error);
        }
      );

    // Retorna função para cancelar listeners
    return () => {
      unsubscribeDevedores();
      unsubscribeEmprestimos();
    };
  },

  // Métodos de compatibilidade (mantidos para não quebrar o código existente)
  async saveDevedores(devedores: Devedor[]): Promise<void> {
    console.warn('saveDevedores é deprecated. Use addDevedor ou updateDevedor.');
  },

  async saveEmprestimos(emprestimos: Emprestimo[]): Promise<void> {
    console.warn('saveEmprestimos é deprecated. Use addEmprestimo ou updateEmprestimo.');
  },
};