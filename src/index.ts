import { Compilation, Compiler } from 'webpack'
import { prependChunk } from './functions'

import { PluginModel, PluginOptions } from './types/plugin'

class LogVersionPlugin {
  defaultModel: PluginModel = {
    options: {
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
      const firstJSChunk = updates.find(update => update.extension === 'js')
      if (firstJSChunk === undefined) return callback()
      compilation.updateAsset(
        firstJSChunk.filename!,
        old => new ConcatSource(firstJSChunk.content, '\n', old)
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