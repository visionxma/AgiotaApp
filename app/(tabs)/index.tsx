import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { CirclePlus as PlusCircle, TrendingUp, TrendingDown, Users, LogOut } from 'lucide-react-native';
import { Emprestimo, Devedor, ResumoFinanceiro } from '@/types';
import { storage } from '@/utils/storageNative';
import { calculations } from '@/utils/calculations';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmprestimoCard } from '@/components/EmprestimoCard';
import { SyncIndicator } from '@/components/SyncIndicator';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalEmprestado: 0,
    totalJuros: 0,
    totalRecebido: 0,
    saldoAtual: 0,
    emprestimoAtivos: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  const carregarDados = async () => {
    try {
      const [emprestimosData, devedoresData] = await Promise.all([
        storage.getEmprestimos(),
        storage.getDevedores()
      ]);

      setEmprestimos(emprestimosData);
      setDevedores(devedoresData);
      calcularResumo(emprestimosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const calcularResumo = (emprestimosData: Emprestimo[]) => {
    let totalEmprestado = 0;
    let totalJuros = 0;
    let totalRecebido = 0;
    let saldoAtual = 0;
    let emprestimoAtivos = 0;

    emprestimosData.forEach(emprestimo => {
      totalEmprestado += emprestimo.valorInicial;
      
      const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
      totalRecebido += totalAmortizacoes;

      if (!emprestimo.encerrado) {
        emprestimoAtivos++;
        const { saldoAtual: saldoEmprestimo, jurosAcumulado } = calculations.calcularSaldoAtual(
          emprestimo.valorInicial,
          emprestimo.jurosMensal,
          emprestimo.dataInicio,
          totalAmortizacoes
        );
        saldoAtual += saldoEmprestimo;
        totalJuros += jurosAcumulado;
      }
    });

    setResumo({
      totalEmprestado,
      totalJuros,
      totalRecebido,
      saldoAtual,
      emprestimoAtivos
    });
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

  const emprestimoAtivos = emprestimos.filter(e => !e.encerrado);

  const handleEmprestimoPress = (emprestimo: Emprestimo) => {
    router.push(`/emprestimo/${emprestimo.id}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Olá, {user?.name || 'Usuário'}</Text>
          </View>
          <View style={styles.headerActions}>
            <SyncIndicator />
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <LogOut size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Resumo Financeiro */}
        <Card>
          <Text style={styles.resumoTitle}>Resumo Financeiro</Text>
          
          <View style={styles.resumoRow}>
            <View style={styles.resumoItem}>
              <TrendingDown size={20} color="#dc2626" />
              <Text style={styles.resumoLabel}>Emprestado</Text>
              <Text style={styles.resumoValorNegativo}>
                {calculations.formatarMoeda(resumo.totalEmprestado)}
              </Text>
            </View>
            
            <View style={styles.resumoItem}>
              <TrendingUp size={20} color="#059669" />
              <Text style={styles.resumoLabel}>A Receber</Text>
              <Text style={styles.resumoValorPositivo}>
                {calculations.formatarMoeda(resumo.saldoAtual)}
              </Text>
            </View>
          </View>

          <View style={styles.resumoRow}>
            <View style={styles.resumoItem}>
              <Users size={20} color="#1e40af" />
              <Text style={styles.resumoLabel}>Ativos</Text>
              <Text style={styles.resumoValor}>{resumo.emprestimoAtivos}</Text>
            </View>
            
            <View style={styles.resumoItem}>
              <TrendingUp size={20} color="#f59e0b" />
              <Text style={styles.resumoLabel}>Juros</Text>
              <Text style={styles.resumoValorJuros}>
                {calculations.formatarMoeda(resumo.totalJuros)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <Button
            title="Novo Empréstimo"
            onPress={() => router.push('/(tabs)/novo-emprestimo')}
            style={{ marginBottom: 8 }}
          />
          <Button
            title="Cadastrar Devedor"
            onPress={() => router.push('/devedor/novo')}
            variant="secondary"
          />
        </Card>

        {/* Empréstimos Ativos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Empréstimos Ativos</Text>
          {emprestimoAtivos.length === 0 ? (
            <Card>
              <View style={styles.emptyState}>
                <PlusCircle size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>Nenhum empréstimo ativo</Text>
                <Text style={styles.emptySubtext}>
                  Cadastre um devedor e crie seu primeiro empréstimo
                </Text>
              </View>
            </Card>
          ) : (
            emprestimoAtivos.map(emprestimo => {
              const devedor = devedores.find(d => d.id === emprestimo.devedorId);
              if (!devedor) return null;
              
              return (
                <EmprestimoCard
                  key={emprestimo.id}
                  emprestimo={emprestimo}
                  devedor={devedor}
                  onPress={() => handleEmprestimoPress(emprestimo)}
                />
              );
            })
          )}
        </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    padding: 8,
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
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  resumoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resumoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  resumoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  resumoValor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  resumoValorPositivo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  resumoValorNegativo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
  resumoValorJuros: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
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
});