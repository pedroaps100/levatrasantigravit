import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFaturas } from '@/contexts/FaturasContext';
import { Fatura } from '@/types';

const InvoiceTable: React.FC<{ invoices: Fatura[], isOpen?: boolean }> = ({ invoices, isOpen = false }) => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Aberta': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Aberta</Badge>;
            case 'Vencida': return <Badge variant="destructive">Vencida</Badge>;
            case 'Paga': return <Badge className="bg-green-100 text-green-800 border-green-200">Paga</Badge>;
            case 'Finalizada': return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Finalizada</Badge>;
            case 'Fechada': return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Fechada</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Período</TableHead>
                        {isOpen && <TableHead>Nº Entregas</TableHead>}
                        {isOpen ? <TableHead>Vencimento</TableHead> : <TableHead>Emissão</TableHead>}
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Val. Taxas</TableHead>
                        <TableHead className="text-right">Val. Repasse</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length > 0 ? (
                        invoices.map(inv => (
                            <TableRow key={inv.id}>
                                <TableCell className="font-medium">{inv.numero}</TableCell>
                                <TableCell>{format(new Date(inv.dataEmissao), 'MM/yyyy')}</TableCell>
                                {isOpen && <TableCell>{inv.totalEntregas}</TableCell>}
                                <TableCell>{format(new Date(isOpen ? inv.dataVencimento : inv.dataEmissao), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-center">{getStatusBadge(inv.statusGeral)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(inv.valorTaxas)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(inv.valorRepasse)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={isOpen ? 8 : 7} className="text-center h-24 text-muted-foreground">
                                Nenhuma fatura encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};


export const InvoicesTab: React.FC<{ clientId?: string }> = ({ clientId }) => {
    const { faturas } = useFaturas();

    const { openInvoices, closedInvoices } = useMemo(() => {
        if (!clientId) return { openInvoices: [], closedInvoices: [] };

        const clientFaturas = faturas.filter(f => f.clienteId === clientId);

        const open = clientFaturas.filter(f => ['Aberta', 'Vencida'].includes(f.statusGeral));
        const closed = clientFaturas.filter(f => ['Paga', 'Finalizada', 'Fechada'].includes(f.statusGeral));

        return { openInvoices: open, closedInvoices: closed };
    }, [faturas, clientId]);

    return (
        <Tabs defaultValue="open">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="open">Faturas Abertas</TabsTrigger>
                <TabsTrigger value="closed">Faturas Fechadas</TabsTrigger>
            </TabsList>
            <TabsContent value="open">
                <InvoiceTable invoices={openInvoices} isOpen={true} />
            </TabsContent>
            <TabsContent value="closed">
                <InvoiceTable invoices={closedInvoices} />
            </TabsContent>
        </Tabs>
    );
};
