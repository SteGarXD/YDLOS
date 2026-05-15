import React from 'react';

import {Button, Flex, useThemeType} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useDispatch, useSelector} from 'react-redux';
import {Redirect, Route, Switch, useLocation} from 'react-router-dom';
import {Feature} from 'shared';
import {DL, LOGO_PNG_URL} from 'ui/constants';
import {registry} from 'ui/registry';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';

import {AUTH_ROUTE} from '../../constants/routes';
import {resetAuthState} from '../../store/actions/common';
import {selectAuthPageInited} from '../../store/selectors/common';
import {Logout} from '../Logout/Logout';
import {Reload} from '../Reload/Reload';
import {Signup} from '../Signup/Signup';

import {useAuthPageInit} from './useAuthPageInit';

import defaultBackgroundDark from '../../../../assets/images/dl-auth-background-dark.jpg';
import defaultBackgroundLight from '../../../../assets/images/dl-auth-background-light.jpg';

import './AuthPage.scss';

const b = block('auth-page');
const i18nAuth = I18n.keyset('auth.sign-in-custom');

export type AuthPageProps = {backgroundImage?: {light: string; dark: string}};

export function AuthPage({backgroundImage}: AuthPageProps) {
    const dispatch = useDispatch();
    const authPageInited = useSelector(selectAuthPageInited);

    const theme = useThemeType();
    const {pathname} = useLocation();

    const [backgroundImageLoaded, setBackgroundImageLoaded] = React.useState(false);

    const {Signin} = registry.auth.components.getAll();
    useAuthPageInit();

    React.useEffect(() => {
        return () => {
            dispatch(resetAuthState());
        };
    }, [dispatch]);

    if (!authPageInited) {
        return null;
    }

    const needToSign = !DL.USER?.uid;

    const currentDefaultImage = theme === 'dark' ? defaultBackgroundDark : defaultBackgroundLight;
    const currentImage = backgroundImage?.[theme] || currentDefaultImage;

    // Для opensource — страница входа без полноэкранного фона (простая карточка на нейтральном фоне), без блока регистрации
    const showBackgroundImage =
        isEnabledFeature(Feature.EnableDLRebranding) &&
        [AUTH_ROUTE.SIGNIN, AUTH_ROUTE.SIGNUP].includes(pathname) &&
        DL.installationType !== 'opensource';

    return (
        <Flex
            direction="column"
            height="100%"
            className={b({rebranding: isEnabledFeature(Feature.EnableDLRebranding), theme})}
        >
            {showBackgroundImage && (
                <img
                    className={b('background-image', {
                        loaded: backgroundImageLoaded,
                    })}
                    src={currentImage}
                    onLoad={() => setBackgroundImageLoaded(true)}
                    aria-hidden="true"
                />
            )}
            <Switch>
                {needToSign && (
                    <Route
                        path={AUTH_ROUTE.SIGNIN}
                        render={(routeProps) => {
                            const hasOidc = DL.OIDC || DL.OIDC_2 || DL.OIDC_3 || DL.OIDC_4;
                            const alternativeAuthOptions = hasOidc ? (
                                <Flex gap={2} direction="column" className={b('oidc-buttons')}>
                                    {(DL.OIDC || DL.OIDC_2 || DL.OIDC_3 || DL.OIDC_4) && (
                                        <Flex gap={1} justifyContent="center" alignItems="center">
                                            {i18nAuth('description')}
                                        </Flex>
                                    )}
                                    {DL.OIDC && (
                                        <Button
                                            size="xl"
                                            view="outlined"
                                            onClick={() => {
                                                window.location.href = DL.OIDC_BASE_URL || '';
                                            }}
                                        >
                                            {i18nAuth('label_oidc', {
                                                oidcName: DL.OIDC_NAME || 'OIDC',
                                            })}
                                        </Button>
                                    )}
                                    {DL.OIDC_2 && (
                                        <Button
                                            size="xl"
                                            view="outlined"
                                            onClick={() => {
                                                window.location.href = DL.OIDC_BASE_URL_2 || '';
                                            }}
                                        >
                                            {i18nAuth('label_oidc', {
                                                oidcName: DL.OIDC_NAME_2 || 'OIDC',
                                            })}
                                        </Button>
                                    )}
                                    {DL.OIDC_3 && (
                                        <Button
                                            size="xl"
                                            view="outlined"
                                            onClick={() => {
                                                window.location.href = DL.OIDC_BASE_URL_3 || '';
                                            }}
                                        >
                                            {i18nAuth('label_oidc', {
                                                oidcName: DL.OIDC_NAME_3 || 'OIDC',
                                            })}
                                        </Button>
                                    )}
                                    {DL.OIDC_4 && (
                                        <Button
                                            size="xl"
                                            view="outlined"
                                            onClick={() => {
                                                window.location.href = DL.OIDC_BASE_URL_4 || '';
                                            }}
                                        >
                                            {i18nAuth('label_oidc', {
                                                oidcName: DL.OIDC_NAME_4 || 'OIDC',
                                            })}
                                        </Button>
                                    )}
                                </Flex>
                            ) : undefined;
                            return (
                                <Signin
                                    {...routeProps}
                                    logoIcon={LOGO_PNG_URL}
                                    alternativeAuthOptions={alternativeAuthOptions}
                                />
                            );
                        }}
                    />
                )}
                {needToSign && <Route path={AUTH_ROUTE.SIGNUP} component={Signup} />}
                <Route path={AUTH_ROUTE.RELOAD} component={Reload} />
                <Route path={AUTH_ROUTE.LOGOUT} component={Logout} />
                <Redirect to="/" />
            </Switch>
        </Flex>
    );
}
