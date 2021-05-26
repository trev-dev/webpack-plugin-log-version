import { PluginModel } from './types/plugin';
import { Chunk } from 'webpack';
export declare const prependChunk: (model: PluginModel) => (chunk: Chunk) => Promise<PluginModel>;
