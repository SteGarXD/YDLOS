export const VisualizationCustomizationProfile = {
    Default: 'default',
    MainForm: 'main-form',
    DirectionByMonth: 'direction-by-month',
    FlightByClass: 'flight-by-class',
    FlightSegmentsLoad: 'flight-segments-load',
    FlightLoadByClass: 'flight-load-by-class',
    FlightSalesDynamicsComparison: 'flight-sales-dynamics-comparison',
    PreSalePeriod: 'pre-sale-period',
    GroupBookings: 'group-bookings',
    PreSaleClassDistribution: 'pre-sale-class-distribution',
} as const;

export type VisualizationCustomizationProfileId =
    (typeof VisualizationCustomizationProfile)[keyof typeof VisualizationCustomizationProfile];

export type VisualizationCustomizationKind = 'pivot-table' | 'flat-table' | 'pie' | 'line';

export type VisualizationCustomizationProfileBehaviorFlags = {
    enableClassicMainFormPivotPreset: boolean;
    enableFlightLoadByClassPivotPreset: boolean;
    enablePreSalePeriodPivotPreset: boolean;
    enableFlightSegmentsLoadFlatTreePreset: boolean;
    enableFlightLoadByClassFlatTreePreset: boolean;
    isolatePivotFieldBackgrounds: boolean;
    enablePieDistributionPreset: boolean;
    enableFlightLoadByClassTableRenderer: boolean;
    enableFlightDaysLinePreset: boolean;
    enableFlightSalesDynamicsComparisonLinePreset: boolean;
    enablePreSalePeriodFlatTreePreset: boolean;
    enableGroupBookingsTablePreset: boolean;
};

export type VisualizationCustomizationProfileDescriptor = {
    id: VisualizationCustomizationProfileId;
    title: string;
    dashboardNumber?: number;
    dashboardName?: string;
    visualizationKinds: VisualizationCustomizationKind[];
    semanticPurpose: string;
    aliases?: string[];
    behavior: Partial<VisualizationCustomizationProfileBehaviorFlags>;
};

const DEFAULT_BEHAVIOR_FLAGS: VisualizationCustomizationProfileBehaviorFlags = {
    enableClassicMainFormPivotPreset: false,
    enableFlightLoadByClassPivotPreset: false,
    enablePreSalePeriodPivotPreset: false,
    enableFlightSegmentsLoadFlatTreePreset: false,
    enableFlightLoadByClassFlatTreePreset: false,
    isolatePivotFieldBackgrounds: false,
    enablePieDistributionPreset: false,
    enableFlightLoadByClassTableRenderer: false,
    enableFlightDaysLinePreset: false,
    enableFlightSalesDynamicsComparisonLinePreset: false,
    enablePreSalePeriodFlatTreePreset: false,
    enableGroupBookingsTablePreset: false,
};

