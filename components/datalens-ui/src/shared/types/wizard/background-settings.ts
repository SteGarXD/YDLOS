import type {ColorsConfig} from './index';
type PaletteFields = 'mountedColors' | 'palette';
type GradientFields =
    | 'thresholdsMode'
    | 'leftThreshold'
    | 'middleThreshold'
    | 'rightThreshold'
    | 'gradientPalette'
    | 'gradientMode'
    | 'reversed'
    | 'nullMode'
    | 'useGradient'
    | 'discreteColorLow'
    | 'discreteColorMid'
    | 'discreteColorHigh';

/** Пресет заливки ячеек сводной (меры): без пресета — по полю (градиент/палитра). */
export type TableFieldBackgroundCellStylePreset = 'trafficLight' | 'turquoise';

export interface TableFieldBackgroundSettings {
    enabled: boolean;
    colorFieldGuid: string;
    settingsId: string;
    /** Пресет для мер в сводной: светофор по значению или бирюзовый фон. Имеет приоритет над градиентом/палитрой. */
    cellStylePreset?: TableFieldBackgroundCellStylePreset;
    settings: {
        paletteState: Pick<ColorsConfig, PaletteFields>;
        gradientState: Pick<ColorsConfig, GradientFields>;
        isContinuous: boolean;
    };
}
