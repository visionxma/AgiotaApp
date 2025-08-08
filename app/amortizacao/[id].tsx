import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import uuid from 'react-native-uuid';
import dayjs from 'dayjs';
import { Emprestimo, Devedor, HistoricoItem } from '@/types';
import { storage } from '@/utils/storageNative';
import { calculations } from '@/utils/calculations';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

export default function RegistrarAmortizacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [emprestimo, setEmprestimo] = useState<Emprestimo | null>(null);
  const [devedor, setDevedor] = useState<Devedor | null>(null);
  const [valorPagamento, setValorPagamento] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const carregarDados = async () => {
    try {
      const emprestimos = await storage.getEmprestimos();
      const emprestimoEncontrado = emprestimos.find(e => e.id === id);
      
      if (emprestimoEncontrado) {
        setEmprestimo(emprestimoEncontrado);
        
        const devedores = await storage.getDevedores();
        const devedorEncontrado = devedores.find(d => d.id === emprestimoEncontrado.devedorId);
        setDevedor(devedorEncontrado || null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [id]);

  const validarPagamento = (): boolean => {
    const valor = parseFloat(valorPagamento.replace(',', '.'));
    
    if (!valor || valor <= 0) {
      Alert.alert('Erro', 'Digite um valor válido para o pagamento');
      return false;
    }

    return true;
  };

  const registrarPagamento = async () => {
    if (!emprestimo || !validarPagamento()) return;

    setLoading(true);

    try {
      const valor = parseFloat(valorPagamento.replace(',', '.'));
      const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
      const { saldoAtual: saldoAnterior } = calculations.calcularSaldoAtual(
        emprestimo.valorInicial,
        emprestimo.jurosMensal,
        emprestimo.dataInicio,
        totalAmortizacoes
      );

      const novoSaldo = Math.max(0, saldoAnterior - valor);

      const novoHistorico: HistoricoItem = {
        id: uuid.v4() as string,
        data: dayjs().toISOString(),
        tipo: 'amortizacao',
        valor: valor,
        observacao: observacao || 'Pagamento parcial',
        saldoAnterior: saldoAnterior,
        saldoPosterior: novoSaldo
      };

      const emprestimoAtualizado: Emprestimo = {
        ...emprestimo,
        historico: [...emprestimo.historico, novoHistorico],
        updatedAt: dayjs().toISOString()
      };

      await storage.updateEmprestimo(emprestimoAtualizado);

      Alert.alert(
        'Sucesso',
        'Pagamento registrado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              setValorPagamento('');
              setObservacao('');
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      Alert.alert('Erro', 'Falha ao registrar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!emprestimo || !devedor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Empréstimo não encontrado</Text>
      </View>
    );
  }

  const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
  const { saldoAtual, jurosAcumulado } = calculations.calcularSaldoAtual(
    emprestimo.valorInicial,
    emprestimo.jurosMensal,
    emprestimo.dataInicio,
    totalAmortizacoes
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Pagamento</Text>
        <Text style={styles.subtitle}>{devedor.nome}</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <Card>
          <Text style={styles.sectionTitle}>Situação Atual</Text>
          
          <View style={styles.situacaoContainer}>
            <View style={styles.situacaoItem}>
              <Text style={styles.situacaoLabel}>Saldo Devedor:</Text>
              <Text style={[styles.situacaoValor, styles.debtValue]}>
                {calculations.formatarMoeda(saldoAtual)}
              </Text>
            </View>

            <View style={styles.situacaoItem}>
              <Text style={styles.situacaoLabel}>Juros Acumulado:</Text>
              <Text style={[styles.situacaoValor, styles.interestValue]}>
                {calculations.formatarMoeda(jurosAcumulado)}
              </Text>
            </View>

            <View style={styles.situacaoItem}>
              <Text style={styles.situacaoLabel}>Total Já Pago:</Text>
              <Text style={[styles.situacaoValor, styles.paidValue]}>
                {calculations.formatarMoeda(totalAmortizacoes)}
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Novo Pagamento</Text>

          <Input
            label="Valor do Pagamento (R$)"
            value={valorPagamento}
            onChangeText={setValorPagamento}
            keyboardType="numeric"
            placeholder="0,00"
          />

          <Input
            label="Observação (opcional)"
            value={observacao}
            onChangeText={setObservacao}
            multiline
            numberOfLines={3}
            placeholder="Detalhes sobre o pagamento..."
          />

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Registrando...' : 'Registrar Pagamento'}
              onPress={registrarPagamento}
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
  situacaoContainer: {
    gap: 12,
  },
  situacaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  situacaoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  situacaoValor: {
    fontSize: 16,
    fontWeight: '700',
  },
  debtValue: {
    color: '#dc2626',
  },
  interestValue: {
    color: '#f59e0b',
  },
  paidValue: {
    color: '#059669',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 100,
  },
});