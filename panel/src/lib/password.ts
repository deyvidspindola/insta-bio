// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar leitura/digitação.
const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generatePassword(length = 12): string {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CHARS[values[i] % CHARS.length]
  }
  return out
}
