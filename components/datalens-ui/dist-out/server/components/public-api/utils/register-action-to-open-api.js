"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerActionToOpenApi = void 0;
const gateway_utils_1 = require("../../../../shared/schema/gateway-utils");
const registry_1 = require("../../../registry");
const constants_1 = require("../../api-docs/constants");
const constants_2 = require("../constants");
const resolveUrl = ({ actionName }) => {
    return constants_2.PUBLIC_API_URL.replace(':action', actionName);
};
const registerActionToOpenApi = ({ actionConfig, actionName, openApi, openApiRegistry, }) => {
    const { securityTypes } = registry_1.registry.getPublicApiConfig();
    const actionSchema = (0, gateway_utils_1.getValidationSchema)(actionConfig);
    const security = securityTypes.map((type) => ({
        [type]: [],
    }));
    if (!actionSchema) {
        throw new Error(`Action schema not found for action: ${actionName}`);
    }
    const { summary, tags, experimental } = openApi;
    openApiRegistry.registerPath({
        method: constants_2.PUBLIC_API_HTTP_METHOD.toLocaleLowerCase(),
        path: resolveUrl({ actionName }),
        tags,
        summary: experimental ? `🚧 [Experimental] ${summary}` : summary,
        request: {
            ...(actionSchema.paramsSchema
                ? {
                    body: {
                        content: {
                            [constants_1.CONTENT_TYPE_JSON]: {
                                schema: actionSchema.paramsSchema,
                            },
                        },
                    },
                }
                : {}),
        },
        responses: {
            200: {
                description: 'Response',
                content: {
                    [constants_1.CONTENT_TYPE_JSON]: {
                        schema: actionSchema.resultSchema,
                    },
                },
            },
        },
        security,
        parameters: [{ $ref: `#/components/parameters/${constants_2.OPEN_API_VERSION_HEADER_COMPONENT_NAME}` }],
    });
};
exports.registerActionToOpenApi = registerActionToOpenApi;
