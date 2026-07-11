import fs from 'node:fs'
import path from 'node:path'

/**
 * Detecção de bundles Vite (name-HASH.js|css).
 * Cobre index, main, preview, EditorApp, icons, pageMeta, demo, etc.
 */
export const VITE_BUNDLE_RE = /^[A-Za-z0-9][A-Za-z0-9._]*-[A-Za-z0-9_-]{6,}\.(js|css)$/

export function isViteBundleFile(name) {
  return VITE_BUNDLE_RE.test(name)
}

/** JS/CSS (e source maps) em editor/assets — não há mídia do cliente aí. */
export function isEditorAssetBundle(name) {
  return /\.(js|css)(\.map)?$/i.test(name)
}

export function removeMatchingFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isFile() && predicate(name)) {
      fs.unlinkSync(full)
    }
  }
}

export function removeViteBundles(dir) {
  removeMatchingFiles(dir, isViteBundleFile)
}

export function removeEditorAssetBundles(dir) {
  removeMatchingFiles(dir, isEditorAssetBundle)
}
