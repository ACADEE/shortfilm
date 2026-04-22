import { useQuery } from '@tanstack/react-query'
import { callFunction } from '@/utils/callFunction'

export function useImagePolling({ taskId, projectId, itemId, colName, enabled = true }) {
  return useQuery({
    queryKey: ['imageStatus', taskId],
    queryFn: () =>
      callFunction('checkTaskStatus', {
        taskId,
        projectId,
        itemType: 'image',
        itemId,
        colName,
      }),
    enabled: enabled && !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'ready' || data?.status === 'error') return false
      return 3000
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  })
}
