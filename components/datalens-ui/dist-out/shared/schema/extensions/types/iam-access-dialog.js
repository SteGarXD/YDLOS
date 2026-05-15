"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessBindingAction = exports.ClaimsSubjectType = exports.SubjectType = exports.AccessServiceResourceType = void 0;
var AccessServiceResourceType;
(function (AccessServiceResourceType) {
    AccessServiceResourceType["Collection"] = "datalens.collection";
    AccessServiceResourceType["Workbook"] = "datalens.workbook";
})(AccessServiceResourceType || (exports.AccessServiceResourceType = AccessServiceResourceType = {}));
var SubjectType;
(function (SubjectType) {
    SubjectType["System"] = "system";
    SubjectType["UserAccount"] = "userAccount";
    SubjectType["FederatedUser"] = "federatedUser";
    SubjectType["ServiceAccount"] = "serviceAccount";
    SubjectType["Group"] = "group";
    SubjectType["Invitee"] = "invitee";
})(SubjectType || (exports.SubjectType = SubjectType = {}));
var ClaimsSubjectType;
(function (ClaimsSubjectType) {
    ClaimsSubjectType["UserAccount"] = "USER_ACCOUNT";
    ClaimsSubjectType["Group"] = "GROUP";
    ClaimsSubjectType["Invitee"] = "INVITEE";
    ClaimsSubjectType["ServiceAccount"] = "SERVICE_ACCOUNT";
    ClaimsSubjectType["SystemGroup"] = "_system";
})(ClaimsSubjectType || (exports.ClaimsSubjectType = ClaimsSubjectType = {}));
var AccessBindingAction;
(function (AccessBindingAction) {
    AccessBindingAction["Add"] = "ADD";
    AccessBindingAction["Remove"] = "REMOVE";
})(AccessBindingAction || (exports.AccessBindingAction = AccessBindingAction = {}));
