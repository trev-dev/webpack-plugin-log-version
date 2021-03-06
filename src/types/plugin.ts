export declare type PluginOptions = {
  color: string
  comment: string
  deployedBy: boolean | string,
  git: boolean
  global: boolean
  globalName?: string
  log: boolean
  name?: string
  template?: string
}

export declare interface PluginModel {
  filename?: string
  extension?: string
  content?: string
  options: PluginOptions
}

export declare interface TemplateVariables extends PluginOptions {
  branch?: string,
  commit?: string,
  dirty?: boolean,
  date: string,
  name: string,
  version: string
}

export declare interface RenderedTemplate {
  content: {
    log: string
    global: string
  },
  name: string
}