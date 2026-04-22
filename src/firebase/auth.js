import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { app } from './config'

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function signOutUser() {
  return signOut(auth)
}
