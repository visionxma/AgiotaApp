import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, DollarSign, Calendar, History } from 'lucide-react-native';
import uuid from 'react-native-uuid';
import dayjs from 'dayjs';
import { Emprestimo, Devedor, HistoricoItem } from '@/types';
import { storage } from '@/utils/storage';
import { calculations } from '@/utils/calculations';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function DetalhesEmprestimo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [emprestimo, setEmprestimo] = useState<Emprestimo | null>(null);
  const [devedor, setDevedor] = useState<Devedor | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [id]);

  const finalizarEmprestimo = async () => {
    if (!emprestimo) return;

    Alert.alert(
      'Finalizar Empréstimo',
      'Como deseja finalizar este empréstimo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitação',
          onPress: () => encerrarEmprestimo('quitacao'),
        },
        {
          text: 'Perdão',
          onPress: () => encerrarEmprestimo('perdao'),
        },
      ]
    );
  };

  const encerrarEmprestimo = async (tipo: 'quitacao' | 'perdao') => {
    if (!emprestimo) return;

    try {
      const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
      const { saldoAtual } = calculations.calcularSaldoAtual(
        emprestimo.valorInicial,
        emprestimo.jurosMensal,
        emprestimo.dataInicio,
        totalAmortizacoes
      );

      const novoHistorico: HistoricoItem = {
        id: uuid.v4() as string,
        data: dayjs().toISOString(),
        tipo: 'quitacao',
        valor: tipo === 'quitacao' ? saldoAtual : 0,
        observacao: tipo === 'quitacao' ? 'Quitação total' : 'Dívida perdoada',
        saldoAnterior: saldoAtual,
        saldoPosterior: 0
      };

      const emprestimoAtualizado: Emprestimo = {
        ...emprestimo,
        encerrado: true,
        saldoAtual: 0,
        historico: [...emprestimo.historico, novoHistorico],
        updatedAt: dayjs().toISOString()
      };

      await storage.updateEmprestimo(emprestimoAtualizado);
      setEmprestimo(emprestimoAtualizado);

      Alert.alert(
        'Sucesso',
        `Empréstimo ${tipo === 'quitacao' ? 'quitado' : 'perdoado'} com sucesso!`,
        [
          {
            text: 'OK',
            onPress: () => carregarDados()
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao finalizar empréstimo:', error);
      Alert.alert('Erro', 'Falha ao finalizar empréstimo. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!emprestimo || !devedor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Empréstimo não encontrado</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </View>
    );
  }

  const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
  const { saldoAtual, jurosAcumulado, diasCorridos } = calculations.calcularSaldoAtual(
    emprestimo.valorInicial,
    emprestimo.jurosMensal,
    emprestimo.dataInicio,
    totalAmortizacoes
  );

  const formatarData = (data: string) => {
    return dayjs(data).format('DD/MM/YYYY HH:mm');
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'emprestimo': return <Plus size={16} color="#1e40af" />;
      case 'amortizacao': return <DollarSign size={16} color="#059669" />;
      case 'quitacao': return <Calendar size={16} color="#6b7280" />;
      default: return <History size={16} color="#6b7280" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'emprestimo': return 'Empréstimo';
      case 'amortizacao': return 'Pagamento';
      case 'quitacao': return 'Quitação';
      case 'ajuste': return 'Ajuste';
      default: return tipo;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{devedor.nome}</Text>
          <Text style={styles.subtitle}>Detalhes do empréstimo</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Resumo do Empréstimo */}
        <Card>
          <Text style={styles.sectionTitle}>Resumo</Text>
          
          <View style={styles.resumoGrid}>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Valor Inicial</Text>
              <Text style={styles.resumoValor}>
                {calculations.formatarMoeda(emprestimo.valorInicial)}
              </Text>
            </View>

            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Juros Mensal</Text>
              <Text style={styles.resumoValor}>{emprestimo.jurosMensal}%</Text>
            </View>

            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Dias Corridos</Text>
              <Text style={styles.resumoValor}>{diasCorridos}</Text>
            </View>

            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Total Pago</Text>
              <Text style={[styles.resumoValor, styles.positiveValue]}>
                {calculations.formatarMoeda(totalAmortizacoes)}
              </Text>
            </View>
          </View>

          <View style={styles.saldoContainer}>
            <Text style={styles.saldoLabel}>Saldo Atual:</Text>
            <Text style={[
              styles.saldoValor,
              emprestimo.encerrado ? styles.quitadoValue : styles.ativoValue
            ]}>
              {calculations.formatarMoeda(saldoAtual)}
            </Text>
          </View>

          {jurosAcumulado > 0 && (
            <View style={styles.jurosContainer}>
              <Text style={styles.jurosLabel}>Juros Acumulado: </Text>
              <Text style={styles.jurosValor}>
                {calculations.formatarMoeda(jurosAcumulado)}
              </Text>
            </View>
          )}
        </Card>

        {/* Ações */}
        {!emprestimo.encerrado && (
          <Card>
            <Text style={styles.sectionTitle}>Ações</Text>
            <Button
              title="Registrar Pagamento"
              onPress={() => router.push(`/amortizacao/${emprestimo.id}`)}
              style={{ marginBottom: 8 }}
            />
            <Button
              title="Finalizar Empréstimo"
              onPress={finalizarEmprestimo}
              variant="danger"
            />
          </Card>
        )}

        {/* Histórico */}
        <Card>
          <Text style={styles.sectionTitle}>Histórico de Transações</Text>
          
          {emprestimo.historico
            .sort((a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf())
            .map(item => (
              <View key={item.id} style={styles.historicoItem}>
                <View style={styles.historicoHeader}>
                  <View style={styles.historicoTipo}>
                    {getTipoIcon(item.tipo)}
                    <Text style={styles.historicoTipoText}>
                      {getTipoLabel(item.tipo)}
                    </Text>
                  </View>
                  <Text style={styles.historicoData}>
                    {formatarData(item.data)}
                  </Text>
                </View>

                <View style={styles.historicoValores}>
                  <Text style={styles.historicoValor}>
                    {calculations.formatarMoeda(item.valor)}
                  </Text>
                  <Text style={styles.historicoSaldo}>
                    Saldo: {calculations.formatarMoeda(item.saldoPosterior)}
                  </Text>
                </View>

                {item.observacao && (
                  <Text style={styles.historicoObservacao}>
                    {item.observacao}
                  </Text>
                )}
              </View>
            ))}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
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
  resumoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  resumoItem: {
    width: '50%',
    paddingRight: 8,
    marginBottom: 12,
  },
  resumoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  resumoValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  positiveValue: {
    color: '#059669',
  },
  saldoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saldoLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  saldoValor: {
    fontSize: 24,
    fontWeight: '700',
  },
  ativoValue: {
    color: '#dc2626',
  },
  quitadoValue: {
    color: '#6b7280',
  },
  jurosContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  jurosLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  jurosValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  historicoItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historicoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historicoTipoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  historicoData: {
    fontSize: 12,
    color: '#6b7280',
  },
  historicoValores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historicoValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  historicoSaldo: {
    fontSize: 12,
    color: '#6b7280',
  },
  historicoObservacao: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 100,
  },
});