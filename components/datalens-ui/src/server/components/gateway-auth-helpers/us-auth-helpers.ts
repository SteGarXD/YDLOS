import type {Request, Response} from '@gravity-ui/expresskit';
import type {GetAuthHeaders} from '@gravity-ui/gateway';

import {US_MASTER_TOKEN_HEADER} from '../../../shared/constants/header';

type AuthArgsData = {
    usMasterToken?: string;
};

export const getAuthArgsUSPrivate = ({ctx}: Request, _res: Response): AuthArgsData => {
    const usMasterToken =
        (ctx.config.usMasterToken as string) || process.env.US_MASTER_TOKEN || 'us-master-token';
    return {
        usMasterToken,
    };
};

export const getAuthHeadersUSPrivate: GetAuthHeaders<AuthArgsData> = ({authArgs}) => {
    const usMasterToken =
        (authArgs?.usMasterToken as string) || process.env.US_MASTER_TOKEN || 'us-master-token';
    return {
        [US_MASTER_TOKEN_HEADER]: usMasterToken,
    };
};

export const getAuthArgsProxyUSPrivate = (req: Request, _res: Response): AuthArgsData => {
    return {
        usMasterToken: req.headers[US_MASTER_TOKEN_HEADER] as string,
    };
};
