import bcrypt from 'bcryptjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const password = process.argv[2]
if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "sua-senha"')
  process.exit(1)
}

const hash = await bcrypt.hash(password, 10)
const authPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../auth.json')

let auth = { username: 'admin@local.dev' }
if (fs.existsSync(authPath)) {
  auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'))
}

auth.passwordHash = hash
delete auth.password

fs.writeFileSync(authPath, `${JSON.stringify(auth, null, 2)}\n`)
console.log('auth.json atualizado com passwordHash (dev/Node).')
console.log('')
console.log('Para a HostGator (PHP), cole este hash em editor/php/auth.config.php:')
console.log('')
console.log(`  define('AUTH_PASSWORD_HASH', '${hash}');`)
console.log('')
