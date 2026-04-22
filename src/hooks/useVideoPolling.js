import { useQuery } from '@tanstack/react-query'
import { callFunction } from '@/utils/callFunction'

export function useVideoPolling({ taskId, projectId, planId, epId, enabled = true }) {
  return useQuery({
    queryKey: ['videoStatus', taskId],
    queryFn: () =>
      callFunction('checkTaskStatus', {
        taskId,
        projectId,
        itemType: 'video',
        planId,
        epId,
      }),
    enabled: enabled && !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'ready' || data?.status === 'error') return false
      return 5000
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  })
}
