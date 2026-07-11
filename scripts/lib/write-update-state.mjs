import fs from 'node:fs'
import path from 'node:path'

export function writeUpdateState(editorDir, version, opts = {}) {
  const { channel = 'stable', previousVersion = null } = opts
  const target = path.join(editorDir, 'update-state.json')

  fs.mkdirSync(editorDir, { recursive: true })
  fs.writeFileSync(
    target,
    JSON.stringify(
      {
        version,
        updatedAt: new Date().toISOString(),
        channel,
        previousVersion,
      },
      null,
      2,
    ) + '\n',
  )
  return target
}
