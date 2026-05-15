import {TABLE_HEADER_FOOTER_BORDER_COLOR} from '../../../../constants/misc';
import prepareFlatTable from '../index';

const {
    flatTableFormattingIntPrecisionArgs,
    flatTableFormattingFloatPrecisionArgs,
    flatTablePrepareWithTotalsArgs,
} = require('./mocks/flat-table.mock');

describe('prepareFlatTable', () => {
    describe('common', () => {
        test('should not use precision for integer cell', () => {
            const result = prepareFlatTable(flatTableFormattingIntPrecisionArgs) as any;
            const precision = result.head[0]?.formatter?.precision;
            expect(precision).toEqual(undefined);
        });

        test('should use provided precision for float cell', () => {
            const result = prepareFlatTable(flatTableFormattingFloatPrecisionArgs) as any;
            const precision = result.head[0]?.formatter?.precision;
            expect(precision).toEqual(1);
        });

        test('should ignore totals when empty string', () => {
            const result = prepareFlatTable(flatTablePrepareWithTotalsArgs);
            const totals = result.footer;

            // YDL OS: стили итогов (camelCase в cell.css, как в TABLE_TOTALS_STYLES / getFooter)
            const footerCellCss = {
                backgroundColor: '#d3d3d3',
                color: '#000000',
                fontWeight: 400,
                borderColor: TABLE_HEADER_FOOTER_BORDER_COLOR,
            };
            const expectedTotals = [
                {
                    cells: [
                        {
                            value: 'Total',
                            css: footerCellCss,
                            type: 'text',
                        },
                        {value: '', css: footerCellCss},
                        {value: '', css: footerCellCss},
                        {value: 4500, css: footerCellCss},
                        {value: 4017.8571428571427, css: footerCellCss},
                        {value: '', css: footerCellCss},
                        {value: '', css: footerCellCss},
                    ],
                },
            ];

            expect(totals).toEqual(expectedTotals);
        });
    });
});
