const functions = require('firebase-functions')
const admin = require('firebase-admin')
const Anthropic = require('@anthropic-ai/sdk')
const corsMiddleware = require('./cors')
const { verifyToken } = require('./authMiddleware')

const SHOWRUNNER_PROMPT = `ROLE:
You are a Senior Showrunner expert in 短剧 (duǎn jù) scriptwriting — a Chinese micro-drama genre characterized by high-tension hooks in the first 10 seconds, dramatic reversals every 30-60 seconds, and cliffhangers at every episode end. Episodes are 60-120 seconds total, designed for vertical mobile viewing without sound.

MISSION:
Transform the user's idea into:
1. A complete 30-episode mini-series architecture (season arc)
2. A fully scripted Episode 1 broken into 2-second plans for AI video generation

NARRATIVE RULES:
- Format 9:16 vertical, no sound. Rhythm: 1 plan every 2 seconds. Systematic ultra-cut.
- Episode structure (60-90s): Visual hook (0-2s) > Context (2-10s) > Escalation/Revelations (10-60s) > Incomplete final twist (60-90s)
- Mandatory unresolved tension at every episode end. Progressive revelation over 30 episodes.
- Invent a recurring visual or verbal motif that appears in EVERY episode.

TECHNICAL RULES:
- Character and location descriptions: identical and constant across ALL episodes.
- image_prompt: in English, cinematic style (cinematic lighting, hyperrealistic, vertical framing 9:16, sharp focus, photorealistic).
- Each plan must be described as a micro video movement in video_motion_prompt.

OUTPUT SCHEMA:
Return ONLY valid JSON parseable by JSON.parse(). No markdown fences. No text before or after. No comments.

{
  "title": "string",
  "global_synopsis": "string (3-5 sentences describing the 30-episode arc)",
  "recurrent_motif": "string (the recurring visual/verbal element)",
  "season_arc": ["Episode 1 hook", "Episode 2 hook", ...30 total strings],
  "characters": [
    {
      "name": "string",
      "role": "Hero | Antagonist | Secondary | Narrator",
      "image_prompt": "string [EN] ultra-detailed: exact age, ethnicity, exact clothing (color, material, cut), hairstyle, expression, lighting, photo style. Example: 'Young Asian woman, 28 years old, long black straight hair, dark navy tailored blazer over white shirt, sharp cheekbones, neutral expression, cinematic lighting, hyperrealistic, vertical framing 9:16'"
    }
  ],
  "locations": [
    {
      "name": "string",
      "image_prompt": "string [EN] no people: architecture, furniture, natural/artificial light, time of day, atmosphere, color palette. Example: 'Modern Tokyo apartment, floor-to-ceiling windows, city lights at night, minimalist furniture, warm lamp light, 9:16 vertical framing, cinematic, hyperrealistic'"
    }
  ],
  "episode_1": {
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
        "visual_action": "string — exact action happening on screen in one sentence",
        "subtitles": "string — punchy text overlay, max 8 words, empty string if none",
        "image_prompt_override": "string [EN] — character from Characters + location from Locations + specific action for this plan",
        "video_motion_prompt": "string — Seedance camera instruction: slow zoom in | zoom out | pan left | pan right | tilt up | tilt down | dolly in | character turns head | handheld shake | static shot"
      }
    ]
  }
}`

const db = admin.firestore()

async function generateScriptHandler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).send('')

  const userId = await verifyToken(req, res)
  if (!userId) return

  const { ideaText, genre, tone } = req.body
  if (!ideaText) return res.status(400).json({ error: 'ideaText required' })

  // Create project document
  const projectRef = db.collection('projects').doc()
  const projectId = projectRef.id
  await projectRef.set({
    userId,
    title: 'Untitled Series',
    status: 'p1_running',
    phases: { p1: 'running', p2: 'locked', p3: 'locked' },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('X-Project-Id', projectId)

  // Send project ID immediately
  res.write(`data: {"type":"project_id","projectId":"${projectId}"}\n\n`)

  const apiKey = functions.config().anthropic?.key || process.env.ANTHROPIC_API_KEY
  const client = new Anthropic({ apiKey })

  let fullText = ''

  try {
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      temperature: 0.9,
      system: SHOWRUNNER_PROMPT,
      messages: [
        {
          role: 'user',
          content: `IDEA: ${ideaText}\nGENRE: ${genre || 'Romance'}\nTONE: ${tone || 'Intense'}\n\nGenerate the complete series architecture and Episode 1 script now.`,
        },
      ],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text
        fullText += chunk
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`)
      }
    }

    // Parse and save to Firestore
    let parsed
    try {
      parsed = JSON.parse(fullText)
    } catch {
      const match = fullText.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else throw new Error('Could not parse JSON from response')
    }

    // Write series data
    await projectRef.update({ title: parsed.title })
    await projectRef.collection('series').doc('data').set({
      title: parsed.title,
      global_synopsis: parsed.global_synopsis,
      recurrent_motif: parsed.recurrent_motif,
      season_arc: parsed.season_arc,
    })

    // Write characters
    const charBatch = db.batch()
    for (const char of (parsed.characters || [])) {
      const charId = char.name.toLowerCase().replace(/\s+/g, '_')
      charBatch.set(projectRef.collection('characters').doc(charId), {
        ...char,
        charId,
        reference_image_url: null,
        status: 'pending',
        kie_task_id: null,
      })
    }
    await charBatch.commit()

    // Write locations
    const locBatch = db.batch()
    for (const loc of (parsed.locations || [])) {
      const locId = loc.name.toLowerCase().replace(/\s+/g, '_')
      locBatch.set(projectRef.collection('locations').doc(locId), {
        ...loc,
        locId,
        reference_image_url: null,
        status: 'pending',
        kie_task_id: null,
      })
    }
    await locBatch.commit()

    // Write episode 1 metadata
    const ep1Ref = projectRef.collection('episodes').doc('ep_01')
    await ep1Ref.set({
      ...parsed.episode_1.metadata,
      epId: 'ep_01',
      status: 'pending',
    })

    // Write plans
    const planBatch = db.batch()
    for (const plan of (parsed.episode_1.plans || [])) {
      const planId = `plan_${String(plan.plan_number).padStart(2, '0')}`
      planBatch.set(ep1Ref.collection('plans').doc(planId), {
        ...plan,
        planId,
        reference_image_url: null,
        kie_task_id: null,
        mp4_url: null,
        status: 'pending',
      })
    }
    await planBatch.commit()

    // Mark phase 1 done
    await projectRef.update({
      status: 'p1_done',
      'phases.p1': 'done',
    })

    res.write(`data: ${JSON.stringify({ type: 'done', projectId })}\n\n`)
    res.end()
  } catch (err) {
    console.error('generateScript error:', err)
    await projectRef.update({ status: 'p1_error', 'phases.p1': 'error' }).catch(() => {})
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`)
    res.end()
  }
}

exports.generateScript = functions
  .runWith({ timeoutSeconds: 540, memory: '256MB' })
  .https.onRequest((req, res) => {
    corsMiddleware(req, res, () => generateScriptHandler(req, res))
  })
