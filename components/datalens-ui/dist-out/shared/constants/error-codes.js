"use strict";
// List of all error codes, if we need new - add it here.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorContentTypes = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["SourceConfigTableNotConfigured"] = "ERR.DS_API.SOURCE_CONFIG.TABLE_NOT_CONFIGURED";
    ErrorCode["DbCannotParseDatetime"] = "ERR.DS_API.DB.CANNOT_PARSE.DATETIME";
    ErrorCode["DbCannotParseNumber"] = "ERR.DS_API.DB.CANNOT_PARSE.NUMBER";
    ErrorCode["DbJoinColumnTypeMismatch"] = "ERR.DS_API.DB.JOIN_COLUMN_TYPE_MISMATCH";
    ErrorCode["DbDataPreparationNotFinished"] = "ERR.DS_API.DB.DATA_PREPARATION_NOT_FINISHED";
    ErrorCode["DbMaterizalizationNotFinished"] = "ERR.DS_API.DB.MATERIALIZATION_NOT_FINISHED";
    ErrorCode["DbMemoryLimitExceeded"] = "ERR.DS_API.DB.MEMORY_LIMIT_EXCEEDED";
    ErrorCode["ChytTableAccessDenied"] = "ERR.DS_API.DB.CHYT.TABLE_ACCESS_DENIED";
    ErrorCode["ChytTableHasNoSchema"] = "ERR.DS_API.DB.CHYT.TABLE_HAS_NO_SCHEMA";
    ErrorCode["ChytInvalidJoinMoreThanOneTable"] = "ERR.DS_API.DB.CHYT.INVALID_SORTED_JOIN.MORE_THAN_ONE_TABLE";
    ErrorCode["ChytInvalidJoinNotKeyColumn"] = "ERR.DS_API.DB.CHYT.INVALID_SORTED_JOIN.NOT_A_KEY_COLUMN";
    ErrorCode["ChytInvalidJoinNotKeyPrefixColumn"] = "ERR.DS_API.DB.CHYT.INVALID_SORTED_JOIN.NOT_KEY_PREFIX_COLUMN";
    ErrorCode["ValidationAggDouble"] = "ERR.DS_API.VALIDATION.AGG.DOUBLE";
    ErrorCode["ValidationAggInconsistent"] = "ERR.DS_API.VALIDATION.AGG.INCONSISTENT";
    ErrorCode["ValidationWinFuncNoAgg"] = "ERR.DS_API.VALIDATION.WIN_FUNC.NO_AGG";
    ErrorCode["DBError"] = "ERR.DS_API.DB";
    ErrorCode["DBQueryError"] = "ERR.DS_API.DB.INVALID_QUERY";
    ErrorCode["DBSourceDoesntExist"] = "ERR.DS_API.DB.SOURCE_DOES_NOT_EXIST";
    ErrorCode["SourceTimeout"] = "ERR.DS_API.DB.SOURCE_ERROR.TIMEOUT";
    ErrorCode["SourceInvalidResponse"] = "ERR.DS_API.DB.SOURCE_ERROR.INVALID_RESPONSE";
    ErrorCode["SourceClosedPrematurely"] = "ERR.DS_API.DB.SOURCE_ERROR.CLOSED_PREMATURELY";
    ErrorCode["UsAccessDenied"] = "ERR.DS_API.US.ACCESS_DENIED";
    ErrorCode["WorkbookIsolationInterruptionDenied"] = "ERR.DS_API.US.WORKBOOK_ISOLATION_INTERRUPTION";
    ErrorCode["ReferencedEntryAccessDenied"] = "ERR.DS_API.REFERENCED_ENTRY_ACCESS_DENIED";
    ErrorCode["PlatformPermissionRequired"] = "ERR.DS_API.PLATFORM_PERMISSION_REQUIRED";
    ErrorCode["NeedReset"] = "NEED_RESET";
    ErrorCode["AuthNeedReset"] = "AUTH.NEED_RESET";
    ErrorCode["AuthUserNotExists"] = "AUTH.USER_NOT_EXISTS";
    ErrorCode["EntryIsLocked"] = "ERR.US.ENTRY_IS_LOCKED";
    ErrorCode["EntryAlreadyExists"] = "ERR.US.ENTRY_ALREADY_EXISTS";
    ErrorCode["UsUniqViolation"] = "ERR.US.DB.UNIQUE_VIOLATION";
    ErrorCode["ReadOnlyMode"] = "READ_ONLY_MODE_ENABLED";
    ErrorCode["InvalidTokenFormat"] = "ERR.CHARTS.INVALID_TOKEN_FORMAT";
    ErrorCode["TokenNotFound"] = "ERR.CHARTS.TOKEN_NOT_FOUND";
    ErrorCode["InvalidToken"] = "ERR.CHARTS.INVALID_TOKEN";
    ErrorCode["OutdatedDependencies"] = "ERR.CHARTS.OUTDATED_DEPENDENCIES";
    ErrorCode["EntryForbidden"] = "ERR.US.ENTRY_FORBIDDEN";
    ErrorCode["IncorrectEntry"] = "INCORRECT_ENTRY_ID_FOR_EMBED";
    ErrorCode["IncorrectDepsIds"] = "INCORRECT_DEPS_IDS_FOR_EMBED";
    ErrorCode["IncorrectEntryIdForEmbed"] = "ERR.DS_API.US.BAD_REQUEST.INCORRECT_ENTRY_ID_FOR_EMBED";
    ErrorCode["ChartEditorNotAvailable"] = "ERR.CHARTS.CHART_EDITOR_NOT_AVAILABLE";
    ErrorCode["InsufficientServicePlan"] = "ERR.CHARTS.INSUFFICIENT_SERVICE_PLAN";
    ErrorCode["WorkbookAlreadyExists"] = "WORKBOOK_ALREADY_EXISTS";
    ErrorCode["MetaManagerWorkbookAlreadyExists"] = "META_MANAGER.WORKBOOK_ALREADY_EXISTS";
    ErrorCode["CollectionAlreadyExists"] = "COLLECTION_ALREADY_EXISTS";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
exports.ErrorContentTypes = {
    NOT_FOUND: 'not-found',
    NOT_FOUND_BY_RESOLVE_TENANT: 'not-found-by-resolve-tenant',
    NOT_FOUND_CURRENT_CLOUD_FOLDER: 'not-found-current-cloud-folder',
    CLOUD_FOLDER_ACCESS_DENIED: 'cloud-folder-access-denied',
    NO_ACCESS: 'no-access',
    NO_ENTRY_ACCESS: 'no-entry-access',
    ERROR: 'error',
    CREDENTIALS: 'credentials',
    AUTH_FAILED: 'auth-failed',
    AUTH_DENIED: 'auth-denied',
    NEW_ORGANIZATION_USER: 'new-organization-user',
    NEW_LOCAL_FEDERATION_USER: 'new-local-federation-user',
    INACCESSIBLE_ON_MOBILE: 'inaccessible-on-mobile',
    NOT_AUTHENTICATED: 'not-authenticated',
    FORBIDDEN_BY_PLAN: 'forbidden-by-plan',
    FORBIDDEN_AUTH: 'forbidden-auth',
    NOT_AUTHENTICATED_GALLERY: 'not-authenticated-gallery',
    NOT_AUTHENTICATED_FESTIVAL: 'not-authenticated-festival',
};
