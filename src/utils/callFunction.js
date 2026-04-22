import { auth } from '@/firebase/auth'

const REGION = 'us-central1'
const PROJECT = 'duan-ju-generator'

export function getFunctionUrl(name) {
  return `https://${REGION}-${PROJECT}.cloudfunctions.net/${name}`
}

export async function callFunction(name, body) {
  const token = await auth.currentUser.getIdToken()
  const url = getFunctionUrl(name)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Function ${name} failed (${res.status}): ${text}`)
  }
  return res.json()
}
