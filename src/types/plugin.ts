export declare type PluginOptions = {
  template?: string
  git: boolean
  global: boolean
  globalName?: string
  comment: string
  color: string
}

export declare interface PluginModel {
  filename?: string
  extension?: string
  content?: string
  options: PluginOptions
}