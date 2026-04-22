const functions = require('firebase-functions')
const admin = require('firebase-admin')
const Anthropic = require('@anthropic-ai/sdk')
const corsMiddleware = require('./cors')
const { verifyToken } = require('./authMiddleware')
const { verifyProjectOwner } = require('./ownershipMiddleware')

const db = admin.firestore()

const CONTINUATION_SYSTEM_PROMPT = `ROLE:
You are a Senior Showrunner expert in 短剧 (duǎn jù) scriptwriting — high-tension hooks, dramatic reversals every 30-60 seconds, mandatory cliffhangers. Episodes are 60-120 seconds, vertical mobile viewing without sound.

NARRATIVE RULES:
- Format 9:16 vertical, no sound. Rhythm: 1 plan every 2 seconds. Systematic ultra-cut.
- Episode structure (60-90s): Visual hook (0-2s) > Context (2-10s) > Escalation/Revelations (10-60s) > Incomplete final twist (60-90s)
- Mandatory unresolved tension at every episode end.
- The recurring visual/verbal motif must appear in this episode.
- Character and location descriptions: use EXACTLY the provided image_prompts — do not invent new characters or locations.

TECHNICAL RULES:
- image_prompt_override: in English, cinematic style (hyperrealistic, vertical framing 9:16, cinematic lighting).
- Each plan must be described as a micro video movement in video_motion_prompt.

OUTPUT SCHEMA:
Return ONLY valid JSON parseable by JSON.parse(). No markdown fences. No text before or after.`

function buildEpisodeUserMessage(seriesData, characters, locations, prevEpisode, epNumber) {
  const charList = characters
    .map((c) => `  • ${c.name} (${c.role}): ${c.image_prompt}`)
    .join('\n')
  const locList = locations
    .map((l) => `  • ${l.name}: ${l.image_prompt}`)
    .join('\n')

  return `SÉRIE EN COURS:
  Titre: ${seriesData.title}
  Synopsis global: ${seriesData.global_synopsis}
  Motif récurrent: ${seriesData.recurrent_motif}
  Arc Épisode ${epNumber}: ${(seriesData.season_arc || [])[epNumber - 1] || ''}

RÉSUMÉ ÉPISODE PRÉCÉDENT (Ép. ${epNumber - 1}):
  Titre: ${prevEpisode.title || ''}
  Objectif de tension: ${prevEpisode.tension_goal || ''}
  Cliffhanger non résolu: ${prevEpisode.cliffhanger || ''}

PERSONNAGES (CONSTANTS — NE PAS MODIFIER):
${charList}

DÉCORS (CONSTANTS — NE PAS MODIFIER):
${locList}

MISSION: Scripter l'Épisode ${epNumber} qui résout le cliffhanger ci-dessus et introduit une nouvelle tension non résolue conformément à l'arc saison. Respecter les règles 短剧 (rythme, 9:16, sans son). Inclure le motif récurrent.

OUTPUT: JSON valide uniquement — même structure que episode_1 mais pour l'épisode ${epNumber}.

{
  "episode_${epNumber}": {
    "metadata": {
      "title": "string",
      "tension_goal": "string",
      "cliffhanger": "string"
    },
    "plans": [
      {
        "plan_number": 1,
        "duration_seconds": 2,
        "narrative_phase": "Hook | Context | Escalade | Twist",
        "visual_action": "string",
        "subtitles": "string",
        "image_prompt_override": "string [EN]",
        "video_motion_prompt": "string"
      }
    ]
  }
}`
}

async function generateEpisodeHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).send('')

  const userId = await verifyToken(req, res)
  if (!userId) return

  const { projectId, epNumber } = req.body
  if (!projectId || !epNumber || epNumber < 2) {
    return res.status(400).json({ error: 'projectId and epNumber >= 2 required' })
  }

  if (!(await verifyProjectOwner(projectId, userId, res))) return

  const epId = `ep_${String(epNumber).padStart(2, '0')}`
  const prevEpId = `ep_${String(epNumber - 1).padStart(2, '0')}`

  // Load all series context in parallel
  const projectRef = db.collection('projects').doc(projectId)
  const [seriesSnap, charsSnap, locsSnap, prevEpSnap] = await Promise.all([
    projectRef.collection('series').doc('data').get(),
    projectRef.collection('characters').get(),
    projectRef.collection('locations').get(),
    projectRef.collection('episodes').doc(prevEpId).get(),
  ])

  if (!seriesSnap.exists) {
    return res.status(404).json({ error: 'Series data not found' })
  }
  if (!prevEpSnap.exists) {
    return res.status(404).json({ error: `Episode ${epNumber - 1} not found — generate it first` })
  }

  const seriesData = seriesSnap.data()
  const characters = charsSnap.docs.map((d) => d.data())
  const locations = locsSnap.docs.map((d) => d.data())
  const prevEpisode = prevEpSnap.data()

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('X-Accel-Buffering', 'no')

  const apiKey =
    (functions.config().anthropic && functions.config().anthropic.key) ||
    process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Anthropic API key not configured' })}\n\n`)
    res.end()
    return
  }

  const client = new Anthropic({ apiKey })
  let fullText = ''

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      temperature: 0.9,
      system: CONTINUATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildEpisodeUserMessage(seriesData, characters, locations, prevEpisode, epNumber),
        },
      ],
    })

    stream.on('text', (text) => {
      fullText += text
      res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`)
    })

    await stream.finalMessage()

    // Parse JSON response
    let parsed
    try {
      parsed = JSON.parse(fullText)
    } catch {
      const match = fullText.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else throw new Error('Response was not valid JSON')
    }

    const epData = parsed[`episode_${epNumber}`]
    if (!epData) throw new Error(`Missing episode_${epNumber} key in response`)

    // Write episode metadata
    const epRef = projectRef.collection('episodes').doc(epId)
    await epRef.set({
      ...(epData.metadata || {}),
      epId,
      status: 'pending',
    })

    // Write plans
    if (epData.plans?.length) {
      const planBatch = db.batch()
      for (const plan of epData.plans) {
        const planId = `plan_${String(plan.plan_number).padStart(2, '0')}`
        planBatch.set(epRef.collection('plans').doc(planId), {
          ...plan,
          planId,
          reference_image_url: null,
          kie_task_id: null,
          mp4_url: null,
          status: 'pending',
        })
      }
      await planBatch.commit()
    }

    res.write(`data: ${JSON.stringify({ type: 'done', epId })}\n\n`)
    res.end()
  } catch (err) {
    console.error('[generateEpisode] error:', err)
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
    res.end()
  }
}

exports.generateEpisode = functions
  .runWith({ timeoutSeconds: 300, memory: '256MB' })
  .https.onRequest((req, res) => {
    corsMiddleware(req, res, () => generateEpisodeHandler(req, res))
  })
