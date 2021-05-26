export declare type PluginOptions = {
    template?: string;
};
export declare interface PluginModel {
    filename?: string;
    extension?: string;
    content?: string;
    options: PluginOptions;
}
