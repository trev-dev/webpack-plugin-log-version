import { PluginModel, RenderedTemplate, TemplateVariables } from '../types/plugin'
import { extname, resolve, join } from 'path'
import { gitAvailable, gitCommand } from './git'
import { Chunk } from 'webpack'
import { IPackageJson } from '../types/package.json'
import chalk from 'chalk'
import ejs from 'ejs'

const getExtension = (model: PluginModel): string | undefined => {
  const { filename } = model
  if (filename === undefined) return model.extension

    const fullExtension = extname(filename.toLowerCase())
  const matches = fullExtension.match(/\.(\w+)\??/)

  if (matches !== null) {
    const [_, filetype] = matches
    return filetype
  }

  return model.extension
}

const wrapConsoleLog = (model: PluginModel, template: RenderedTemplate) => {
  const { content } = template
  const { color } = model.options
  return `console.log("%c${content.log}","color:${color}");`
}

const wrapInGlobal = (model: PluginModel, template: RenderedTemplate) => {
  const { globalName, color } = model.options
  const { name, content } = template
  const globalProp = globalName !== undefined ? globalName : name
  return `window['${globalProp}'] = ${content.global};`
}

const renderTemplate = async (
  model: PluginModel
): Promise<RenderedTemplate> => {
  const { options } = model
  const pkg: IPackageJson = require(resolve(process.cwd(), 'package.json'))

  let templateVars: TemplateVariables = {
    ...options,
    date: new Date().toDateString(),
    name: options.name === undefined ? pkg.name : options.name,
    version: pkg.version,
  }

  if (options.git) {
    try {
      if (await gitAvailable()) {
        const branch = await gitCommand('git branch --show-current')
        const commit = await gitCommand('git rev-parse HEAD')
        const dirty = await gitCommand('git status --porcelain')
        templateVars = {
          ...templateVars,
          branch: branch.trim(),
          commit: commit.trim().slice(0, 7),
          dirty: dirty.trim() !== ''
        }
      }
    } catch (e) {
      model.options.git = false
      console.error(chalk.red(e))
    }
  }

  const defaultLog = join(
    resolve(__dirname, '../templates', 'default.ejs')
  )
  const defaultGlobal = join(
    resolve(__dirname, '../templates', 'default.global.ejs')
  )
  const globalTemplate = options.global ? await ejs.renderFile(
    defaultGlobal, templateVars, { async: true }
  ) : ''

  if (options.template) {
    return {
      content: {
        log: ejs.render(options.template, templateVars),
        global: globalTemplate
      },
      name: pkg.name
    }
  }

  const logTemplate = options.log ? await ejs.renderFile(
    defaultLog, templateVars, { async: true }
  ) : ''

  return {
    content:{
      log: logTemplate,
      global: globalTemplate
    },
    name: pkg.name
  }
}

const generateLogger = 
  async (model: PluginModel): Promise<string | undefined> => {
    const { extension, options } = model
    const template = await renderTemplate(model)

    let content = ''
    if (extension === 'js') {
      if (options.global) {
        const globalTemplate = 
        content += wrapInGlobal(model, template)
      }
      if (options.log) {
        content += wrapConsoleLog(model, template)
      }
    }
    return content
  }

export const prependChunk = (model: PluginModel) => async (chunk: Chunk) => {
  if (chunk.canBeInitial()) {
    const [firstFile] = chunk.files
    model.filename = firstFile
    model.extension = getExtension(model)

    try {
      model.content = await generateLogger(model)
      return model
    }
    catch (error) {
      console.error(error)
    }
  }
  return model
}
