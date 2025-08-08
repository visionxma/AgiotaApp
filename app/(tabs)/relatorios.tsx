import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react-native';
import { Emprestimo, Devedor } from '@/types';
import { storage } from '@/utils/storageNative';
import { calculations } from '@/utils/calculations';
import { Card } from '@/components/Card';

export default function Relatorios() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDados = async () => {
    try {
      const [emprestimosData, devedoresData] = await Promise.all([
        storage.getEmprestimos(),
        storage.getDevedores()
      ]);

      setEmprestimos(emprestimosData);
      setDevedores(devedoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const calcularEstatisticas = () => {
    let totalEmprestado = 0;
    let totalJuros = 0;
    let totalRecebido = 0;
    let saldoTotal = 0;
    let emprestimoAtivos = 0;
    let emprestimoQuitados = 0;

    emprestimos.forEach(emprestimo => {
      totalEmprestado += emprestimo.valorInicial;
      
      const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
      totalRecebido += totalAmortizacoes;

      if (emprestimo.encerrado) {
        emprestimoQuitados++;
      } else {
        emprestimoAtivos++;
        const { saldoAtual, jurosAcumulado } = calculations.calcularSaldoAtual(
          emprestimo.valorInicial,
          emprestimo.jurosMensal,
          emprestimo.dataInicio,
          totalAmortizacoes
        );
        saldoTotal += saldoAtual;
        totalJuros += jurosAcumulado;
      }
    });

    return {
      totalEmprestado,
      totalJuros,
      totalRecebido,
      saldoTotal,
      emprestimoAtivos,
      emprestimoQuitados,
      lucroTotal: totalRecebido - totalEmprestado + saldoTotal
    };
  };

  const stats = calcularEstatisticas();

  const gerarRelatorioDetalhado = () => {
    return emprestimos.map(emprestimo => {
      const devedor = devedores.find(d => d.id === emprestimo.devedorId);
      const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
      
      if (emprestimo.encerrado) {
        return {
          nome: devedor?.nome || 'Devedor não encontrado',
          valorInicial: emprestimo.valorInicial,
          totalRecebido: totalAmortizacoes,
          status: 'Quitado',
          lucro: totalAmortizacoes - emprestimo.valorInicial,
          diasCorridos: calculations.calcularDiasCorridos(emprestimo.dataInicio)
        };
      } else {
        const { saldoAtual, jurosAcumulado, diasCorridos } = calculations.calcularSaldoAtual(
          emprestimo.valorInicial,
          emprestimo.jurosMensal,
          emprestimo.dataInicio,
          totalAmortizacoes
        );
        
        return {
          nome: devedor?.nome || 'Devedor não encontrado',
          valorInicial: emprestimo.valorInicial,
          saldoAtual,
          jurosAcumulado,
          totalRecebido: totalAmortizacoes,
          status: 'Ativo',
          diasCorridos
        };
      }
    });
  };

  const relatorio = gerarRelatorioDetalhado();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <Text style={styles.subtitle}>Análise financeira</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Estatísticas Gerais */}
        <Card>
          <Text style={styles.sectionTitle}>Estatísticas Gerais</Text>
          
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <TrendingDown size={24} color="#dc2626" />
              <Text style={styles.statLabel}>Total Emprestado</Text>
              <Text style={[styles.statValue, styles.negativeValue]}>
                {calculations.formatarMoeda(stats.totalEmprestado)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <TrendingUp size={24} color="#059669" />
              <Text style={styles.statLabel}>A Receber</Text>
              <Text style={[styles.statValue, styles.positiveValue]}>
                {calculations.formatarMoeda(stats.saldoTotal)}
              </Text>
            </View>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Users size={24} color="#1e40af" />
              <Text style={styles.statLabel}>Empréstimos Ativos</Text>
              <Text style={styles.statValue}>{stats.emprestimoAtivos}</Text>
            </View>

            <View style={styles.statItem}>
              <Calendar size={24} color="#059669" />
              <Text style={styles.statLabel}>Quitados</Text>
              <Text style={styles.statValue}>{stats.emprestimoQuitados}</Text>
            </View>
          </View>

          <View style={styles.lucroContainer}>
            <Text style={styles.lucroLabel}>Lucro Projetado:</Text>
            <Text style={[
              styles.lucroValue,
              stats.lucroTotal >= 0 ? styles.positiveValue : styles.negativeValue
            ]}>
              {calculations.formatarMoeda(stats.lucroTotal)}
            </Text>
          </View>
        </Card>

        {/* Relatório Detalhado */}
        <Card>
          <Text style={styles.sectionTitle}>Relatório Detalhado</Text>
          
          {relatorio.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum empréstimo registrado</Text>
            </View>
          ) : (
            relatorio.map((item, index) => (
              <View key={index} style={styles.relatorioItem}>
                <Text style={styles.nomeDevedor}>{item.nome}</Text>
                
                <View style={styles.relatorioRow}>
                  <Text style={styles.relatorioLabel}>Valor Inicial:</Text>
                  <Text style={styles.relatorioValor}>
                    {calculations.formatarMoeda(item.valorInicial)}
                  </Text>
                </View>

                {item.status === 'Ativo' && (
                  <>
                    <View style={styles.relatorioRow}>
                      <Text style={styles.relatorioLabel}>Saldo Atual:</Text>
                      <Text style={[styles.relatorioValor, styles.positiveValue]}>
                        {calculations.formatarMoeda(item.saldoAtual)}
                      </Text>
                    </View>
                    
                    <View style={styles.relatorioRow}>
                      <Text style={styles.relatorioLabel}>Juros Acumulado:</Text>
                      <Text style={[styles.relatorioValor, styles.warningValue]}>
                        {calculations.formatarMoeda(item.jurosAcumulado)}
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.relatorioRow}>
                  <Text style={styles.relatorioLabel}>Total Recebido:</Text>
                  <Text style={styles.relatorioValor}>
                    {calculations.formatarMoeda(item.totalRecebido)}
                  </Text>
                </View>

                <View style={styles.relatorioRow}>
                  <Text style={styles.relatorioLabel}>Dias Corridos:</Text>
                  <Text style={styles.relatorioValor}>{item.diasCorridos}</Text>
                </View>

                <View style={styles.statusContainer}>
                  <Text style={[
                    styles.statusText,
                    item.status === 'Ativo' ? styles.statusAtivo : styles.statusQuitado
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            ))
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
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  positiveValue: {
    color: '#059669',
  },
  negativeValue: {
    color: '#dc2626',
  },
  warningValue: {
    color: '#f59e0b',
  },
  lucroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  lucroLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  lucroValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  relatorioItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  nomeDevedor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  relatorioRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  relatorioLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  relatorioValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  statusText: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});