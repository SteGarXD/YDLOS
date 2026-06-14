// org-workbooks MSSQL: parameter value_constraint + non-empty date defaults (server-safe module, no shared import).

export const REPKA_STRING_TEMPLATE_REGEX_CONSTRAINT = {
    type: 'regex' as const,
    pattern: '.*',
};

export const REPKA_DATE_PARAMETER_GUIDS = new Set([
    'ds',
    'dt1',
    'dt2',
    'dta1',
    'dta2',
    'cf_d1',
    'cf_d2',
]);

/** Пустой default в датасете ломает preview TVF (dta1/dta2 обязательны в subsql). */
export const REPKA_DATE_DEFAULT_FALLBACK = '__interval___relative_-1M___relative_+0d';

export type org-workbooksDatasetParameterField = {
    calc_mode?: string;
    cast?: string;
    data_type?: string;
    guid?: string;
    title?: string;
    template_enabled?: boolean | null;
    value_constraint?: {type?: string; pattern?: string} | null;
    default_value?: unknown;
};

function defaultValueIsEmpty(defaultValue: unknown): boolean {
    if (defaultValue == null) {
        return true;
    }
    if (typeof defaultValue === 'string') {
        return !defaultValue.trim();
    }
    if (typeof defaultValue === 'object' && defaultValue !== null && 'value' in defaultValue) {
        const v = (defaultValue as {value?: unknown}).value;
        return v == null || String(v).trim() === '';
    }
    return false;
}

function isStringParameter(field: org-workbooksDatasetParameterField): boolean {
    return field.cast === 'string' || field.data_type === 'string';
}

function normalizeDefaultValue(
    field: org-workbooksDatasetParameterField,
    fallback: string = REPKA_DATE_DEFAULT_FALLBACK,
): unknown {
    const guid = (field.guid || field.title || '').toLowerCase();
    if (!REPKA_DATE_PARAMETER_GUIDS.has(guid)) {
        return field.default_value;
    }
    if (!defaultValueIsEmpty(field.default_value)) {
        return field.default_value;
    }
    if (!fallback) {
        return field.default_value;
    }
    return {type: 'string', value: fallback};
}

function needsorg-workbooksStringConstraint(
    field: org-workbooksDatasetParameterField,
    datasetTemplateEnabled?: boolean,
): boolean {
    if (!isStringParameter(field) || field.calc_mode !== 'parameter') {
        return false;
    }
    const tpl = Boolean(field.template_enabled ?? datasetTemplateEnabled);
    if (!tpl) {
        return false;
    }
    const vc = field.value_constraint;
    return !vc || vc.type === 'null';
}

export function ensureorg-workbooksDatasetParameterField<T extends org-workbooksDatasetParameterField>(
    field: T,
    datasetTemplateEnabled?: boolean,
): T {
    const next = {...field} as T;

    if (datasetTemplateEnabled && next.calc_mode === 'parameter' && next.template_enabled == null) {
        next.template_enabled = true;
    }

    if (needsorg-workbooksStringConstraint(next, datasetTemplateEnabled)) {
        next.value_constraint = {...REPKA_STRING_TEMPLATE_REGEX_CONSTRAINT};
    }

    next.default_value = normalizeDefaultValue(next);

    return next;
}
