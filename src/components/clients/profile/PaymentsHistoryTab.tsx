import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useFaturas } from '@/contexts/FaturasContext';

export const PaymentsHistoryTab: React.FC<{ clientId?: string }> = ({ clientId }) => {
  const { faturas } = useFaturas();

  const payments = useMemo(() => {
    if (!clientId) return [];

    const clientFaturas = faturas.filter(f => f.clienteId === clientId);
    const extractedPayments: any[] = [];

    clientFaturas.forEach(fatura => {
      if (fatura.historico) {
        fatura.historico.forEach(item => {
          if (item.acao === 'pagamento_taxa' || item.acao === 'pagamento_repasse') {
            // In a real scenario, we might want to store the exact amount paid in the history details or a separate field.
            // For now, we'll infer the value based on the type of payment and the invoice totals.
            // Ideally 'detalhes' would contain "Pago R$ 150,00 via Pix", which we could parse, 
            // but strictly speaking, the history item doesn't have a numeric 'value' field by default in the current type.
            // We will assume full payment for that component (taxa or repasse) for simplified display,
            // or try to show which component was paid.

            let valor = 0;
            let tipo = '';

            if (item.acao === 'pagamento_taxa') {
              valor = fatura.valorTaxas;
              tipo = 'Taxas';
            } else {
              valor = fatura.valorRepasse;
              tipo = 'Repasse';
            }

            extractedPayments.push({
              id: item.id,
              date: new Date(item.data),
              invoiceNumber: fatura.numero,
              method: item.detalhes || 'Pagamento Manual', // 'detalhes' usually holds the method/note
              type: tipo,
              value: valor
            });
          }
        });
      }
    });

    return extractedPayments.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [faturas, clientId]);

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Fatura</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Detalhes</TableHead>
            <TableHead className="text-right">Valor Estimado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length > 0 ? (
            payments.map(pay => (
              <TableRow key={pay.id}>
                <TableCell>{format(pay.date, 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{pay.invoiceNumber}</TableCell>
                <TableCell><Badge variant="outline">{pay.type}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-sm">{pay.method}</TableCell>
                <TableCell className="text-right">{pay.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                Nenhum pagamento registrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
