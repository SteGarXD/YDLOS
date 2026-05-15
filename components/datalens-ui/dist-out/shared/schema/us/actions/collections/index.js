"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionsActions = void 0;
const create_collection_1 = require("./create-collection");
const delete_collection_1 = require("./delete-collection");
const delete_collections_1 = require("./delete-collections");
const get_collection_1 = require("./get-collection");
const get_collection_breadcrumbs_1 = require("./get-collection-breadcrumbs");
const get_root_collection_permissions_1 = require("./get-root-collection-permissions");
const get_structure_items_1 = require("./get-structure-items");
const move_collection_1 = require("./move-collection");
const move_collections_1 = require("./move-collections");
const update_collection_1 = require("./update-collection");
exports.collectionsActions = {
    getRootCollectionPermissions: get_root_collection_permissions_1.getRootCollectionPermissions,
    createCollection: create_collection_1.createCollection,
    getCollection: get_collection_1.getCollection,
    getStructureItems: get_structure_items_1.getStructureItems,
    getCollectionBreadcrumbs: get_collection_breadcrumbs_1.getCollectionBreadcrumbs,
    deleteCollection: delete_collection_1.deleteCollection,
    updateCollection: update_collection_1.updateCollection,
    moveCollection: move_collection_1.moveCollection,
    moveCollections: move_collections_1.moveCollections,
    deleteCollections: delete_collections_1.deleteCollections,
};
