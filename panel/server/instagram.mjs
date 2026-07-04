import fs from 'node:fs'
import path from 'node:path'

export function normalizeInstagramHandle(input) {
  let value = String(input ?? '').trim()
  value = value.replace(/^@+/, '')
  value = value.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
  value = value.replace(/\/.*$/, '').split('?')[0]
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(value)) {
    throw new Error('Usuário do Instagram inválido')
  }
  return value.toLowerCase()
}

function decodeHtmlEntities(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
}

function parseOgMeta(html) {
  const pick = (prop) => {
    const m = html.match(new RegExp(`property="${prop}"\\s+content="([^"]+)"`))
    return m ? decodeHtmlEntities(m[1]) : null
  }
  return {
    title: pick('og:title'),
    description: pick('og:description'),
    image: pick('og:image'),
  }
}

function parseFullName(title, username) {
  if (!title) return username
  const m = title.match(new RegExp(`^(.+?)\\s+\\(@${username}\\)`, 'i'))
  return m ? m[1].trim() : username
}

function parseBiography(description) {
  if (!description) return null
  if (/^\d[\d,.]*\s+(Followers|seguidores)/i.test(description)) return null
  return description
}

export async function fetchInstagramProfile(handleInput) {
  const username = normalizeInstagramHandle(handleInput)
  const res = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error('Não foi possível acessar o perfil do Instagram')

  const html = await res.text()
  const meta = parseOgMeta(html)
  if (!meta.image) throw new Error('Perfil não encontrado ou indisponível')

  return {
    username,
    fullName: parseFullName(meta.title, username),
    biography: parseBiography(meta.description),
    profilePicUrl: meta.image,
    profileUrl: `https://www.instagram.com/${username}/`,
  }
}

export async function downloadInstagramAvatar(imageUrl, assetsDir, username) {
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Referer: 'https://www.instagram.com/',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error('Não foi possível baixar a foto do perfil')

  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 128) throw new Error('Foto do perfil inválida')

  fs.mkdirSync(assetsDir, { recursive: true })
  const safe = username.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'perfil'
  const filename = `instagram-${safe}.jpg`
  fs.writeFileSync(path.join(assetsDir, filename), buffer)
  return `assets/${filename}`
}

export function applyInstagramToBio(clientDir, profile, clientName) {
  const bioPath = path.join(clientDir, 'bio.json')
  const data = JSON.parse(fs.readFileSync(bioPath, 'utf-8'))

  data.brand.name = clientName || profile.fullName || profile.username
  data.brand.instagram = {
    handle: `@${profile.username}`,
    url: profile.profileUrl,
  }
  if (profile.biography) data.brand.tagline = profile.biography
  if (data.brand.seo) {
    data.brand.seo.title = `${data.brand.name} · Link na Bio`
    data.brand.seo.description =
      profile.biography || `Página de links de ${data.brand.name}.`
  }

  return { bioPath, data }
}

export async function applyInstagramToClient(clientDir, profile, clientName) {
  const assetsDir = path.join(clientDir, 'assets')
  const logoPath = await downloadInstagramAvatar(profile.profilePicUrl, assetsDir, profile.username)
  const { bioPath, data } = applyInstagramToBio(clientDir, profile, clientName)
  data.brand.logo = logoPath
  fs.writeFileSync(bioPath, `${JSON.stringify(data, null, 2)}\n`)
}
