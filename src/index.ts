import { Compilation, Compiler } from 'webpack'
import { prependChunk } from './functions/templating'

import { PluginModel, PluginOptions } from './types/plugin'

class LogVersionPlugin {
  defaultModel: PluginModel = {
    options: {
      git: true,
      log: true,
      global: false,
      comment: '',
      color: '#3BBFBF',
      deployedBy: false
    }
  }
  model: PluginModel
  name: string = LogVersionPlugin.name
  
  constructor(options: PluginOptions) {
    this.model =  {
     ...this.defaultModel,
     options: {
      ...this.defaultModel.options,
      ...options
    }
  }
}

private compilationHook(compilation: Compilation) {
  compilation.hooks.processAssets.tapAsync(this.name, (_assets, callback) => {
    const { chunks } = compilation
    const { ConcatSource } = require('webpack').sources
    Promise.all(Array.from(chunks).map(prependChunk(this.model)))
    .then(updates => {
      const model = updates.find(update => update.extension === 'js')
      if (model === undefined) return callback()

      const { content, filename } = model
      if (content === undefined || filename === undefined) return callback()

      compilation.updateAsset(
        filename,
        old => new ConcatSource(content, '\n', old)
        )
      callback()
    })
  })
}

apply(compiler: Compiler) {
  compiler.hooks.compilation.tap({
    name: this.name, 
    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL 
  }, (compilation) => this.compilationHook(compilation))
}
}

module.exports = LogVersionPlugin