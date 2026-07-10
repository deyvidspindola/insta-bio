import type { IconName } from '@bio-types'

export type IconCategory =
  | 'all'
  | 'contact'
  | 'social'
  | 'faith'
  | 'business'
  | 'events'
  | 'media'
  | 'general'

export interface IconCatalogEntry {
  id: IconName
  label: string
  category: Exclude<IconCategory, 'all'>
  keywords?: string[]
}

export const ICON_CATEGORY_LABELS: Record<IconCategory, string> = {
  all: 'Todos',
  contact: 'Contato',
  social: 'Redes',
  faith: 'Fé',
  business: 'Negócio',
  events: 'Eventos',
  media: 'Mídia',
  general: 'Geral',
}

export const ICON_CATALOG: IconCatalogEntry[] = [
  // Contato
  { id: 'whatsapp', label: 'WhatsApp', category: 'contact', keywords: ['zap', 'mensagem'] },
  { id: 'phone', label: 'Telefone', category: 'contact', keywords: ['ligar', 'celular'] },
  { id: 'mail', label: 'E-mail', category: 'contact', keywords: ['email', 'correio'] },
  { id: 'message', label: 'Mensagem', category: 'contact', keywords: ['chat', 'sms'] },
  { id: 'send', label: 'Enviar', category: 'contact', keywords: ['enviar', 'paper plane'] },
  { id: 'telegram', label: 'Telegram', category: 'contact' },

  // Redes
  { id: 'instagram', label: 'Instagram', category: 'social' },
  { id: 'youtube', label: 'YouTube', category: 'social', keywords: ['video', 'play'] },
  { id: 'tiktok', label: 'TikTok', category: 'social' },
  { id: 'facebook', label: 'Facebook', category: 'social' },
  { id: 'spotify', label: 'Spotify', category: 'social', keywords: ['musica'] },
  { id: 'share', label: 'Compartilhar', category: 'social' },
  { id: 'link', label: 'Link', category: 'social', keywords: ['url'] },
  { id: 'globe', label: 'Site / Web', category: 'social', keywords: ['internet', 'www'] },
  { id: 'megaphone', label: 'Megafone', category: 'social', keywords: ['anuncio', 'promo'] },

  // Fé
  { id: 'church', label: 'Igreja', category: 'faith', keywords: ['templo'] },
  { id: 'pray', label: 'Oração', category: 'faith', keywords: ['oracao', 'igreja'] },
  { id: 'cross', label: 'Cruz', category: 'faith', keywords: ['cristo', 'fe'] },
  { id: 'book', label: 'Livro / Bíblia', category: 'faith', keywords: ['biblia', 'leitura'] },
  { id: 'droplets', label: 'Água / Batismo', category: 'faith', keywords: ['batismo', 'agua'] },
  { id: 'hand-heart', label: 'Voluntariado', category: 'faith', keywords: ['doar', 'ajuda'] },
  { id: 'heart', label: 'Coração', category: 'faith', keywords: ['amor'] },
  { id: 'sparkles', label: 'Brilho', category: 'faith', keywords: ['destaque'] },

  // Negócio
  { id: 'cart', label: 'Carrinho', category: 'business', keywords: ['loja', 'compra'] },
  { id: 'store', label: 'Loja', category: 'business', keywords: ['shop'] },
  { id: 'card', label: 'Cartão', category: 'business', keywords: ['pagamento', 'pix'] },
  { id: 'wallet', label: 'Carteira', category: 'business', keywords: ['dinheiro'] },
  { id: 'tag', label: 'Etiqueta', category: 'business', keywords: ['preco', 'oferta'] },
  { id: 'percent', label: 'Desconto', category: 'business', keywords: ['promo', '%'] },
  { id: 'briefcase', label: 'Maleta', category: 'business', keywords: ['trabalho'] },
  { id: 'building', label: 'Prédio', category: 'business', keywords: ['empresa'] },
  { id: 'handshake', label: 'Parceria', category: 'business', keywords: ['acordo'] },
  { id: 'file', label: 'Documento', category: 'business', keywords: ['pdf', 'arquivo'] },
  { id: 'form', label: 'Formulário', category: 'business', keywords: ['inscricao'] },
  { id: 'lock', label: 'Cadeado', category: 'business', keywords: ['seguro', 'privado'] },

  // Eventos
  { id: 'calendar', label: 'Calendário', category: 'events', keywords: ['data', 'agenda'] },
  { id: 'clock', label: 'Relógio', category: 'events', keywords: ['hora', 'horario'] },
  { id: 'ticket', label: 'Ingresso', category: 'events', keywords: ['evento'] },
  { id: 'map-pin', label: 'Localização', category: 'events', keywords: ['mapa', 'endereco'] },
  { id: 'compass', label: 'Bússola', category: 'events', keywords: ['direcao'] },
  { id: 'users', label: 'Pessoas / Grupo', category: 'events', keywords: ['comunidade'] },
  { id: 'baby', label: 'Bebê / Kids', category: 'events', keywords: ['crianca'] },
  { id: 'party', label: 'Festa', category: 'events', keywords: ['celebracao'] },
  { id: 'cake', label: 'Bolo', category: 'events', keywords: ['aniversario'] },
  { id: 'plane', label: 'Avião', category: 'events', keywords: ['viagem'] },
  { id: 'car', label: 'Carro', category: 'events', keywords: ['transporte'] },

  // Mídia
  { id: 'camera', label: 'Câmera', category: 'media', keywords: ['foto'] },
  { id: 'image', label: 'Imagem', category: 'media', keywords: ['foto', 'galeria'] },
  { id: 'video', label: 'Vídeo', category: 'media' },
  { id: 'music', label: 'Música', category: 'media' },
  { id: 'mic', label: 'Microfone', category: 'media', keywords: ['podcast'] },
  { id: 'headphones', label: 'Fone / Áudio', category: 'media' },
  { id: 'newspaper', label: 'Notícia', category: 'media', keywords: ['blog'] },
  { id: 'palette', label: 'Paleta', category: 'media', keywords: ['arte', 'design'] },

  // Geral
  { id: 'home', label: 'Casa / Início', category: 'general' },
  { id: 'star', label: 'Estrela', category: 'general', keywords: ['favorito'] },
  { id: 'gift', label: 'Presente', category: 'general' },
  { id: 'coffee', label: 'Café', category: 'general' },
  { id: 'utensils', label: 'Comida', category: 'general', keywords: ['restaurante', 'menu'] },
  { id: 'leaf', label: 'Folha', category: 'general', keywords: ['natureza', 'eco'] },
  { id: 'flame', label: 'Chama', category: 'general', keywords: ['fogo', 'quente'] },
  { id: 'zap', label: 'Raio / Energia', category: 'general' },
  { id: 'sun', label: 'Sol', category: 'general' },
  { id: 'moon', label: 'Lua', category: 'general' },
  { id: 'check', label: 'Check', category: 'general', keywords: ['ok', 'feito'] },
  { id: 'info', label: 'Info', category: 'general', keywords: ['ajuda'] },
  { id: 'bell', label: 'Sino', category: 'general', keywords: ['alerta', 'notificacao'] },
  { id: 'bookmark', label: 'Marcador', category: 'general', keywords: ['salvar'] },
  { id: 'thumbs-up', label: 'Curtir', category: 'general', keywords: ['like'] },
  { id: 'smile', label: 'Sorriso', category: 'general', keywords: ['emoji'] },
  { id: 'graduation', label: 'Formatura', category: 'general', keywords: ['estudo', 'curso'] },
  { id: 'shirt', label: 'Camiseta', category: 'general', keywords: ['roupa'] },
  { id: 'scissors', label: 'Tesoura', category: 'general', keywords: ['corte', 'beleza'] },
  { id: 'dumbbell', label: 'Haltere', category: 'general', keywords: ['academia', 'fitness'] },
  { id: 'download', label: 'Download', category: 'general', keywords: ['baixar'] },
  { id: 'external', label: 'Link externo', category: 'general', keywords: ['abrir'] },
]

export const ICON_OPTIONS: IconName[] = ICON_CATALOG.map((entry) => entry.id)

export const ICON_LABELS: Record<IconName, string> = Object.fromEntries(
  ICON_CATALOG.map((entry) => [entry.id, entry.label]),
) as Record<IconName, string>

export function filterIconCatalog(
  query: string,
  category: IconCategory,
): IconCatalogEntry[] {
  const q = query.trim().toLowerCase()
  return ICON_CATALOG.filter((entry) => {
    if (category !== 'all' && entry.category !== category) return false
    if (!q) return true
    const haystack = [entry.id, entry.label, ...(entry.keywords ?? [])]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
