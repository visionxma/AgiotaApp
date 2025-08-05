import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Phone, FileText, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import dayjs from 'dayjs';
import { Devedor, Emprestimo } from '@/types';
import { storage } from '@/utils/storage';
import { calculations } from '@/utils/calculations';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function DetalhesDevedor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [devedor, setDevedor] = useState<Devedor | null>(null);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      const devedores = await storage.getDevedores();
      const devedorEncontrado = devedores.find(d => d.id === id);
      
      if (devedorEncontrado) {
        setDevedor(devedorEncontrado);
        
        const emprestimosData = await storage.getEmprestimosByDevedor(id!);
        setEmprestimos(emprestimosData);
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

  const excluirDevedor = async () => {
    if (!devedor) return;

    const emprestimoAtivos = emprestimos.filter(e => !e.encerrado);
    
    if (emprestimoAtivos.length > 0) {
      Alert.alert(
        'Erro',
        'Não é possível excluir um devedor com empréstimos ativos. Quite todos os empréstimos primeiro.'
      );
      return;
    }

    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir ${devedor.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteDevedor(devedor.id);
              
              Alert.alert(
                'Sucesso',
                'Devedor excluído com sucesso!',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Erro ao excluir devedor:', error);
              Alert.alert('Erro', 'Falha ao excluir devedor. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!devedor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Devedor não encontrado</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </View>
    );
  }

  const emprestimoAtivos = emprestimos.filter(e => !e.encerrado);
  const emprestimoQuitados = emprestimos.filter(e => e.encerrado);

  const calcularTotalDevedor = () => {
    let totalAtivo = 0;
    let totalQuitado = 0;

    emprestimos.forEach(emprestimo => {
      const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
      
      if (emprestimo.encerrado) {
        totalQuitado += totalAmortizacoes;
      } else {
        const { saldoAtual } = calculations.calcularSaldoAtual(
          emprestimo.valorInicial,
          emprestimo.jurosMensal,
          emprestimo.dataInicio,
          totalAmortizacoes
        );
        totalAtivo += saldoAtual;
      }
    });

    return { totalAtivo, totalQuitado };
  };

  const { totalAtivo, totalQuitado } = calcularTotalDevedor();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{devedor.nome}</Text>
          <Text style={styles.subtitle}>Detalhes do devedor</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Informações do Devedor */}
        <Card>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <View style={styles.infoRow}>
            <Phone size={20} color="#6b7280" />
            <Text style={styles.infoLabel}>Telefone:</Text>
            <Text style={styles.infoValue}>{devedor.telefone}</Text>
          </View>

          {devedor.observacoes && (
            <View style={styles.infoRow}>
              <FileText size={20} color="#6b7280" />
              <Text style={styles.infoLabel}>Observações:</Text>
              <Text style={styles.infoValue}>{devedor.observacoes}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cadastrado em:</Text>
            <Text style={styles.infoValue}>
              {dayjs(devedor.createdAt).format('DD/MM/YYYY')}
            </Text>
          </View>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
          
          <View style={styles.resumoGrid}>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Dívida Ativa</Text>
              <Text style={[styles.resumoValor, styles.debtValue]}>
                {calculations.formatarMoeda(totalAtivo)}
              </Text>
            </View>

            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Total Quitado</Text>
              <Text style={[styles.resumoValor, styles.paidValue]}>
                {calculations.formatarMoeda(totalQuitado)}
              </Text>
            </View>
          </View>

          <View style={styles.resumoGrid}>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Empréstimos Ativos</Text>
              <Text style={styles.resumoValor}>{emprestimoAtivos.length}</Text>
            </View>

            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Empréstimos Quitados</Text>
              <Text style={styles.resumoValor}>{emprestimoQuitados.length}</Text>
            </View>
          </View>
        </Card>

        {/* Ações */}
        <Card>
          <Text style={styles.sectionTitle}>Ações</Text>
          <Button
            title="Novo Empréstimo"
            onPress={() => router.push('/(tabs)/novo-emprestimo')}
            style={{ marginBottom: 8 }}
          />
          <Button
            title="Excluir Devedor"
            onPress={excluirDevedor}
            variant="danger"
          />
        </Card>

        {/* Lista de Empréstimos */}
        <Card>
          <Text style={styles.sectionTitle}>Histórico de Empréstimos</Text>
          
          {emprestimos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum empréstimo registrado</Text>
            </View>
          ) : (
            emprestimos.map(emprestimo => {
              const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
              const { saldoAtual, diasCorridos } = calculations.calcularSaldoAtual(
                emprestimo.valorInicial,
                emprestimo.jurosMensal,
                emprestimo.dataInicio,
                totalAmortizacoes
              );

              return (
                <TouchableOpacity
                  key={emprestimo.id}
                  onPress={() => router.push(`/emprestimo/${emprestimo.id}`)}
                  style={styles.emprestimoItem}
                >
                  <View style={styles.emprestimoHeader}>
                    <Text style={styles.emprestimoValor}>
                      {calculations.formatarMoeda(emprestimo.valorInicial)}
                    </Text>
                    <Text style={[
                      styles.emprestimoStatus,
                      emprestimo.encerrado ? styles.statusQuitado : styles.statusAtivo
                    ]}>
                      {emprestimo.encerrado ? 'QUITADO' : 'ATIVO'}
                    </Text>
                  </View>
                  
                  <View style={styles.emprestimoInfo}>
                    <Text style={styles.emprestimoLabel}>
                      Saldo: {calculations.formatarMoeda(saldoAtual)}
                    </Text>
                    <Text style={styles.emprestimoLabel}>
                      {diasCorridos} dias • {emprestimo.jurosMensal}% ao mês
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  resumoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resumoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  resumoLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  resumoValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  debtValue: {
    color: '#dc2626',
  },
  paidValue: {
    color: '#059669',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emprestimoItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  emprestimoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emprestimoValor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emprestimoStatus: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAtivo: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusQuitado: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  emprestimoInfo: {
    gap: 4,
  },
  emprestimoLabel: {
    fontSize: 12,
    color: '#6b7280',
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