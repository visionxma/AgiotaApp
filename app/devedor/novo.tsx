import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import uuid from 'react-native-uuid';
import dayjs from 'dayjs';
import { Devedor } from '@/types';
import { storage } from '@/utils/storageNative';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function NovoDevedor() {
  const [nome, setNome] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const validarFormulario = (): boolean => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return false;
    }

    if (!telefone.trim()) {
      Alert.alert('Erro', 'O telefone é obrigatório');
      return false;
    }

    return true;
  };

  const salvarDevedor = async () => {
    if (!validarFormulario()) return;

    setLoading(true);

    try {
      const novoDevedor: Devedor = {
        id: uuid.v4() as string,
        nome: nome.trim(),
        telefone: telefone.trim(),
        observacoes: observacoes.trim(),
        createdAt: dayjs().toISOString()
      };

      await storage.addDevedor(novoDevedor);

      Alert.alert(
        'Sucesso',
        'Devedor cadastrado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              setNome('');
              setTelefone('');
              setObservacoes('');
              router.replace('/(tabs)/devedores');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar devedor:', error);
      Alert.alert('Erro', 'Falha ao cadastrar devedor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Novo Devedor</Text>
        <Text style={styles.subtitle}>Cadastrar pessoa</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <Card>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>

          <Input
            label="Nome Completo *"
            value={nome}
            onChangeText={setNome}
            placeholder="João da Silva"
            autoCapitalize="words"
          />

          <Input
            label="Telefone *"
            value={telefone}
            onChangeText={setTelefone}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
          />

          <Input
            label="Observações"
            value={observacoes}
            onChangeText={setObservacoes}
            placeholder="Informações adicionais sobre a pessoa..."
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Salvando...' : 'Salvar Devedor'}
              onPress={salvarDevedor}
              disabled={loading}
            />
            
            <Button
              title="Cancelar"
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </Card>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
});