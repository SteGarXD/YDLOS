import {Feature} from '../../../../shared';
import {createFeatureConfig} from '../utils';

export default createFeatureConfig({
    name: Feature.EnableDLRebranding,
    state: {
        // YDL OS: светло-синий бренд из rebranding-theme; иначе везде остаётся оранжевый .g-root без .dl-root_rebranding
        development: true,
        production: true,
    },
});
