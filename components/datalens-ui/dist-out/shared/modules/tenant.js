"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTenantIdWithOrgId = isTenantIdWithOrgId;
exports.makeTenantIdFromOrgId = makeTenantIdFromOrgId;
exports.getOrgIdFromTenantId = getOrgIdFromTenantId;
const ORG_TENANT_PREFIX = 'org_';
function isTenantIdWithOrgId(tenantId = '') {
    return tenantId.startsWith(ORG_TENANT_PREFIX);
}
function makeTenantIdFromOrgId(orgId) {
    return ORG_TENANT_PREFIX + orgId;
}
function getOrgIdFromTenantId(tenantId) {
    return tenantId.slice(ORG_TENANT_PREFIX.length);
}
