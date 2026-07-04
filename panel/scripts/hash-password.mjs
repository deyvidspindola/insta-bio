import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Uso: npm run hash-password --prefix panel -- "sua-senha"')
  process.exit(1)
}

const hash = bcrypt.hashSync(password, 10)
console.log('')
console.log('Hash bcrypt (cole em platform_admins.password_hash):')
console.log(hash)
console.log('')
console.log('SQL de exemplo:')
console.log(
  `INSERT INTO platform_admins (email, password_hash) VALUES ('seu@email.com', '${hash}');`,
)
console.log('')
