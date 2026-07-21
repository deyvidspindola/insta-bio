import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Lê a versão canônica do monorepo (VERSION → package.json).
 */
export function readVersion(root = ROOT) {
  const versionFile = path.join(root, 'VERSION')
  if (fs.existsSync(versionFile)) {
    const v = fs.readFileSync(versionFile, 'utf8').trim()
    if (!v) throw new Error('Arquivo VERSION está vazio.')
    return v
  }

  const pkgPath = path.join(root, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    throw new Error('VERSION não encontrado e package.json raiz ausente.')
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  if (!pkg.version) {
    throw new Error('VERSION não encontrado e package.json não tem campo "version".')
  }
  return String(pkg.version)
}
