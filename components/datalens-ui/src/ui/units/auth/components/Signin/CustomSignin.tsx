import React from 'react';

import {Alert, Button, Flex, Icon, Text} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useDispatch, useSelector} from 'react-redux';
import {SignInQa} from 'shared/constants';
import {Feature} from 'shared/types';
import {DL, LOGO_PNG_URL} from 'ui/constants';
import type {CustomSigninProps} from 'ui/registry/units/auth/types/components/CustomSignin';
import {getSdk, isSdkError} from 'ui/libs/schematic-sdk';
import {showToast} from 'ui/store/actions/toaster';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';

import {selectFormData} from '../../store/selectors/signin';

import {Login} from './components/Login';
import {Password} from './components/Password';

import rebrandingLogoIcon from 'ui/assets/icons/os-logo.svg';

import './Signin.scss';

const i18n = I18n.keyset('auth.sign-in-custom');

const b = block('dl-signin');

export const CustomSignin = ({setToken, logoIcon}: CustomSigninProps) => {
    const dispatch = useDispatch();

    const [errorMessage, setErrorMessage] = React.useState<null | string>(null);

    const formData = useSelector(selectFormData);

    const oidc = DL.OIDC;
    const oidc_name = DL.OIDC_NAME;
    const oidc_base_url = DL.OIDC_BASE_URL;

    const oidc_2 = DL.OIDC_2;
    const oidc_name_2 = DL.OIDC_NAME_2;
    const oidc_base_url_2 = DL.OIDC_BASE_URL_2;

    const oidc_3 = DL.OIDC_3;
    const oidc_name_3 = DL.OIDC_NAME_3;
    const oidc_base_url_3 = DL.OIDC_BASE_URL_3;

    const oidc_4 = DL.OIDC_4;
    const oidc_name_4 = DL.OIDC_NAME_4;
    const oidc_base_url_4 = DL.OIDC_BASE_URL_4;
    const releaseVersion = DL.RELEASE_VERSION;

    function onOIDCAuth() {
        window.location.href = oidc_base_url;
    }

    function onOIDC2Auth() {
        window.location.href = oidc_base_url_2;
    }

    function onOIDC3Auth() {
        window.location.href = oidc_base_url_3;
    }

    function onOIDC4Auth() {
        window.location.href = oidc_base_url_4;
    }
    const handleSubmit: React.FormEventHandler<'form'> = (event) => {
        event.preventDefault();
        if (!formData.login || !formData.password) {
            setErrorMessage(i18n('label_error-required-fields'));
            return;
        }

        const {sdk} = getSdk();
        sdk.auth.auth
            .signin({
                login: formData.login.trim(),
                password: formData.password,
            })
            .then((response) => {
                const token = response?.token;
                if (typeof token === 'string' && token.length > 0) {
                    setToken(token);
                    return;
                }
                dispatch(
                    showToast({
                        title: i18n('error_auth_message'),
                        error: new Error('Auth service returned empty token'),
                        withReport: false,
                    }),
                );
            })
            .catch((error) => {
                if (sdk.isCancel(error)) {
                    return;
                }
                const title = isSdkError(error) ? error.message : i18n('error_auth_message');
                dispatch(
                    showToast({
                        title,
                        error: error instanceof Error ? error : new Error(String(error)),
                        withReport: false,
                    }),
                );
            });
    };

    const handleFormChange = React.useCallback(() => {
        if (errorMessage) {
            setErrorMessage(null);
        }
    }, [errorMessage]);

    /* Логика платформы: переданный logoIcon приоритетен; иначе ребрандинг (SVG) или дефолт — PNG в интерфейсе. */
    const defaultLogo =
        logoIcon ??
        (isEnabledFeature(Feature.EnableDLRebranding) ? rebrandingLogoIcon : LOGO_PNG_URL);
    const isLogoPng = typeof defaultLogo === 'string';

    return (
        <Flex className={b()} justifyContent="center" alignItems="center">
            <Flex
                className={b('form-container')}
                direction="column"
                gap="6"
                as="form"
                qa={SignInQa.SIGN_IN_FORM}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
            >
                <Flex direction="column" gap="2" alignItems="center">
                    {isLogoPng ? (
                        <img
                            src={defaultLogo}
                            alt=""
                            width={60}
                            height={60}
                            className={b('logo')}
                        />
                    ) : (
                        <Icon size={60} data={defaultLogo} className={b('logo')} />
                    )}
                    <Text variant="subheader-3" className={b('title')}>
                        {(typeof window !== 'undefined' &&
                            (window as Window & {DL?: {serviceName?: string}}).DL?.serviceName) ||
                            i18n('title_product')}
                    </Text>
                </Flex>
                <Flex direction="column" gap="4">
                    {errorMessage && <Alert theme="danger" message={errorMessage} />}
                    <Login qa={SignInQa.INPUT_LOGIN} />
                    <Password qa={SignInQa.INPUT_PASSWORD} />
                    <Button size="xl" view="action" type="submit">
                        {i18n('button_sign-in')}
                    </Button>
                </Flex>
                {(oidc || oidc_2 || oidc_3 || oidc_4) && (
                    <Flex gap={1} justifyContent="center" alignItems="center">
                        {i18n('description')}
                    </Flex>
                )}
                {oidc && (
                    <Button size="xl" onClick={onOIDCAuth}>
                        {i18n('label_oidc', {oidcName: oidc_name})}
                    </Button>
                )}
                {oidc_2 && (
                    <Button size="xl" onClick={onOIDC2Auth}>
                        {i18n('label_oidc', {oidcName: oidc_name_2})}
                    </Button>
                )}
                {oidc_3 && (
                    <Button size="xl" onClick={onOIDC3Auth}>
                        {i18n('label_oidc', {oidcName: oidc_name_3})}
                    </Button>
                )}
                {oidc_4 && (
                    <Button size="xl" onClick={onOIDC4Auth}>
                        {i18n('label_oidc', {oidcName: oidc_name_4})}
                    </Button>
                )}
                <div
                    style={{
                        position: 'absolute',
                        display: 'block',
                        bottom: '10px',
                        left: '10px',
                    }}
                >
                    Версия: {releaseVersion}
                </div>
            </Flex>
        </Flex>
    );
};
