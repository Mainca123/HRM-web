/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface AppRuntimeConfig {
  API_BASE_URL?: string;
}

interface Window {
  __APP_CONFIG__?: AppRuntimeConfig;
}
