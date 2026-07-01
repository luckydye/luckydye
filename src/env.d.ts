/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@sv/elements" />

interface ImportMetaEnv {
  readonly VEKTOR_URL?: string;
  readonly VEKTOR_SPACE_ID?: string;
  readonly VEKTOR_ACCESS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
