import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Calendar, DollarSign } from 'lucide-react-native';
import { Emprestimo, Devedor } from '@/types';
import { calculations } from '@/utils/calculations';
import { Card } from './Card';

interface EmprestimoCardProps {
  emprestimo: Emprestimo;
  devedor: Devedor;
  onPress: () => void;
}

export function EmprestimoCard({ emprestimo, devedor, onPress }: EmprestimoCardProps) {
  const totalAmortizacoes = calculations.calcularTotalAmortizacoes(emprestimo.historico);
  const { saldoAtual, jurosAcumulado, diasCorridos } = calculations.calcularSaldoAtual(
    emprestimo.valorInicial,
    emprestimo.jurosMensal,
    emprestimo.dataInicio,
    totalAmortizacoes
  );

  const getStatusColor = () => {
    if (emprestimo.encerrado) return '#6b7280';
    if (diasCorridos > 60) return '#dc2626';
    if (diasCorridos > 30) return '#f59e0b';
    return '#059669';
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card>
        <View style={styles.header}>
          <View style={styles.devedorInfo}>
            <Text style={styles.nomeDevedor}>{devedor.nome}</Text>
            <Text style={styles.telefone}>{devedor.telefone}</Text>
          </View>
          <ChevronRight size={20} color="#6b7280" />
        </View>

        <View style={styles.valores}>
          <View style={styles.valorItem}>
            <DollarSign size={16} color="#6b7280" />
            <Text style={styles.valorLabel}>Emprestado:</Text>
            <Text style={styles.valorText}>
              {calculations.formatarMoeda(emprestimo.valorInicial)}
            </Text>
          </View>

          <View style={styles.valorItem}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.valorLabel}>Dias:</Text>
            <Text style={[styles.valorText, { color: getStatusColor() }]}>
              {diasCorridos}
            </Text>
          </View>
        </View>

        <View style={styles.saldoContainer}>
          <Text style={styles.saldoLabel}>Saldo Atual:</Text>
          <Text style={[styles.saldoValor, { color: getStatusColor() }]}>
            {calculations.formatarMoeda(saldoAtual)}
          </Text>
        </View>

        {jurosAcumulado > 0 && (
          <View style={styles.jurosContainer}>
            <Text style={styles.jurosLabel}>Juros: </Text>
            <Text style={styles.jurosValor}>
              {calculations.formatarMoeda(jurosAcumulado)}
            </Text>
          </View>
        )}

        {emprestimo.encerrado && (
          <View style={styles.encerradoBadge}>
            <Text style={styles.encerradoText}>QUITADO</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  devedorInfo: {
    flex: 1,
  },
  nomeDevedor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  telefone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  valores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  valorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valorLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  valorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  saldoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saldoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saldoValor: {
    fontSize: 18,
    fontWeight: '700',
  },
  jurosContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  jurosLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  jurosValor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  encerradoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  encerradoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
});