import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { CirclePlus as PlusCircle, Phone, FileText } from 'lucide-react-native';
import { Devedor } from '@/types';
import { storage } from '@/utils/storage';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function Devedores() {
  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDevedores = async () => {
    try {
      const data = await storage.getDevedores();
      setDevedores(data);
    } catch (error) {
      console.error('Erro ao carregar devedores:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDevedores();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      carregarDevedores();
    }, [])
  );

  const handleDevedorPress = (devedor: Devedor) => {
    router.push(`/devedor/${devedor.id}` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Devedores</Text>
        <Text style={styles.subtitle}>Gerenciar pessoas</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card>
          <Button
            title="Cadastrar Novo Devedor"
            onPress={() => router.push('/devedor/novo')}
          />
        </Card>

        {devedores.length === 0 ? (
          <Card>
            <View style={styles.emptyState}>
              <PlusCircle size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Nenhum devedor cadastrado</Text>
              <Text style={styles.emptySubtext}>
                Comece cadastrando as pessoas para quem você empresta dinheiro
              </Text>
            </View>
          </Card>
        ) : (
          devedores.map(devedor => (
            <TouchableOpacity
              key={devedor.id}
              onPress={() => handleDevedorPress(devedor)}
              activeOpacity={0.7}
            >
              <Card>
                <View style={styles.devedorHeader}>
                  <Text style={styles.nomeDevedor}>{devedor.nome}</Text>
                </View>
                
                <View style={styles.devedorInfo}>
                  <View style={styles.infoRow}>
                    <Phone size={16} color="#6b7280" />
                    <Text style={styles.infoText}>{devedor.telefone}</Text>
                  </View>
                  
                  {devedor.observacoes ? (
                    <View style={styles.infoRow}>
                      <FileText size={16} color="#6b7280" />
                      <Text style={styles.infoText} numberOfLines={2}>
                        {devedor.observacoes}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  devedorHeader: {
    marginBottom: 12,
  },
  nomeDevedor: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  devedorInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
});