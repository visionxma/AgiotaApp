export interface Devedor {
  id: string;
  nome: string;
  telefone: string;
  observacoes: string;
  createdAt: string;
}

export interface HistoricoItem {
  id: string;
  data: string;
  tipo: 'emprestimo' | 'amortizacao' | 'quitacao' | 'ajuste';
  valor: number;
  observacao: string;
  saldoAnterior: number;
  saldoPosterior: number;
}

export interface Emprestimo {
  id: string;
  devedorId: string;
  valorInicial: number;
  jurosMensal: number;
  dataInicio: string;
  saldoAtual: number;
  encerrado: boolean;
  historico: HistoricoItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ResumoFinanceiro {
  totalEmprestado: number;
  totalJuros: number;
  totalRecebido: number;
  saldoAtual: number;
  emprestimoAtivos: number;
}