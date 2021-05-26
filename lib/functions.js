"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prependChunk = void 0;
const path_1 = require("path");
const getExtension = (model) => {
    const { filename } = model;
    if (filename === undefined)
        return model.extension;
    const fullExtension = path_1.extname(filename.toLowerCase());
    const matches = fullExtension.match(/\.(\w+)\??/);
    if (matches !== null) {
        const [_, filetype] = matches;
        return filetype;
    }
    return model.extension;
};
const sanitize = (content) => {
    return content.replace(/"/g, '\\"');
};
const wrapConsoleLog = (content) => {
    return `console.log("${sanitize(content)}");`;
};
const generateLogger = (model) => __awaiter(void 0, void 0, void 0, function* () {
    const { extension } = model;
    const { template } = model.options;
    switch (extension) {
        case 'js':
            return wrapConsoleLog(template);
        default:
            return model.content;
    }
});
const prependChunk = (model) => (chunk) => __awaiter(void 0, void 0, void 0, function* () {
    if (chunk.canBeInitial()) {
        const [firstFile] = chunk.files;
        model.filename = firstFile;
        model.extension = getExtension(model);
        model.content = yield generateLogger(model);
        return model;
    }
    return model;
});
exports.prependChunk = prependChunk;
