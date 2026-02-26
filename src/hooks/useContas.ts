import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cashFlowService } from '../services/cashFlowService'
import type { Database } from '../types/database'

type ContaInsert = Database['public']['Tables']['contas']['Insert']

export function useContas() {
    const queryClient = useQueryClient()

    const { data: contas = [], isLoading, error, refetch } = useQuery({
        queryKey: ['contas'],
        queryFn: () => cashFlowService.getContas(),
    })

    const createMutation = useMutation({
        mutationFn: (data: ContaInsert) => cashFlowService.createConta(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contas'] })
        },
    })

    return {
        contas,
        isLoading,
        error,
        refetch,
        createConta: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
    }
}
