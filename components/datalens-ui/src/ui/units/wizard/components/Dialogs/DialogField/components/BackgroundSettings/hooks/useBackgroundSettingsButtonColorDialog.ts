import React from 'react';

import type {ColorsConfig, NestedPartial, TableFieldBackgroundSettings} from 'shared';

import {PaletteType} from '../../../../../../../../components/PaletteIcon/PaletteIcon';
import {extractGradientSettings, extractPaletteSettings} from '../../../utils/backgroundSettings';

type UseBackgroundSettingsButtonColorDialogArgs = {
    state: TableFieldBackgroundSettings;
    onUpdate: (backgroundSettings: NestedPartial<TableFieldBackgroundSettings, 'settings'>) => void;
    /** YDL OS: false — палитра и градиент доступны, можно задать один цвет через палитру. */
    forceGradient?: boolean;
};

export const useBackgroundSettingsButtonColorDialog = (
    args: UseBackgroundSettingsButtonColorDialogArgs,
) => {
    const {onUpdate, state, forceGradient = false} = args;

    const effectiveContinuous = state.settings.isContinuous || forceGradient;

    const handleDialogColorApply = React.useCallback(
        (colorsConfig: ColorsConfig) => {
            const isContinuous = forceGradient || state.settings.isContinuous;
            const settings: Partial<TableFieldBackgroundSettings['settings']> = {
                gradientState: {},
                paletteState: {},
                ...(forceGradient ? {isContinuous: true} : {}),
            };

            if (isContinuous) {
                settings.gradientState = extractGradientSettings(colorsConfig);
            } else {
                settings.paletteState = extractPaletteSettings(colorsConfig);
            }

            onUpdate({settings});
        },
        [onUpdate, state.settings.isContinuous, forceGradient],
    );

    const paletteId = (
        effectiveContinuous
            ? state.settings.gradientState.gradientPalette
            : state.settings.paletteState.palette
    ) as string;

    const paletteType = effectiveContinuous
        ? PaletteType.GradientPalette
        : PaletteType.ColorPalette;

    const colorsConfig = {...state.settings.paletteState, ...state.settings.gradientState};

    return {handleDialogColorApply, paletteId, paletteType, colorsConfig};
};
