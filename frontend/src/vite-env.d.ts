/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

// interface ViteTypeOptions {
//   // By adding this line, you can make the type of ImportMetaEnv strict
//   // to disallow unknown keys.
//   // strictImportMetaEnv: unknown
// }
interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_KEY: string
  // Add other VITE_ variables here as needed
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}