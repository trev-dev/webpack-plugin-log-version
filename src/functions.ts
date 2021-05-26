import { PluginModel, PluginOptions } from './types/plugin'
import { extname } from 'path'
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

const wrapConsoleLog = (content: string) => {
  return `console.log("${sanitize(content)}");`
}

const generateLogger = 
  async (model: PluginModel): Promise<string | undefined> => {
    const { extension } = model
    const { template } = model.options

    switch (extension) {
      case 'js':
        return wrapConsoleLog(template!)
      default:
        return model.content 
    }
  }

export const prependChunk = (model: PluginModel) => async (chunk: Chunk) => {
  if (chunk.canBeInitial()) {
    const [firstFile] = chunk.files
    model.filename = firstFile
    model.extension = getExtension(model)
    model.content = await generateLogger(model)
    return model
  }
  return model
}