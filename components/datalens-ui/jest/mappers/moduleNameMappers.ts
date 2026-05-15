import {pathsToModuleNameMapper} from 'ts-jest';

import {DIPLODOC_EXTENSIONS_MOCK_PATH, UI_STYLE_MOCK_PATH} from '../mocks';

const tsconfig = require('../../tsconfig.jest.json');

export const TYPESCRIPT_ALIASES_MAPPER = pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: '<rootDir>',
});

export const CSS_MAPPER = {
    '\\.(scss|css)$': UI_STYLE_MOCK_PATH,
};

/** Mocks for ESM @diplodoc extensions to avoid "Cannot use import statement outside a module" in UI tests */
export const DIPLODOC_EXTENSIONS_MAPPER = {
    '@diplodoc/latex-extension/react': DIPLODOC_EXTENSIONS_MOCK_PATH,
    '@diplodoc/mermaid-extension/react': DIPLODOC_EXTENSIONS_MOCK_PATH,
};
