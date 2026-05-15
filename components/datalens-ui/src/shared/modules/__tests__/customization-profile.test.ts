import {resolveVisualizationCustomizationProfile, VisualizationCustomizationProfile} from '../wizard/customization-profile';

describe('resolveVisualizationCustomizationProfile (dashboard 7 / pre-sale)', () => {
    it('detects pre-sale table when column titles are verbose (not exact column1/class)', () => {
        const id = resolveVisualizationCustomizationProfile({
            extraSettings: {},
            titleHints: [''],
            headerFieldHints: [
                'Дата рейса',
                'Номера рейса',
                'Порт1',
                'Порт2',
                'cclass',
                'Класс бронирования',
                'column1',
            ],
        });
        expect(id).toBe(VisualizationCustomizationProfile.PreSalePeriod);
    });
});
