/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_SOURCE?: 'sample' | 'api-football';
  readonly VITE_API_FOOTBALL_KEY?: string;
  readonly VITE_SEASON?: string;
}
