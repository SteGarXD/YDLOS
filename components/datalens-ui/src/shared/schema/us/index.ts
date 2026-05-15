import {registry} from '../../../server/registry';
import {getServiceEndpoints} from '../../endpoints/schema';

import {actions} from './actions';

export default {
    actions,
    endpoints: getServiceEndpoints('us'),
    serviceName: 'us',
    // YDL OS: чтобы gateway при проксировании в US отправлял x-us-master-token (иначе universalService/getAuth дают 401)
    getAuthArgs: (req: any, res: any) =>
        registry.common.auth.getAll().getAuthArgsUSPrivate(req, res),
    getAuthHeaders: (params: any) => registry.common.auth.getAll().getAuthHeadersUSPrivate(params),
};
