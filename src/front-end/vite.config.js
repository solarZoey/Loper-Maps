import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

import basicSsl from '@vitejs/plugin-basic-ssl'

function parseCsvNodes(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8')
  const lines = raw.split(/\r?\n/).filter(Boolean)
  const nodes = []

  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(',')
    if (parts.length < 3) continue

    const name = parts[0].trim()
    const latitude = Number(parts[1])
    const longitude = Number(parts[2])

    if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      continue
    }

    nodes.push({
      id: String(i - 1),
      index: i - 1,
      name,
      latitude,
      longitude,
      hasCoordinates: true,
    })
  }

  return nodes
}

function parseAStarNodes(aStarPath) {
  const raw = fs.readFileSync(aStarPath, 'utf8')
  const regex = /([A-Za-z0-9_]+)\s*=\s*Node\("([^"]+)",\s*([-0-9.]+),\s*([-0-9.]+)\)/g
  const nodes = []
  const seen = new Set()

  let match = regex.exec(raw)
  while (match) {
    const key = match[2].trim().toLowerCase()
    if (!seen.has(key)) {
      nodes.push({
        id: String(nodes.length),
        index: nodes.length,
        name: match[2].trim(),
        latitude: Number(match[3]),
        longitude: Number(match[4]),
        hasCoordinates: true,
      })
      seen.add(key)
    }
    match = regex.exec(raw)
  }

  return nodes
}

function extractJsonObject(text) {
  const marker = '=== PATH RESULT FOR FRONTEND ==='
  const markerIndex = text.lastIndexOf(marker)
  const startSearch = markerIndex >= 0 ? markerIndex + marker.length : 0
  const start = text.indexOf('{', startSearch)

  if (start < 0) {
    return null
  }

  let inString = false
  let escaped = false
  let depth = 0

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }

  return null
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk.toString()
    })
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function directoryProcessorBridge() {
  const backendRoot = path.resolve(__dirname, '../back-end')
  const workspaceSrcRoot = path.resolve(__dirname, '..')
  const processorPath = path.join(backendRoot, 'Code Stuff', 'Directory_Processor.js')
  const csvPath = path.join(backendRoot, 'Code Stuff', 'Database', 'campusBuilding_longlat.csv')
  const aStarPath = path.join(backendRoot, 'A_Star.py')
  const mapImagePath = path.join(workspaceSrcRoot, 'images', 'UNK_Page_Campus_Map.png')

  return {
    name: 'directory-processor-bridge',
    configureServer(server) {
      server.middlewares.use('/api/navigation-graph', (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        try {
          let nodes = []

          try {
            nodes = parseAStarNodes(aStarPath)
          } catch {
            nodes = parseCsvNodes(csvPath)
          }

          sendJson(res, 200, {
            nodes,
            edges: [],
            source: 'directory-processor-astar',
          })
        } catch (error) {
          sendJson(res, 500, {
            error: 'Failed to load node CSV for navigation graph',
            details: String(error.message ?? error),
          })
        }
      })

      server.middlewares.use('/api/map-overlay', (req, res) => {
        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        try {
          const image = fs.readFileSync(mapImagePath)
          res.statusCode = 200
          res.setHeader('Content-Type', 'image/png')
          res.end(image)
        } catch (error) {
          sendJson(res, 500, {
            error: 'Failed to load map overlay image',
            details: String(error.message ?? error),
          })
        }
      })

      server.middlewares.use('/api/path', async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        try {
          const body = await readRequestJson(req)
          const startBuilding = String(body?.startBuilding ?? '').trim()
          const goalBuilding = String(body?.goalBuilding ?? '').trim()

          if (!startBuilding || !goalBuilding) {
            sendJson(res, 400, { error: 'startBuilding and goalBuilding are required' })
            return
          }

          const child = spawn('node', [processorPath, startBuilding, goalBuilding], {
            cwd: backendRoot,
            shell: false,
          })

          let stdout = ''
          let stderr = ''

          child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
          })

          child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
          })

          child.on('close', (code) => {
            if (code !== 0) {
              const details = [stderr.trim(), stdout.trim()].filter(Boolean).join(' | ')
              sendJson(res, 500, {
                error: details
                  ? `Directory_Processor.js execution failed: ${details}`
                  : 'Directory_Processor.js execution failed',
                exitCode: code,
                stderr: stderr.trim(),
                stdout: stdout.trim(),
              })
              return
            }

            const jsonText = extractJsonObject(stdout)
            if (!jsonText) {
              sendJson(res, 500, {
                error: 'Unable to parse JSON output from Directory_Processor.js',
                stdout: stdout.trim(),
              })
              return
            }

            try {
              const parsed = JSON.parse(jsonText)
              sendJson(res, 200, parsed)
            } catch (error) {
              sendJson(res, 500, {
                error: 'Invalid JSON returned by Directory_Processor.js',
                details: String(error.message ?? error),
                stdout: stdout.trim(),
              })
            }
          })

          child.on('error', (error) => {
            sendJson(res, 500, {
              error: 'Failed to start Directory_Processor.js',
              details: String(error.message ?? error),
            })
          })
        } catch (error) {
          sendJson(res, 400, {
            error: String(error.message ?? error),
          })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), directoryProcessorBridge()],
  server: {
    https: true,
    host: true,
  },
})
