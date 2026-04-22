import { useState, useEffect } from 'react'
import { onSnapshot, query, orderBy } from 'firebase/firestore'

export function useFirestoreSnapshot(colRef, orderByField = null) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!colRef) return

    const q = orderByField ? query(colRef, orderBy(orderByField)) : colRef

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Firestore snapshot error:', err)
        setError(err)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [colRef?.path, orderByField])

  return { docs, loading, error }
}
