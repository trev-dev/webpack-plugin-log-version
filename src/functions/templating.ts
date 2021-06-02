import { PluginModel, RenderedTemplate, TemplateVariables } from '../types/plugin'
import { extname, resolve, join } from 'path'
import { gitAvailable, gitCommand } from './git'
import { Chunk } from 'webpack'
import { IPackageJson } from '../types/package.json'
import { PluginError } from '../classes'
import chalk from 'chalk'
import ejs from 'ejs'

const getExtension = (filename: string): string | undefined => {
  if (filename === undefined) return

  const fullExtension = extname(filename.toLowerCase())
  const matches = fullExtension.match(/\.(\w+)\??/)

  if (matches !== null) {
    const [_, filetype] = matches
    return filetype
  }
}

const wrapConsoleLog = (model: PluginModel, template: RenderedTemplate) => {
  const { content } = template
  const { color } = model.options
  return `console.log("%c${content.log}","color:${color}");`
}

const wrapInGlobal = (model: PluginModel, template: RenderedTemplate) => {
  const { globalName } = model.options
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
        const deployedBy = options.deployedBy === true ? await gitCommand(
          'git config user.name'
        ) : options.deployedBy;

        templateVars = {
          ...templateVars,
          branch: branch.trim(),
          commit: commit.trim().slice(0, 7),
          dirty: dirty.trim() !== '',
          deployedBy: deployedBy !== false ? deployedBy.trim() : deployedBy
        }
      }
    } catch (e) {
      model.options.git = false
      console.error(chalk.red(e))
    }
  }

  if (templateVars.deployedBy === true) {
    throw new PluginError(
      'deployedBy was set to true while git was set to '+ 
      'false.\nUse a string when git is disabled.\n'
    )
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
    let filename, extension
    const chunks = Array.from(chunk.files)

    for (let i = 0; i < chunks.length; i++) {
      extension = getExtension(chunks[i])
      if (extension === 'js') filename = chunks[i]
    }

    if (filename === undefined) return model

    let updatedModel = {
      ...model,
      filename,
      extension
    }

    try {
      updatedModel.content = await generateLogger(updatedModel)
      return updatedModel
    }
    catch (error) {
      console.error(chalk.redBright(error))
      return model
    }
  }
  return model
}
