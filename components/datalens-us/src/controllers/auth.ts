import {Request, Response} from '@gravity-ui/expresskit';

import {Utils} from '../utils/utils';

/** Axios error и вложенные объекты нельзя отдавать через res.json — циклические ссылки дают 500. */
function serializeAuthResult(result: {err: unknown; data: unknown}) {
    if (!result.err) {
        return {err: null, data: result.data};
    }
    const e = result.err as {
        message?: string;
        code?: string;
        response?: {status?: number; data?: unknown};
    };
    const status = e.response?.status;
    const body = e.response?.data;
    let message = typeof e.message === 'string' ? e.message : 'Auth request failed';
    if (typeof body === 'string' && body.length < 500) {
        message = body;
    } else if (body && typeof body === 'object' && body !== null && 'message' in body) {
        const m = (body as {message?: string}).message;
        if (typeof m === 'string') {
            message = m;
        }
    }
    return {
        err: {message, status: status ?? null, code: e.code ?? null},
        data: null,
    };
}

export default async function authController(req: Request, res: Response) {
    if (!process.env.NODE_RPC_URL) {
        // Как раньше «no_data», но JSON — UI/gateway не падают на не-JSON теле.
        res.status(200).json({
            err: {message: 'Auth RPC is not configured (NODE_RPC_URL)', status: null, code: 'NO_RPC'},
            data: null,
        });
        return;
    }

    try {
        const url = new URL('http://localhost' + req.url);
        const login = url.searchParams.get('login');
        const password = url.searchParams.get('password');

        const embedResult = await Utils.authorize(login, password);
        res.json(serializeAuthResult(embedResult as {err: unknown; data: unknown}));
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        res.status(500).json({
            err: {message, status: 500, code: 'AUTH_CONTROLLER_ERROR'},
            data: null,
        });
    }
}
