import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useSolicitacoesData } from '@/hooks/useSolicitacoesData';



export const RequestsHistoryTab: React.FC<{ clientId?: string }> = ({ clientId }) => {
  const { solicitacoes } = useSolicitacoesData();

  const clientRequests = React.useMemo(() => {
    if (!clientId) return [];
    return solicitacoes
      .filter(s => s.clienteId === clientId)
      .sort((a, b) => new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime());
  }, [solicitacoes, clientId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluida': return <Badge className="bg-green-100 text-green-800 border-green-200">Concluída</Badge>;
      case 'em_andamento': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em Andamento</Badge>;
      case 'pendente': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'cancelada': return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Ponto de Coleta</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientRequests.length > 0 ? (
            clientRequests.map(req => (
              <TableRow key={req.id}>
                <TableCell>{format(new Date(req.dataSolicitacao), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{req.operationDescription || `Solicitação #${req.codigo}`}</TableCell>
                <TableCell>{req.pontoColeta}</TableCell>
                <TableCell className="text-center">{getStatusBadge(req.status)}</TableCell>
                <TableCell className="text-right">
                  {(req.valorTotalTaxas + (req.valorTotalTaxasExtras || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                Nenhuma solicitação encontrada para este cliente.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
