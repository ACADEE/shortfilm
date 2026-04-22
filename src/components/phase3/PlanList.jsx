import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { plansCol } from '@/firebase/firestore'
import PlanCard from './PlanCard'
import Spinner from '@/components/shared/Spinner'

export default function PlanList({ projectId, epId }) {
  const { docs: plans, loading } = useFirestoreSnapshot(
    projectId && epId ? plansCol(projectId, epId) : null,
    'plan_number'
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} color="#e8233a" />
      </div>
    )
  }

  if (!plans.length) {
    return <p className="text-center text-studio-muted text-sm py-6">No plans yet.</p>
  }

  return (
    <div className="space-y-2">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} projectId={projectId} epId={epId} />
      ))}
    </div>
  )
}
