"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCR_USER_AGENT_HEADER_VALUE = exports.SET_COOKIE_HEADER = exports.CSP_REPORT_TO_HEADER = exports.CSP_HEADER = exports.SERVICE_USER_ACCESS_TOKEN_HEADER = exports.PROJECT_ID_HEADER = exports.WORKBOOK_ID_HEADER = exports.TENANT_ID_HEADER = exports.DL_EMBED_TOKEN_HEADER = exports.DL_COMPONENT_HEADER = exports.DISPLAY_MODE_HEADER = exports.DASH_INFO_HEADER = exports.DLS_API_KEY_HEADER = exports.CSRF_TOKEN_HEADER = exports.US_PUBLIC_API_TOKEN_HEADER = exports.TIMEZONE_OFFSET_HEADER = exports.ACCEPT_LANGUAGE_HEADER = exports.FORWARDED_FOR_HEADER = exports.DL_CONTEXT_HEADER = exports.US_MASTER_TOKEN_HEADER = exports.SERVER_TRACE_ID_HEADER = exports.TRACE_ID_HEADER = exports.RPC_AUTHORIZATION = exports.REQUEST_ID_HEADER = exports.RequestSourceHeaderValue = exports.REQUEST_SOURCE_HEADER = exports.DlComponentHeader = exports.SuperuserHeader = exports.AuthHeader = void 0;
var AuthHeader;
(function (AuthHeader) {
    AuthHeader["Cookie"] = "cookie";
    AuthHeader["Authorization"] = "authorization";
})(AuthHeader || (exports.AuthHeader = AuthHeader = {}));
var SuperuserHeader;
(function (SuperuserHeader) {
    SuperuserHeader["XDlAllowSuperuser"] = "x-dl-allow-superuser";
    SuperuserHeader["XDlSudo"] = "x-dl-sudo";
})(SuperuserHeader || (exports.SuperuserHeader = SuperuserHeader = {}));
// header for extending response with specific data for ui or backend
// example: add authorship for ui
var DlComponentHeader;
(function (DlComponentHeader) {
    DlComponentHeader["UI"] = "ui";
    DlComponentHeader["Backend"] = "backend";
})(DlComponentHeader || (exports.DlComponentHeader = DlComponentHeader = {}));
exports.REQUEST_SOURCE_HEADER = 'x-dl-request-source';
var RequestSourceHeaderValue;
(function (RequestSourceHeaderValue) {
    // Indicates that the request was made via the public API
    RequestSourceHeaderValue["PublicApi"] = "public-api";
})(RequestSourceHeaderValue || (exports.RequestSourceHeaderValue = RequestSourceHeaderValue = {}));
exports.REQUEST_ID_HEADER = 'x-request-id';
exports.RPC_AUTHORIZATION = 'x-rpc-authorization';
exports.TRACE_ID_HEADER = 'x-trace-id';
exports.SERVER_TRACE_ID_HEADER = 'x-server-trace-id';
exports.US_MASTER_TOKEN_HEADER = 'x-us-master-token';
exports.DL_CONTEXT_HEADER = 'x-dl-context';
exports.FORWARDED_FOR_HEADER = 'x-forwarded-for';
exports.ACCEPT_LANGUAGE_HEADER = 'accept-language';
exports.TIMEZONE_OFFSET_HEADER = 'x-timezone-offset';
exports.US_PUBLIC_API_TOKEN_HEADER = 'x-us-public-api-token';
exports.CSRF_TOKEN_HEADER = 'x-csrf-token';
exports.DLS_API_KEY_HEADER = 'x-api-key';
exports.DASH_INFO_HEADER = 'x-dash-info';
exports.DISPLAY_MODE_HEADER = 'x-dl-display-mode';
exports.DL_COMPONENT_HEADER = 'x-dl-component';
exports.DL_EMBED_TOKEN_HEADER = 'x-dl-embed-token';
exports.TENANT_ID_HEADER = 'x-dl-tenantid';
exports.WORKBOOK_ID_HEADER = 'x-dl-workbookid';
exports.PROJECT_ID_HEADER = 'x-dc-projectid';
exports.SERVICE_USER_ACCESS_TOKEN_HEADER = 'x-dl-service-user-access-token';
exports.CSP_HEADER = 'content-security-policy';
exports.CSP_REPORT_TO_HEADER = 'report-to';
exports.SET_COOKIE_HEADER = 'set-cookie';
exports.SCR_USER_AGENT_HEADER_VALUE = 'StatScreenshooter';
