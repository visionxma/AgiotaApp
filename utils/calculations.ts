import dayjs from 'dayjs';

export const calculations = {
  /**
   * Converte juros mensal para diário
   */
  calcularJurosDiario(jurosMensal: number): number {
    return jurosMensal / 30;
  },

  /**
   * Calcula os dias corridos entre duas datas
   */
  calcularDiasCorridos(dataInicio: string, dataFim?: string): number {
    const inicio = dayjs(dataInicio);
    const fim = dataFim ? dayjs(dataFim) : dayjs();
    return fim.diff(inicio, 'day');
  },

  /**
   * Calcula juros acumulado baseado no tempo
   */
  calcularJurosAcumulado(
    saldoAnterior: number,
    jurosMensal: number,
    diasCorridos: number
  ): number {
    const jurosDiario = this.calcularJurosDiario(jurosMensal);
    return saldoAnterior * (jurosDiario / 100) * diasCorridos;
  },

  /**
   * Calcula o saldo atual de um empréstimo
   */
  calcularSaldoAtual(
    valorInicial: number,
    jurosMensal: number,
    dataInicio: string,
    amortizacoes: number = 0
  ): { saldoAtual: number; jurosAcumulado: number; diasCorridos: number } {
    const diasCorridos = this.calcularDiasCorridos(dataInicio);
    const saldoSemJuros = valorInicial - amortizacoes;
    const jurosAcumulado = this.calcularJurosAcumulado(
      saldoSemJuros,
      jurosMensal,
      diasCorridos
    );
    const saldoAtual = saldoSemJuros + jurosAcumulado;

    return {
      saldoAtual: Math.max(0, saldoAtual),
      jurosAcumulado,
      diasCorridos
    };
  },

  /**
   * Formata valor em moeda brasileira
   */
  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  },

  /**
   * Calcula total de amortizações de um empréstimo
   */
  calcularTotalAmortizacoes(historico: any[]): number {
    return historico
      .filter(item => item.tipo === 'amortizacao')
      .reduce((total, item) => total + item.valor, 0);
  }
};