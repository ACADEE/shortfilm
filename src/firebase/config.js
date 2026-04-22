import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyDl2WII8ymWdPgNC86pE1oUfAkSUX2xPQU',
  authDomain: 'duan-ju-generator.firebaseapp.com',
  projectId: 'duan-ju-generator',
  storageBucket: 'duan-ju-generator.firebasestorage.app',
  messagingSenderId: '329782001538',
  appId: '1:329782001538:web:efbf112cb84d798b17199b',
  measurementId: 'G-HNJ0RQRF7R',
}

export const app = initializeApp(firebaseConfig)

// Analytics only in browser
if (typeof window !== 'undefined') {
  getAnalytics(app)
}
