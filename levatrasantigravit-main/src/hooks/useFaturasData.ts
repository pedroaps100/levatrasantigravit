import { useFaturas } from '@/contexts/FaturasContext';

// This hook now simply consumes the context, maintaining the interface for existing components
export const useFaturasData = () => {
    const context = useFaturas();
    return {
        ...context, // Expose everything from context
        // Ensure createManualFatura is explicitly accessible if needed, or just rely on spread
        createManualFatura: context.createManualFatura
    };
};
