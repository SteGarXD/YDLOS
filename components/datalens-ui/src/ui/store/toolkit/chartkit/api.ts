import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';

import {registry} from '../../../registry';

import type {ChartKitHolidays} from './types';

const EMPTY_HOLIDAYS: ChartKitHolidays = {holiday: {}, weekend: {}};

export const chartkitApi = createApi({
    reducerPath: 'chartkitApi',
    baseQuery: fetchBaseQuery({baseUrl: '/'}),
    endpoints: (builder) => ({
        getChartkitHolidaysAsync: builder.query<ChartKitHolidays, void>({
            async queryFn() {
                try {
                    const {getChartkitHolidays} = registry.chart.functions.getAll();
                    const holidays = await getChartkitHolidays();
                    /** RTK Query: нельзя возвращать { data: undefined } — шаблон getChartkitHolidays — noop → undefined */
                    return {data: holidays ?? EMPTY_HOLIDAYS};
                } catch {
                    return {data: EMPTY_HOLIDAYS};
                }
            },
        }),
    }),
});

export const {useGetChartkitHolidaysAsyncQuery} = chartkitApi;