export const VISUALIZATION_CUSTOMIZATION_PROFILES: VisualizationCustomizationProfileDescriptor[] = [
    {
        id: VisualizationCustomizationProfile.Default,
        title: 'По умолчанию',
        visualizationKinds: ['pivot-table', 'flat-table', 'pie'],
        semanticPurpose: 'Базовое поведение DataLens без форковых пресетов.',
        behavior: {},
    },
    {
        id: VisualizationCustomizationProfile.MainForm,
        title: '1. Главная форма',
        dashboardNumber: 1,
        dashboardName: 'Главная форма',
        visualizationKinds: ['pivot-table'],
        semanticPurpose: 'Эталонная сводная таблица загрузки рейсов по дням месяца.',
        aliases: ['главная форма', 'main form'],
        behavior: {
            enableClassicMainFormPivotPreset: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.DirectionByMonth,
        title: '2. Направление за месяц',
        dashboardNumber: 2,
        dashboardName: 'Направление за месяц',
        visualizationKinds: ['pivot-table', 'flat-table', 'line'],
        semanticPurpose:
            'Отчет по направлению за месяц; линейный график использует профиль линий «дней до вылета», как на дашборде «Рейс по классам».',
        aliases: ['направление за месяц', 'direction by month'],
        behavior: {
            enableFlightDaysLinePreset: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.FlightByClass,
        title: '3. Рейс по классам',
        dashboardNumber: 3,
        dashboardName: 'Рейс по классам',
        visualizationKinds: ['pivot-table', 'flat-table', 'line'],
        semanticPurpose: 'Отчет по рейсу и классам бронирования с профильным line-пресетом дней до вылета.',
        aliases: ['рейс по классам', 'flight by class'],
        behavior: {
            enableFlightDaysLinePreset: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.FlightSegmentsLoad,
        title: '4. Загрузка сегментов рейсов',
        dashboardNumber: 4,
        dashboardName: 'Загрузка сегментов рейсов',
        visualizationKinds: ['flat-table'],
        semanticPurpose: 'Плоская таблица с деревом рейс-сегменты.',
        aliases: ['загрузка сегментов рейсов', 'flight segments load'],
        behavior: {
            enableFlightSegmentsLoadFlatTreePreset: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.FlightLoadByClass,
        title: '5. Загрузка рейса по классам',
        dashboardNumber: 5,
        dashboardName: 'Загрузка рейса по классам',
        visualizationKinds: ['pivot-table', 'flat-table'],
        semanticPurpose: 'Отчет по загрузке рейса с раскладкой по классам.',
        aliases: ['загрузка рейса по классам', 'flight load by class'],
        behavior: {
            enableFlightLoadByClassPivotPreset: true,
            enableFlightLoadByClassFlatTreePreset: true,
            enableFlightLoadByClassTableRenderer: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.FlightSalesDynamicsComparison,
        title: '6. Сравнение динамики продаж рейсов',
        dashboardNumber: 6,
        dashboardName: 'Сравнение динамики продаж рейсов',
        visualizationKinds: ['pivot-table', 'flat-table', 'line'],
        semanticPurpose: 'Сравнение динамики продаж с профильными цветами, порогами и осью дней до вылета.',
        aliases: ['сравнение динамики продаж рейсов', 'flight sales dynamics comparison'],
        behavior: {
            enableFlightDaysLinePreset: true,
            enableFlightSalesDynamicsComparisonLinePreset: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.PreSalePeriod,
        title: '7. Предварительная продажа на период',
        dashboardNumber: 7,
        dashboardName: 'Предварительная продажа на период',
        visualizationKinds: ['pivot-table', 'flat-table'],
        semanticPurpose: 'Отчет предварительных продаж с изоляцией табличных стилей от полевых заливок.',
        aliases: ['предварительная продажа на период', 'pre-sale for period', 'pre sale for period'],
        behavior: {
            enablePreSalePeriodPivotPreset: true,
            isolatePivotFieldBackgrounds: true,
            enablePreSalePeriodFlatTreePreset: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.PreSaleClassDistribution,
        title: '7. Круговая: распределение классов бронирования',
        dashboardNumber: 7,
        dashboardName: 'Распределение классов бронирования',
        visualizationKinds: ['pie'],
        semanticPurpose: 'Круговая диаграмма распределения классов бронирования.',
        aliases: [
            'распределение по классам бронирования',
            'class booking distribution',
            'booking class',
            'class distribution',
        ],
        behavior: {
            enablePieDistributionPreset: true,
        },
    },
    {
        id: VisualizationCustomizationProfile.GroupBookings,
        title: '8. Групповые бронирования',
        dashboardNumber: 8,
        dashboardName: 'Групповые бронирования',
        visualizationKinds: ['pivot-table', 'flat-table', 'pie'],
        semanticPurpose: 'Отчет групповых бронирований; pie использует профиль распределения.',
        aliases: ['групповые бронирования', 'group bookings'],
        behavior: {
            enablePieDistributionPreset: true,
            enableGroupBookingsTablePreset: true,
        },
    },
];

export const DASHBOARD_VISUALIZATION_PROFILE_OPTIONS = VISUALIZATION_CUSTOMIZATION_PROFILES.map(
    ({id, title}) => ({
        value: id,
        title,
    }),
);

const PROFILE_BY_ID = VISUALIZATION_CUSTOMIZATION_PROFILES.reduce(
    (acc, profile) => {
        acc[profile.id] = profile;
        return acc;
    },
    {} as Record<VisualizationCustomizationProfileId, VisualizationCustomizationProfileDescriptor>,
);

function normalizeText(value: unknown): string {
    return String(value ?? '')
        .toLowerCase()
        .trim()
        .replace(/ё/g, 'е');
}

function compactText(value: unknown): string {
    return normalizeText(value).replace(/\s+/g, '');
}

function headerHintsContain(headerHints: Set<string>, exactName: string): boolean {
    const normalizedName = normalizeText(exactName);
    const compactName = compactText(exactName);

    return Array.from(headerHints).some((header) => {
        const normalizedHeader = normalizeText(header);
        return normalizedHeader === normalizedName || compactText(normalizedHeader) === compactName;
    });
}

function headerHintsInclude(headerHints: Set<string>, text: string): boolean {
    const normalizedText = normalizeText(text);

    return Array.from(headerHints).some((header) => normalizeText(header).includes(normalizedText));
}

/** Колонка подкласса бронирования (буквы H,K,…): не путать с cclass (C/Y). */
function hasPreSaleBookingSubclassColumn(headerHints: Set<string>): boolean {
    return Array.from(headerHints).some((header) => {
        const h = normalizeText(header);
        const compact = compactText(header);
        if (h === 'cclass' || compact === 'cclass') {
            return false;
        }
        if (h === 'class' || h === 'класс') {
            return true;
        }
        if (h.includes('класс') && !h.includes('группа')) {
            return true;
        }
        return false;
    });
}

function compactHintIncludes(headerHints: Set<string>, fragment: string): boolean {
    const needle = compactText(fragment);
    if (!needle) {
        return false;
    }
    return Array.from(headerHints).some((header) => compactText(header).includes(needle));
}

function hasPreSalePeriodHeaderSignature(headerHints: Set<string>): boolean {
    const hasValueColumn =
        headerHintsContain(headerHints, 'column1') ||
        compactHintIncludes(headerHints, 'column1') ||
        headerHintsContain(headerHints, 'measure values') ||
        headerHintsContain(headerHints, 'measurevalues') ||
        headerHintsContain(headerHints, 'значение') ||
        headerHintsContain(headerHints, 'значения') ||
        headerHintsInclude(headerHints, 'значен') ||
        headerHintsContain(headerHints, 'показатель') ||
        headerHintsInclude(headerHints, 'показател') ||
        headerHintsContain(headerHints, 'метрика') ||
        headerHintsInclude(headerHints, 'метрик');

    const hasPortFrom =
        headerHintsContain(headerHints, 'Порт1') ||
        headerHintsContain(headerHints, 'порт 1') ||
        compactHintIncludes(headerHints, 'порт1') ||
        headerHintsContain(headerHints, 'from') ||
        headerHintsContain(headerHints, 'из');
    const hasPortTo =
        headerHintsContain(headerHints, 'Порт2') ||
        headerHintsContain(headerHints, 'порт 2') ||
        compactHintIncludes(headerHints, 'порт2') ||
        headerHintsContain(headerHints, 'to') ||
        headerHintsContain(headerHints, 'в');
    /** Колонка группы класса (C/Y): cclass или явное название */
    const hasCClassLike =
        headerHintsContain(headerHints, 'cclass') ||
        headerHintsInclude(headerHints, 'группа класса');
    /** Подкласс: «class»/«класс» или подпись вида «Класс бронирования» (не cclass) */
    const hasSubclassLike = hasPreSaleBookingSubclassColumn(headerHints);
    const hasClassPair = hasCClassLike && hasSubclassLike;

    return (
        headerHintsInclude(headerHints, 'дата') &&
        headerHintsInclude(headerHints, 'рейс') &&
        hasPortFrom &&
        hasPortTo &&
        hasClassPair &&
        hasValueColumn
    );
}

function hasGroupBookingsHeaderSignature(headerHints: Set<string>): boolean {
    return (
        headerHintsInclude(headerHints, 'дата') &&
        headerHintsInclude(headerHints, 'рейс') &&
        headerHintsContain(headerHints, 'Из') &&
        headerHintsContain(headerHints, 'В') &&
        headerHintsContain(headerHints, 'PNR') &&
        headerHintsInclude(headerHints, 'агентство') &&
        headerHintsContain(headerHints, 'Класс') &&
        headerHintsContain(headerHints, 'Группа') &&
        headerHintsInclude(headerHints, 'пассажиров с билет') &&
        headerHintsInclude(headerHints, 'всего пассажир')
    );
}

function hasPreSaleClassDistributionSignature(headerHints: Set<string>, allTitleHints: string): boolean {
    const hasBookingClassTitle =
        (allTitleHints.includes('класс') && allTitleHints.includes('брони')) ||
        allTitleHints.includes('booking class') ||
        allTitleHints.includes('class distribution');

    const hasClassHints =
        (headerHintsContain(headerHints, 'cclass') && headerHintsContain(headerHints, 'class')) ||
        (headerHintsContain(headerHints, 'класс') &&
            (headerHintsContain(headerHints, 'групп') || headerHintsContain(headerHints, 'брони')));

    return hasBookingClassTitle || hasClassHints;
}

export function getVisualizationCustomizationProfile(
    id: unknown,
): VisualizationCustomizationProfileDescriptor {
    const normalizedId = normalizeText(id) as VisualizationCustomizationProfileId;
    return PROFILE_BY_ID[normalizedId] || PROFILE_BY_ID[VisualizationCustomizationProfile.Default];
}

export function getVisualizationCustomizationBehaviorFlags(
    id: unknown,
): VisualizationCustomizationProfileBehaviorFlags {
    const profile = getVisualizationCustomizationProfile(id);
    return {
        ...DEFAULT_BEHAVIOR_FLAGS,
        ...profile.behavior,
    };
}

export function hasExplicitVisualizationCustomizationProfile(
    extraSettings?: Record<string, unknown>,
): boolean {
    const rawProfile = normalizeText(extraSettings?.customizationProfileId);
    return Boolean(rawProfile);
}

export function resolveVisualizationCustomizationProfile(args: {
    extraSettings?: Record<string, unknown>;
    titleHints?: Array<string | undefined>;
    headerFieldHints?: string[];
}): VisualizationCustomizationProfileId {
    const customization = (args.extraSettings?.customization || {}) as Record<string, unknown>;
    const isolateByWidget = Boolean(customization?.isolateByWidget);
    const explicitProfile = normalizeText(args.extraSettings?.customizationProfileId);
    const explicitMatch = getVisualizationCustomizationProfile(explicitProfile);
    if (explicitProfile && explicitMatch.id !== VisualizationCustomizationProfile.Default) {
        return explicitMatch.id;
    }
    if (explicitProfile === VisualizationCustomizationProfile.Default) {
        return VisualizationCustomizationProfile.Default;
    }
    const titleText = normalizeText(args.extraSettings?.title);
    const allTitleHints = [titleText, ...(args.titleHints ?? [])].map(normalizeText).join(' ');

    if (!isolateByWidget) {
        for (const profile of VISUALIZATION_CUSTOMIZATION_PROFILES) {
            if (profile.id === VisualizationCustomizationProfile.Default) {
                continue;
            }
            if (profile.aliases?.some((alias) => allTitleHints.includes(normalizeText(alias)))) {
                if (
                    profile.id === VisualizationCustomizationProfile.FlightByClass &&
                    allTitleHints.includes('загрузка рейса по классам')
                ) {
                    continue;
                }
                return profile.id;
            }
        }
    }
    const headerHints = new Set((args.headerFieldHints ?? []).map(normalizeText));
    if (hasPreSalePeriodHeaderSignature(headerHints)) {
        return VisualizationCustomizationProfile.PreSalePeriod;
    }
    if (hasGroupBookingsHeaderSignature(headerHints)) {
        return VisualizationCustomizationProfile.GroupBookings;
    }
    if (hasPreSaleClassDistributionSignature(headerHints, allTitleHints)) {
        return VisualizationCustomizationProfile.PreSaleClassDistribution;
    }

    return VisualizationCustomizationProfile.Default;
}
