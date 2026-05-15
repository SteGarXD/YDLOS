"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareNotifications = void 0;
const shared_1 = require("../../../../../../../../shared");
const prepareNotifications = (notifications, visualization) => {
    const fieldDict = visualization.placeholders.reduce((acc, placeholder) => {
        placeholder.items.forEach((placeholderItem) => {
            acc[placeholderItem.guid] = placeholderItem;
            acc[placeholderItem.title] = placeholderItem;
        });
        return acc;
    }, {});
    return notifications.map((notification) => {
        if (notification.locator.startsWith(shared_1.ChartsInsightLocator.UsingDeprecatedDatetimeFields)) {
            return prepareUsingDeprecatedDatetimeFieldsNotification(notification, fieldDict);
        }
        return notification;
    });
};
exports.prepareNotifications = prepareNotifications;
const getTitleWithGuidRegexp = () => /title-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const prepareUsingDeprecatedDatetimeFieldsNotification = (notification, fieldDict) => {
    const match = notification.message.match(getTitleWithGuidRegexp());
    if (!match) {
        return notification;
    }
    const guid = match[0].replace('title-', '');
    const field = fieldDict[guid];
    if (!field) {
        return notification;
    }
    return {
        ...notification,
        message: notification.message.replace(getTitleWithGuidRegexp(), (0, shared_1.getFakeTitleOrTitle)(field)),
    };
};
