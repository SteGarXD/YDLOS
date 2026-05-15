export const DATASET_ID_KEY_PLACEHOLDER = '{datasetIdKey}';
export const LAYER_ID_KEY_PLACEHOLDER = '_{layerIdKey}';

export const DATASET_ID_LAYER_ID_SEPARATOR = '_result';

export const DATASET_ID_KEY_TEMPLATE = '{datasetId}';
export const LAYER_ID_KEY_TEMPLATE = '{layerId}';

export const DATASET_ID_LAYER_ID_KEY_TEMPLATE = '{datasetIdKey}_result_{layerIdKey}';

/** YDL OS: шапка сверху и весь блок ИТОГО внизу — утверждённый цвет. */
export const TABLE_HEADER_FOOTER_BG = '#d3d3d3';

/** YDL OS: чёрные границы у шапки и блока ИТОГО (через cell.css, не тема). */
export const TABLE_HEADER_FOOTER_BORDER_COLOR = '#000000';

/** YDL OS: границы в теле сводной — контраст на белом/полосах (совпадает с --dl-table-body-grid-color в Table.scss). */
export const TABLE_BODY_BORDER_COLOR = '#888888';

/** YDL OS: серый фон и чёрные границы для шапки/футера; выравнивание задаётся по месту (центр для подписей, вправо для чисел). */
export const TABLE_TOTALS_STYLES: Record<string, string | number> = {
    backgroundColor: TABLE_HEADER_FOOTER_BG,
    fontWeight: 400,
    color: '#000000',
    borderColor: TABLE_HEADER_FOOTER_BORDER_COLOR,
};

/** YDL OS: столбцы тела таблицы — утверждённая палитра (только тело). */
/** 1) Рейс (в теле шрифт чёрный) */
export const TABLE_BODY_COLUMN_REYS_BG = '#4880b3';
export const TABLE_BODY_COLUMN_REYS_COLOR = '#000000';
/** 2) Напр-е */
export const TABLE_BODY_COLUMN_NAPR_BG = '#b2c3e1';
/** 3) Скрытый measure names */
export const TABLE_BODY_COLUMN_MEASURE_NAMES_BG = '#cbe0ff';
/** 4) Итоговый столбец справа (тело; не нижняя строка) */
export const TABLE_BODY_COLUMN_ITOGO_RIGHT_BG = '#cbe0ff';

/** @deprecated используйте TABLE_BODY_COLUMN_* по колонке */
export const TABLE_BODY_COLUMN_BG = '#ffffff';

/** YDL OS: цвет Млн. р в теле сводной (значения) — пресет «Бирюзовый». */
export const TABLE_MEASURE_MLN_TURQUOISE_BG = '#afeeee';

/** YDL OS: ЗПК % — пороги (низкий / средний / высокий), используются в градиенте и светофоре. */
export const TABLE_ZPK_LOW_BG = '#f08080';
export const TABLE_ZPK_MID_BG = '#f0e68c';
export const TABLE_ZPK_HIGH_BG = '#98fb98';

/** YDL OS: пустые ячейки в строках ЗПК % и Млн. р — слегка заметный светло-серый фон (тело таблицы). */
export const TABLE_EMPTY_MEASURE_CELL_BG = '#f5f5f5';
