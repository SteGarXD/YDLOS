"use strict";
// All the types contains here (in constants file) because of possible circular dependencies
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTOR_VISIBILITY_MODE = exports.RAW_SQL_LEVEL = exports.CSVDelimiter = exports.CSVEncoding = exports.EnforceCollate = exports.DbConnectMethod = exports.ConnectorType = void 0;
// Constants section
var ConnectorType;
(function (ConnectorType) {
    /** Special value for connectors union. Used to render nested pages with their own connectors list */
    ConnectorType["__Meta__"] = "__meta__";
    ConnectorType["AppMetrica"] = "appmetrica_api";
    ConnectorType["Bigquery"] = "bigquery";
    ConnectorType["Bitrix"] = "bitrix";
    ConnectorType["Bitrix24"] = "bitrix24";
    ConnectorType["ChBillingAnalytics"] = "ch_billing_analytics";
    ConnectorType["ChFrozenBumpyRoads"] = "ch_frozen_bumpy_roads";
    ConnectorType["ChFrozenCovid"] = "ch_frozen_covid";
    ConnectorType["ChFrozenDemo"] = "ch_frozen_demo";
    ConnectorType["ChFrozenDtp"] = "ch_frozen_dtp";
    ConnectorType["ChFrozenGkh"] = "ch_frozen_gkh";
    ConnectorType["ChFrozenHoreca"] = "ch_frozen_horeca";
    ConnectorType["ChFrozenSamples"] = "ch_frozen_samples";
    ConnectorType["ChFrozenTransparency"] = "ch_frozen_transparency";
    ConnectorType["ChFrozenWeather"] = "ch_frozen_weather";
    ConnectorType["ChGeoFiltered"] = "ch_geo_filtered";
    ConnectorType["ChOverYt"] = "ch_over_yt";
    ConnectorType["ChOverYtUserAuth"] = "ch_over_yt_user_auth";
    ConnectorType["ChYaMusicPodcastStats"] = "ch_ya_music_podcast_stats";
    ConnectorType["Chydb"] = "chydb";
    ConnectorType["Clickhouse"] = "clickhouse";
    ConnectorType["Csv"] = "csv";
    ConnectorType["Equeo"] = "equeo";
    ConnectorType["File"] = "file";
    ConnectorType["Greenplum"] = "greenplum";
    ConnectorType["Gsheets"] = "gsheets";
    ConnectorType["GsheetsV2"] = "gsheets_v2";
    ConnectorType["KonturMarket"] = "kontur_market";
    ConnectorType["MetrikaApi"] = "metrika_api";
    ConnectorType["Moysklad"] = "moysklad";
    ConnectorType["Mssql"] = "mssql";
    ConnectorType["Mysql"] = "mysql";
    ConnectorType["Oracle"] = "oracle";
    ConnectorType["Postgres"] = "postgres";
    ConnectorType["Snowflake"] = "snowflake";
    ConnectorType["Trino"] = "trino";
    ConnectorType["UsageAnalyticsDetailed"] = "usage_analytics_detailed";
    ConnectorType["UsageAnalyticsLight"] = "usage_analytics_light";
    ConnectorType["UsageTrackingYT"] = "usage_tracking_ya_team";
    ConnectorType["Ydb"] = "ydb";
    ConnectorType["Yt"] = "yt";
    ConnectorType["Yq"] = "yq";
    ConnectorType["Promql"] = "promql";
    ConnectorType["Monitoring"] = "solomon";
    ConnectorType["MonitoringExt"] = "monitoring";
    ConnectorType["KpInterestIndex"] = "kp_interest_index";
    ConnectorType["SchoolbookJournal"] = "schoolbook_journal";
    ConnectorType["SmbHeatmaps"] = "smb_heatmaps";
    ConnectorType["Chyt"] = "chyt";
    ConnectorType["ChytNb"] = "chyt_nb";
    ConnectorType["ChytNb_v2"] = "chyt_nb_userauth";
    ConnectorType["Extractor1c"] = "extractor1c";
    ConnectorType["Yadocs"] = "yadocs";
    ConnectorType["MonitoringV2"] = "monitoring_v2";
    ConnectorType["ApiConnector"] = "json_api";
})(ConnectorType || (exports.ConnectorType = ConnectorType = {}));
var DbConnectMethod;
(function (DbConnectMethod) {
    DbConnectMethod["ServiceName"] = "service_name";
    DbConnectMethod["Sid"] = "sid";
})(DbConnectMethod || (exports.DbConnectMethod = DbConnectMethod = {}));
var EnforceCollate;
(function (EnforceCollate) {
    EnforceCollate["Auto"] = "auto";
    EnforceCollate["On"] = "on";
    EnforceCollate["Off"] = "off";
})(EnforceCollate || (exports.EnforceCollate = EnforceCollate = {}));
var CSVEncoding;
(function (CSVEncoding) {
    CSVEncoding["Utf8"] = "utf8";
    CSVEncoding["Windows1251"] = "windows1251";
    CSVEncoding["Utf8sig"] = "utf8sig";
})(CSVEncoding || (exports.CSVEncoding = CSVEncoding = {}));
var CSVDelimiter;
(function (CSVDelimiter) {
    CSVDelimiter["Comma"] = "comma";
    CSVDelimiter["Semicolon"] = "semicolon";
    CSVDelimiter["Tab"] = "tab";
})(CSVDelimiter || (exports.CSVDelimiter = CSVDelimiter = {}));
exports.RAW_SQL_LEVEL = {
    OFF: 'off',
    SUBSELECT: 'subselect',
    TEMPLATE: 'template',
    DASHSQL: 'dashsql',
};
exports.CONNECTOR_VISIBILITY_MODE = {
    FREE: 'free',
    HIDDEN: 'hidden',
    UNCREATABLE: 'uncreatable',
    BUSINESS: 'business',
};
