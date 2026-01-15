import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { format, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

import { useClientsData } from '@/hooks/useClientsData';
import { useSolicitacoesData } from '@/hooks/useSolicitacoesData';
import { useFaturasData } from '@/hooks/useFaturasData';
import { toast } from 'sonner';

interface CreateFaturaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateFatura: (data: any) => void;
}

export const CreateFaturaDialog: React.FC<CreateFaturaDialogProps> = ({ open, onOpenChange, onCreateFatura }) => {
    const { clients } = useClientsData();
    const { solicitacoes } = useSolicitacoesData();
    const { faturas } = useFaturasData();

    // Form States
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({});
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<{
        count: number;
        totalTaxas: number;
        totalRepasses: number;
        entregas: any[];
    } | null>(null);

    // Filter only active clients that are 'faturado'
    const eligibleClients = useMemo(() => {
        return clients.filter(c => c.status === 'ativo' && c.modalidade === 'faturado');
    }, [clients]);

    const handleSimulate = () => {
        if (!selectedClientId || !dateRange.from || !dateRange.to) {
            toast.error("Selecione o cliente e o período de apuração.");
            return;
        }

        setIsSimulating(true);
        setTimeout(() => { // Mock processing time
            const endDate = endOfDay(dateRange.to!);

            // Get IDs of deliveries already billed
            const billedEntregaIds = new Set<string>();
            faturas.forEach(f => {
                f.entregas.forEach(e => billedEntregaIds.add(e.id));
            });

            const filteredSolicitacoes = solicitacoes.filter(s =>
                s.clienteId === selectedClientId &&
                s.status === 'concluida' &&
                new Date(s.dataSolicitacao) >= dateRange.from! &&
                new Date(s.dataSolicitacao) <= endDate &&
                !billedEntregaIds.has(s.id)
            );

            // Calculate totals
            const totalTaxas = filteredSolicitacoes.reduce((acc, s) => acc + s.valorTotalTaxas + (s.valorTotalTaxasExtras || 0), 0);
            const totalRepasse = filteredSolicitacoes.reduce((acc, s) => acc + s.valorTotalRepasse, 0);

            setSimulationResult({
                count: filteredSolicitacoes.length,
                totalTaxas,
                totalRepasses: totalRepasse,
                entregas: filteredSolicitacoes
            });
            setIsSimulating(false);
        }, 800);
    };

    const handleSubmit = () => {
        if (!simulationResult || simulationResult.count === 0) {
            toast.error("Não há entregas para faturar neste período.");
            return;
        }
        if (!dueDate) {
            toast.error("Selecione a data de vencimento.");
            return;
        }

        const client = clients.find(c => c.id === selectedClientId);

        onCreateFatura({
            clienteId: selectedClientId,
            clienteNome: client?.nome || 'Cliente Desconhecido',
            periodoInicio: dateRange.from,
            periodoFim: dateRange.to,
            vencimento: dueDate,
            entregas: simulationResult.entregas,
            totais: {
                taxas: simulationResult.totalTaxas,
                repasse: simulationResult.totalRepasses
            }
        });

        onOpenChange(false);
        // Reset form
        setSelectedClientId('');
        setSimulationResult(null);
        setDueDate(undefined);
        setDateRange({});
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Gerar Nova Fatura</DialogTitle>
                    <DialogDescription>
                        Crie uma fatura manual para um cliente selecionando o período de apuração.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Cliente</Label>
                        <Select value={selectedClientId} onValueChange={(val) => { setSelectedClientId(val); setSimulationResult(null); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleClients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>{client.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Período de Apuração</Label>
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : <span>Data Inicial</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dateRange.from} onSelect={(date) => { setDateRange(prev => ({ ...prev, from: date })); setSimulationResult(null); }} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : <span>Data Final</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dateRange.to} onSelect={(date) => { setDateRange(prev => ({ ...prev, to: date })); setSimulationResult(null); }} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {simulationResult && (
                        <div className="rounded-md border p-4 bg-muted/50 space-y-3 animate-in fade-in-50">
                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle2 className="h-5 w-5" />
                                Simulação Realizada
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Entregas encontradas:</span>
                                    <div className="font-semibold text-lg">{simulationResult.count}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Valor Taxas:</span>
                                    <div className="font-semibold text-lg">{formatCurrency(simulationResult.totalTaxas)}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Valor Repasse:</span>
                                    <div className="font-semibold text-lg">{formatCurrency(simulationResult.totalRepasses)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {simulationResult && (
                        <div className="grid gap-2 animate-in slide-in-from-top-2">
                            <Label>Data de Vencimento</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>Selecione o vencimento</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus disabled={(date) => date < new Date()} />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {!simulationResult ? (
                        <Button onClick={handleSimulate} disabled={isSimulating} className="w-full">
                            {isSimulating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simular Fatura
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full justify-end">
                            <Button variant="outline" onClick={() => setSimulationResult(null)}>Voltar</Button>
                            <Button onClick={handleSubmit}>Gerar Fatura</Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
