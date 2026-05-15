import React from 'react';

import {Datepicker, type DatepickerProps} from '../Datepicker';

export type DatepickerControlProps = DatepickerProps & {
    widgetId: string;
    /** YDL OS: при диапазоне — какие точности доступны (день, неделя, месяц, квартал, год). По умолчанию все. */
    dateGranularityEnabled?: Record<'day' | 'week' | 'month' | 'quarter' | 'year', boolean>;
};

export const DatepickerControl = ({
    widgetId: _id,
    dateGranularityEnabled,
    ...otherProps
}: DatepickerControlProps) => {
    const enabledTabs =
        dateGranularityEnabled &&
        (Object.entries(dateGranularityEnabled)
            .filter(([, v]) => v)
            .map(([k]) => k) as Array<'day' | 'week' | 'month' | 'quarter' | 'year'>);
    return (
        <Datepicker {...otherProps} enabledTabs={enabledTabs?.length ? enabledTabs : undefined} />
    );
};
