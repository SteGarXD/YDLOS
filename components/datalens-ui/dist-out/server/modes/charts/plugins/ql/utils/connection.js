"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTOR_TYPE_TO_QL_CONNECTION_TYPE_MAP = void 0;
exports.getConnectorToQlConnectionTypeMap = getConnectorToQlConnectionTypeMap;
exports.convertConnectionType = convertConnectionType;
const shared_1 = require("../../../../../../shared");
exports.CONNECTOR_TYPE_TO_QL_CONNECTION_TYPE_MAP = {
    [shared_1.ConnectorType.Postgres]: shared_1.DATALENS_QL_CONNECTION_TYPES.POSTGRESQL,
    [shared_1.ConnectorType.Greenplum]: shared_1.DATALENS_QL_CONNECTION_TYPES.POSTGRESQL,
    [shared_1.ConnectorType.Clickhouse]: shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE,
    [shared_1.ConnectorType.ChOverYt]: shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE,
    [shared_1.ConnectorType.ChOverYtUserAuth]: shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE,
    [shared_1.ConnectorType.Chydb]: shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE,
    [shared_1.ConnectorType.ChFrozenDemo]: shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE,
    [shared_1.ConnectorType.Chyt]: shared_1.DATALENS_QL_CONNECTION_TYPES.CLICKHOUSE,
    [shared_1.ConnectorType.Mssql]: shared_1.DATALENS_QL_CONNECTION_TYPES.MSSQL,
    [shared_1.ConnectorType.Mysql]: shared_1.DATALENS_QL_CONNECTION_TYPES.MYSQL,
    [shared_1.ConnectorType.Oracle]: shared_1.DATALENS_QL_CONNECTION_TYPES.ORACLE,
    [shared_1.ConnectorType.Trino]: shared_1.DATALENS_QL_CONNECTION_TYPES.TRINO,
    [shared_1.ConnectorType.Ydb]: shared_1.DATALENS_QL_CONNECTION_TYPES.YQL,
    [shared_1.ConnectorType.Yq]: shared_1.DATALENS_QL_CONNECTION_TYPES.YQL,
    [shared_1.ConnectorType.Promql]: shared_1.DATALENS_QL_CONNECTION_TYPES.PROMQL,
    [shared_1.ConnectorType.Monitoring]: shared_1.DATALENS_QL_CONNECTION_TYPES.MONITORING,
    [shared_1.ConnectorType.MonitoringExt]: shared_1.DATALENS_QL_CONNECTION_TYPES.MONITORING,
};
function getConnectorToQlConnectionTypeMap() {
    return exports.CONNECTOR_TYPE_TO_QL_CONNECTION_TYPE_MAP;
}
function convertConnectionType(connectionTypeMap, connectionType) {
    const mappedConnectionType = connectionTypeMap[connectionType];
    if (!mappedConnectionType) {
        throw new Error('Unsupported connection type');
    }
    return mappedConnectionType;
}
