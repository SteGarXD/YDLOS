"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE_EMPTY_MEASURE_CELL_BG = exports.TABLE_ZPK_HIGH_BG = exports.TABLE_ZPK_MID_BG = exports.TABLE_ZPK_LOW_BG = exports.TABLE_MEASURE_MLN_TURQUOISE_BG = exports.TABLE_BODY_COLUMN_BG = exports.TABLE_BODY_COLUMN_ITOGO_RIGHT_BG = exports.TABLE_BODY_COLUMN_MEASURE_NAMES_BG = exports.TABLE_BODY_COLUMN_NAPR_BG = exports.TABLE_BODY_COLUMN_REYS_COLOR = exports.TABLE_BODY_COLUMN_REYS_BG = exports.TABLE_TOTALS_STYLES = exports.TABLE_HEADER_FOOTER_BG = exports.DATASET_ID_LAYER_ID_KEY_TEMPLATE = exports.LAYER_ID_KEY_TEMPLATE = exports.DATASET_ID_KEY_TEMPLATE = exports.DATASET_ID_LAYER_ID_SEPARATOR = exports.LAYER_ID_KEY_PLACEHOLDER = exports.DATASET_ID_KEY_PLACEHOLDER = void 0;
exports.DATASET_ID_KEY_PLACEHOLDER = '{datasetIdKey}';
exports.LAYER_ID_KEY_PLACEHOLDER = '_{layerIdKey}';
exports.DATASET_ID_LAYER_ID_SEPARATOR = '_result';
exports.DATASET_ID_KEY_TEMPLATE = '{datasetId}';
exports.LAYER_ID_KEY_TEMPLATE = '{layerId}';
exports.DATASET_ID_LAYER_ID_KEY_TEMPLATE = '{datasetIdKey}_result_{layerIdKey}';
/** YDL OS: шапка сверху и весь блок ИТОГО внизу — утверждённый цвет. */
exports.TABLE_HEADER_FOOTER_BG = '#d3d3d3';
/** YDL OS: тот же оттенок для стиля ячеек итого (без жирного). */
exports.TABLE_TOTALS_STYLES = {
    'background-color': exports.TABLE_HEADER_FOOTER_BG,
    'font-weight': 400,
    color: '#000000',
    'text-align': 'center',
};
/** YDL OS: столбцы тела таблицы — утверждённая палитра (только тело). */
/** 1) Рейс (в теле шрифт чёрный) */
exports.TABLE_BODY_COLUMN_REYS_BG = '#4880b3';
exports.TABLE_BODY_COLUMN_REYS_COLOR = '#000000';
/** 2) Напр-е */
exports.TABLE_BODY_COLUMN_NAPR_BG = '#b2c3e1';
/** 3) Скрытый measure names */
exports.TABLE_BODY_COLUMN_MEASURE_NAMES_BG = '#cbe0ff';
/** 4) Итоговый столбец справа (тело; не нижняя строка) */
exports.TABLE_BODY_COLUMN_ITOGO_RIGHT_BG = '#cbe0ff';
/** @deprecated используйте TABLE_BODY_COLUMN_* по колонке */
exports.TABLE_BODY_COLUMN_BG = '#ffffff';
/** YDL OS: цвет Млн. р в теле сводной (значения) — пресет «Бирюзовый». */
exports.TABLE_MEASURE_MLN_TURQUOISE_BG = '#afeeee';
/** YDL OS: ЗПК % — пороги (низкий / средний / высокий), используются в градиенте и светофоре. */
exports.TABLE_ZPK_LOW_BG = '#f08080';
exports.TABLE_ZPK_MID_BG = '#f0e68c';
exports.TABLE_ZPK_HIGH_BG = '#98fb98';
/** YDL OS: пустые ячейки в строках ЗПК % и Млн. р — слегка заметный светло-серый фон (тело таблицы). */
exports.TABLE_EMPTY_MEASURE_CELL_BG = '#f5f5f5';
