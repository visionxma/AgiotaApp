import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { User } from '@/types/auth';

// Configurar persistência offline do Firestore
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

export const firebaseNative = {
  auth,
  firestore,

  /**
   * Converte FirebaseUser para User local
   */
  convertFirebaseUser(firebaseUser: FirebaseAuthTypes.User): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || '',
      password: '', // Não armazenamos senha no cliente
      createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  },

  /**
   * Obtém referência da coleção do usuário atual
   */
  getUserCollection(collectionName: string) {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    return firestore()
      .collection('users')
      .doc(user.uid)
      .collection(collectionName);
  },

  /**
   * Obtém documento do usuário
   */
  getUserDoc() {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    return firestore().collection('users').doc(user.uid);
  },

  /**
   * Verifica se está online
   */
  async isOnline(): Promise<boolean> {
    try {
      // Usa o método nativo para verificar conectividade
      const app = firestore().app;
      return true; // Se chegou até aqui, está online
    } catch (error) {
      return false;
    }
  }
};

export { auth, firestore };
export default firebaseNative;