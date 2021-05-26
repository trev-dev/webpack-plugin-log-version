import { PluginModel } from '../types/plugin'
import { extname, resolve } from 'path'
import { Chunk } from 'webpack'

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

const getTemplate = (model: PluginModel) => {
  const { options } = model
  if (options.template !== undefined) return model

  let template = '%c<%= name %> - <%= version %>'

  if (options.git) {
    template += '\\nCommit <%= commit %> on branch <%= branch %>'
  }

  template += '\\nDate: <%= new Date.toDateString() %>'
  if (options.comment !== '') {
    template += '\\nComment: <%= comment %>'
  }
  model.options = {
    ...options,
    template
  }
  return model
}

const escapeQuotes = (content: string) => {
  return content.replace(/"/g, '\\"')
}

const wrapConsoleLog = (model: PluginModel) => {
  const { template, color } = model.options
  const checkedTemplate = template !== undefined ? template 
    : getTemplate(model).options.template!

  return `console.log("${escapeQuotes(checkedTemplate)}", "color: ${color}");`
}

const generateLogger = 
  async (model: PluginModel): Promise<string | undefined> => {
    const { extension } = model

    if (extension === 'js') {
      const PWD = process.cwd()
      const pkg = require(resolve(PWD, 'package.json')) 
      return wrapConsoleLog(getTemplate(model))
    }

    return
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