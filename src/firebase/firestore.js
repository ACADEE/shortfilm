import { getFirestore, collection, doc } from 'firebase/firestore'
import { app } from './config'

export const db = getFirestore(app)

export const projectRef = (projectId) => doc(db, 'projects', projectId)
export const projectsCol = () => collection(db, 'projects')

export const seriesRef = (projectId) => doc(db, 'projects', projectId, 'series', 'data')
export const metadataRef = (projectId) => doc(db, 'projects', projectId, 'metadata', 'data')

export const charactersCol = (projectId) => collection(db, 'projects', projectId, 'characters')
export const locationsCol = (projectId) => collection(db, 'projects', projectId, 'locations')
export const episodesCol = (projectId) => collection(db, 'projects', projectId, 'episodes')

export const episodeRef = (projectId, epId) =>
  doc(db, 'projects', projectId, 'episodes', epId)
export const plansCol = (projectId, epId) =>
  collection(db, 'projects', projectId, 'episodes', epId, 'plans')
export const planRef = (projectId, epId, planId) =>
  doc(db, 'projects', projectId, 'episodes', epId, 'plans', planId)
