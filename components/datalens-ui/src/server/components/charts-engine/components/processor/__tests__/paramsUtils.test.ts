import {splitDuplicateIntervalParamsForDashAliases} from '../paramsUtils';

const MockDate = require('mockdate');

MockDate.set('2020-02-14T22:34:55.359Z');

describe('splitDuplicateIntervalParamsForDashAliases', () => {
    it('splits duplicate __interval into two params (dash aliases, e.g. dt1 and dt2)', () => {
        const interval =
            '__interval_2020-01-10T00:00:00.000Z_2020-01-20T23:59:59.999Z';
        const params: Record<string, string[]> = {
            dt2: [interval],
            dt1: [interval],
        };
        const usedParams: Record<string, string | string[]> = {
            dt1: [interval],
            dt2: [interval],
        };

        splitDuplicateIntervalParamsForDashAliases(params, usedParams);

        expect(params.dt1).toEqual(['2020-01-10T00:00:00.000Z']);
        expect(params.dt2).toEqual(['2020-01-20T23:59:59.999Z']);
        expect(usedParams.dt1).toEqual(params.dt1);
        expect(usedParams.dt2).toEqual(params.dt2);
    });

    it('does nothing for a single interval param', () => {
        const interval =
            '__interval_2020-01-10T00:00:00.000Z_2020-01-20T23:59:59.999Z';
        const params: Record<string, string[]> = {only: [interval]};
        const usedParams: Record<string, string | string[]> = {only: [interval]};

        splitDuplicateIntervalParamsForDashAliases(params, usedParams);

        expect(params.only).toEqual([interval]);
    });

    it('does nothing when three params share the same interval without dta1/dta2 pair', () => {
        const interval =
            '__interval_2020-01-10T00:00:00.000Z_2020-01-20T23:59:59.999Z';
        const params: Record<string, string[]> = {
            a: [interval],
            b: [interval],
            c: [interval],
        };
        const usedParams: Record<string, string | string[]> = {...params};

        splitDuplicateIntervalParamsForDashAliases(params, usedParams);

        expect(params).toEqual({a: [interval], b: [interval], c: [interval]});
    });

    it('splits ds+dta1+dta2 triple alias: only dta1/dta2 get from/to', () => {
        const interval =
            '__interval_2020-01-10T00:00:00.000Z_2020-01-20T23:59:59.999Z';
        const params: Record<string, string[]> = {
            ds: [interval],
            dta1: [interval],
            dta2: [interval],
        };
        const usedParams: Record<string, string | string[]> = {...params};

        splitDuplicateIntervalParamsForDashAliases(params, usedParams);

        expect(params.ds).toEqual([interval]);
        expect(params.dta1).toEqual(['2020-01-10T00:00:00.000Z']);
        expect(params.dta2).toEqual(['2020-01-20T23:59:59.999Z']);
        expect(usedParams.dta1).toEqual(params.dta1);
        expect(usedParams.dta2).toEqual(params.dta2);
    });

    it('does nothing when two params share a non-interval value', () => {
        const params: Record<string, string[]> = {
            x: ['2020-01-01T00:00:00.000Z'],
            y: ['2020-01-01T00:00:00.000Z'],
        };
        const usedParams: Record<string, string | string[]> = {...params};

        splitDuplicateIntervalParamsForDashAliases(params, usedParams);

        expect(params.x).toEqual(['2020-01-01T00:00:00.000Z']);
        expect(params.y).toEqual(['2020-01-01T00:00:00.000Z']);
    });
});
