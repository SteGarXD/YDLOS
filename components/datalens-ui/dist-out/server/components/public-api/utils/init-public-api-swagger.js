"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPublicApiSwagger = void 0;
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const shared_1 = require("../../../../shared");
const registry_1 = require("../../../registry");
const constants_1 = require("../constants");
const initPublicApiSwagger = (app) => {
    const { config } = app;
    const installationText = `Installation – <b>${config.appInstallation}</b>`;
    const envText = `Env – <b>${config.appEnv}</b>`;
    const { baseConfig, securitySchemes, biOpenapiSchemas } = registry_1.registry.getPublicApiConfig();
    setImmediate(() => {
        const versionToDocument = Object.entries(baseConfig).reduce((acc, [version, { openApi }]) => {
            if (securitySchemes) {
                Object.keys(securitySchemes).forEach((securityType) => {
                    openApi.registry.registerComponent('securitySchemes', securityType, {
                        ...securitySchemes[securityType],
                    });
                });
            }
            openApi.registry.registerComponent('parameters', constants_1.OPEN_API_VERSION_HEADER_COMPONENT_NAME, {
                name: constants_1.PUBLIC_API_VERSION_HEADER,
                in: 'header',
                required: true,
                schema: {
                    type: 'string',
                    const: version,
                    example: version,
                },
                description: `API version header.`,
            });
            const generator = new zod_to_openapi_1.OpenApiGeneratorV31(openApi.registry.definitions);
            const generateDocumentParams = {
                openapi: '3.1.0',
                info: {
                    version,
                    title: `DataLens API `,
                    description: [installationText, envText].join('<br />'),
                },
                servers: [{ url: '/' }],
            };
            acc[version] = generator.generateDocument(generateDocumentParams);
            return acc;
        }, {});
        const versions = (0, shared_1.objectKeys)(baseConfig).map(Number);
        versions.forEach((version) => {
            var _a, _b;
            const openApiDocument = versionToDocument[version];
            openApiDocument.components = (_a = openApiDocument.components) !== null && _a !== void 0 ? _a : {};
            openApiDocument.components.schemas = {
                ...(_b = openApiDocument.components) === null || _b === void 0 ? void 0 : _b.schemas,
                ...biOpenapiSchemas,
            };
            const versionPath = `/${version}/`;
            const isLatest = version === constants_1.PUBLIC_API_LATEST_VERSION;
            const addSwaggerRoutes = (basePath) => {
                const jsonPath = `${basePath}json/`;
                app.express.get(jsonPath, (req, res) => {
                    const host = req.get('host');
                    const serverUrl = `https://${host}`;
                    openApiDocument.servers = [{ url: serverUrl }];
                    return res.json(openApiDocument);
                });
                const swaggerOptions = {
                    url: jsonPath,
                    validatorUrl: null,
                };
                app.express.use(basePath, swagger_ui_express_1.default.serveFiles(undefined, {
                    swaggerOptions,
                }));
                app.express.get(basePath, swagger_ui_express_1.default.setup(null, {
                    swaggerOptions,
                }));
            };
            addSwaggerRoutes(versionPath);
            if (isLatest) {
                addSwaggerRoutes('/');
            }
        });
    });
};
exports.initPublicApiSwagger = initPublicApiSwagger;
