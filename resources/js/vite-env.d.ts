/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __BIO_CONFIG__?: unknown
  __BIO_JSON_PATH__?: string
  __ANALYTICS_KEY__?: string
  __ANALYTICS_URL__?: string
  __BIO_WATERMARK__?: boolean
}
