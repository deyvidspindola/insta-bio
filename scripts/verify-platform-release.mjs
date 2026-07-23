import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'platform-release')

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exitCode = 1
}

function ok(msg) {
  console.log(`✓ ${msg}`)
}

function readHtml(file) {
  return fs.readFileSync(file, 'utf8')
}

function bundleExists(dir, pattern) {
  if (!fs.existsSync(dir)) return null
  return fs.readdirSync(dir).find((f) => pattern.test(f)) ?? null
}

if (!fs.existsSync(OUT)) {
  console.error('platform-release/ não encontrado. Rode: npm run build:platform')
  process.exit(1)
}

console.log('Verificando platform-release/…\n')

const checks = [
  ['.htaccess', path.join(OUT, '.htaccess')],
  ['preview.html (raiz)', path.join(OUT, 'preview.html')],
  ['editor/preview.html', path.join(OUT, 'editor', 'preview.html')],
  ['_template/index.html', path.join(OUT, '_template', 'index.html')],
  ['_template/editor/preview.html', path.join(OUT, '_template', 'editor', 'preview.html')],
  ['panel/index.html', path.join(OUT, 'panel', 'index.html')],
]

for (const [label, file] of checks) {
  if (fs.existsSync(file)) ok(label)
  else fail(label)
}

if (fs.existsSync(path.join(OUT, 'demo.html'))) {
  fail('demo.html não deve ser publicado na plataforma')
} else {
  ok('demo.html ausente (ok)')
}

const previewJs = bundleExists(path.join(OUT, 'editor', 'assets'), /^preview-.*\.js$/)
const previewHtml = readHtml(path.join(OUT, 'preview.html'))
if (previewJs && previewHtml.includes(previewJs)) ok(`/preview carrega editor/assets/${previewJs}`)
else fail('preview.html não referencia bundle preview-*.js')

const tplBioJs = bundleExists(path.join(OUT, '_template', 'assets'), /^index-.*\.js$/)
if (tplBioJs) ok(`_template/assets/${tplBioJs}`)
else fail('_template/assets sem index-*.js')

const htaccess = readHtml(path.join(OUT, '.htaccess'))
for (const rule of ['^demo/?$', '^editor/preview/?$', '^editor/assets/']) {
  if (htaccess.includes(rule)) ok(`.htaccess contém regra ${rule}`)
  else fail(`.htaccess sem regra ${rule}`)
}

console.log('')
if (process.exitCode) {
  console.error('Release com problemas — corrija antes de subir.')
  process.exit(1)
}
console.log('Release OK para deploy.')
