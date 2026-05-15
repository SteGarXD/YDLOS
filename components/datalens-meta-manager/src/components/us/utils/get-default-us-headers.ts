import {AppContext} from '@gravity-ui/nodekit';

import {RPC_AUTHORIZATION_HEADER} from '../../../constants';
import {registry} from '../../../registry';
import {makeTenantIdHeader} from '../../../utils';
import {getCtxInfo, getCtxUser} from '../../../utils/ctx';

export const getDefaultUsHeaders = (ctx: AppContext): Record<string, string> => {
    const {getAdditionalDefaultUsHeaders} = registry.common.functions.get();

    const user = getCtxUser(ctx);
    const info = getCtxInfo(ctx);

    return {
        ...(user?.accessToken
            ? {[RPC_AUTHORIZATION_HEADER]: `${user.accessToken}`}
            : {}),

        ...makeTenantIdHeader(info.tenantId),

        ...getAdditionalDefaultUsHeaders({ctx}),
    };
};
