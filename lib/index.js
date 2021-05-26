"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = require("webpack");
const functions_1 = require("./functions");
class LogVersionPlugin {
    constructor(options) {
        this.defaultModel = {
            options: {
                template: 'Lets try to "break this"'
            }
        };
        this.name = LogVersionPlugin.name;
        this.model = Object.assign(Object.assign({}, this.defaultModel), { options: Object.assign(Object.assign({}, this.defaultModel.options), options) });
    }
    compilationHook(compilation) {
        compilation.hooks.processAssets.tapAsync(this.name, (_assets, callback) => {
            const { chunks } = compilation;
            const { ConcatSource } = require('webpack').sources;
            Promise.all(Array.from(chunks).map(functions_1.prependChunk(this.model)))
                .then(updates => {
                const firstJSChunk = updates.find(update => update.extension == 'js');
                if (firstJSChunk === undefined)
                    return callback();
                console.log(firstJSChunk);
                compilation.updateAsset(firstJSChunk.filename, old => new ConcatSource(firstJSChunk.content, '\n', old));
                callback();
            });
        });
    }
    apply(compiler) {
        compiler.hooks.compilation.tap({
            name: this.name,
            stage: webpack_1.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
        }, (compilation) => this.compilationHook(compilation));
    }
}
module.exports = LogVersionPlugin;
