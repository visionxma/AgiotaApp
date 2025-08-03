import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import dayjs from 'dayjs';
import { Devedor, Emprestimo, HistoricoItem } from '@/types';
import { storage } from '@/utils/storage';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function NovoEmprestimo() {
  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [devedorSelecionado, setDevedorSelecionado] = useState<string>('');
  const [valorEmprestado, setValorEmprestado] = useState<string>('');
  const [jurosMensal, setJurosMensal] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const carregarDevedores = async () => {
    try {
      const data = await storage.getDevedores();
      setDevedores(data);
    } catch (error) {
      console.error('Erro ao carregar devedores:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDevedores();
    }, [])
  );

  const validarFormulario = (): boolean => {
    if (!devedorSelecionado) {
      Alert.alert('Erro', 'Selecione um devedor');
      return false;
    }

    const valor = parseFloat(valorEmprestado.replace(',', '.'));
    if (!valor || valor <= 0) {
      Alert.alert('Erro', 'Digite um valor válido para o empréstimo');
      return false;
    }

    const juros = parseFloat(jurosMensal.replace(',', '.'));
    if (!juros || juros < 0) {
      Alert.alert('Erro', 'Digite uma taxa de juros válida');
      return false;
    }

    return true;
  };

  const criarEmprestimo = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    
    try {
      const valor = parseFloat(valorEmprestado.replace(',', '.'));
      const juros = parseFloat(jurosMensal.replace(',', '.'));
      const agora = dayjs().toISOString();

      const historicoInicial: HistoricoItem = {
        id: uuid.v4() as string,
        data: agora,
        tipo: 'emprestimo',
        valor: valor,
        observacao: observacoes || 'Empréstimo inicial',
        saldoAnterior: 0,
        saldoPosterior: valor
      };

      const novoEmprestimo: Emprestimo = {
        id: uuid.v4() as string,
        devedorId: devedorSelecionado,
        valorInicial: valor,
        jurosMensal: juros,
        dataInicio: agora,
        saldoAtual: valor,
        encerrado: false,
        historico: [historicoInicial],
        createdAt: agora,
        updatedAt: agora
      };

      await storage.addEmprestimo(novoEmprestimo);

      Alert.alert(
        'Sucesso',
        'Empréstimo criado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              setDevedorSelecionado('');
              setValorEmprestado('');
              setJurosMensal('');
              setObservacoes('');
              router.replace('/(tabs)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao criar empréstimo:', error);
      Alert.alert('Erro', 'Falha ao criar empréstimo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Novo Empréstimo</Text>
        <Text style={styles.subtitle}>Registrar empréstimo</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <Card>
          <Text style={styles.sectionTitle}>Dados do Empréstimo</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Devedor</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={devedorSelecionado}
                onValueChange={setDevedorSelecionado}
                style={styles.picker}
              >
                <Picker.Item label="Selecione um devedor..." value="" />
                {devedores.map(devedor => (
                  <Picker.Item
                    key={devedor.id}
                    label={devedor.nome}
                    value={devedor.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <Input
            label="Valor do Empréstimo (R$)"
            value={valorEmprestado}
            onChangeText={setValorEmprestado}
            keyboardType="numeric"
            placeholder="0,00"
          />

          <Input
            label="Taxa de Juros Mensal (%)"
            value={jurosMensal}
            onChangeText={setJurosMensal}
            keyboardType="numeric"
            placeholder="10"
          />

          <Input
            label="Observações (opcional)"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={3}
            placeholder="Detalhes sobre o empréstimo..."
          />

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Criando...' : 'Criar Empréstimo'}
              onPress={criarEmprestimo}
              disabled={loading}
            />
            
            <Button
              title="Cancelar"
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </Card>

        {devedores.length === 0 && (
          <Card>
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>Nenhum devedor cadastrado</Text>
              <Text style={styles.alertText}>
                Você precisa cadastrar pelo menos um devedor antes de criar um empréstimo.
              </Text>
              <Button
                title="Cadastrar Devedor"
                onPress={() => router.push('/devedor/novo')}
                style={{ marginTop: 12 }}
              />
            </View>
          </Card>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputContainer: {
    marginVertical: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  alertContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});