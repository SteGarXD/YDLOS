import React, {useEffect} from 'react';
import {Route, Switch, Redirect, useLocation} from 'react-router-dom';
// import {useSelector} from 'react-redux';
import coreReducers from 'store/reducers';
import {getIsAsideHeaderEnabled} from 'components/AsideHeaderAdapter';
import LocationChange from '../components/LocationChange/LocationChange';
// import {selectIsLanding} from 'store/selectors/landing';
import FallbackPage from './pages/FallbackPage/FallbackPage';
import DashAndWizardQLPages, {
    dashAndWizardQLRoutes,
} from './pages/DashAndWizardQLPages/DashAndWizardQLPages';
import {locationChangeHandler} from './helpers';
import {isEmbeddedMode, isTvMode} from '../utils/embedded';
import {reducerRegistry} from '../store';
import {AsideHeaderAdapter} from 'ui/components/AsideHeaderAdapter/AsideHeaderAdapter';
import {MobileHeaderComponent} from 'ui/components/MobileHeader/MobileHeaderComponent/MobileHeaderComponent';
import {DL, LOGO_PNG_URL} from 'ui/constants';
import {useClearReloadedQuery} from '../units/auth/hooks/useClearReloadedQuery';
import {reducer} from 'ui/units/auth/store/reducers';
import {useIframeRender} from './hooks';
import {getSdk} from '../libs/schematic-sdk';
import {AppInstallation, Feature, RPC_AUTHORIZATION} from '../../shared';

import CustomAuthPage from './pages/AuthPage/CustomAuthPage';
import Utils from 'ui/utils';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';
import {chartkitApi} from 'ui/store/toolkit/chartkit/api';

reducerRegistry.register(coreReducers);
reducerRegistry.register({auth: reducer});
reducerRegistry.register({chartkitApi: chartkitApi.reducer});

reducerRegistry.registerMiddleware(chartkitApi.middleware);

/** Любой путь входа: /auth, /auth/… — без вызова US (иначе 401 при устаревшем токене в localStorage). */
function isAuthRoutePath(pathname: string): boolean {
    return /^\/auth(\/|$)/.test(pathname);
}

/**
 * Внешний Switch должен монтировать те же «оболочки», что и внутренние роутеры,
 * иначе URL попадёт в более общий Route (например /workbooks/:id → коллекции).
 * См. DatasetRouter.getDatasetPaths, connections/Router.getPaths.
 */
function getDatasetShellPaths(): string[] {
    const paths = [
        '/workbooks/:workbookId/datasets/new',
        '/workbooks/:workbookId/datasets/:id',
        '/datasets/:id',
    ];
    if (isEnabledFeature(Feature.EnableSharedEntries)) {
        paths.push(
            '/collections/:collectionId/datasets/new',
            '/collections/:collectionId/datasets/:id',
        );
    }
    return paths;
}

function getConnectionsShellPaths(): string[] {
    const paths = [
        '/connections/:id',
        '/connections/new/:type',
        '/connections/new',
        '/workbooks/:workbookId/connections/new/:type',
        '/workbooks/:workbookId/connections/new',
        /** Редактирование существующего подключения внутри воркбука (внутри Router — getPaths('exist')) */
        '/workbooks/:workbookId/connections/:id',
    ];
    if (isEnabledFeature(Feature.EnableSharedEntries)) {
        paths.push(
            '/collections/:collectionId/connections/new',
            '/collections/:collectionId/connections/new/:type',
            '/collections/:collectionId/connections/:id',
        );
    }
    return paths;
}

const DatasetPage = React.lazy(() => import('./pages/DatasetPage/DatasetPage'));
const PreviewPage = React.lazy(() => import('./pages/PreviewPage/PreviewPage'));
const ConnectionsPage = React.lazy(
    () =>
        import(
            /* webpackChunkName: "connections-page" */ './pages/ConnectionsPage/ConnectionsPage'
        ),
);
// comment till we have main page
// const MainPage = React.lazy(() => import('./pages/MainPage/MainPage'));
const CollectionsNavigtaionPage = React.lazy(
    () => import('./pages/CollectionsNavigationPage/CollectionsNavigationPage'),
);

const RolesPage = React.lazy(() => import('./pages/AdminPage/RolesPage'));
const ProjectsPage = React.lazy(() => import('./pages/AdminPage/ProjectsPage'));

const UsersPage = React.lazy(() => import('./pages/AdminPage/UsersPage'));

const ServiceSettings = React.lazy(() => import('./pages/ServiceSettingsPage/ServiceSettingsPage'));
//const UserProfile = React.lazy(() => import('./pages/OwnUserProfilePage/OwnUserProfilePage'));

//const LandingPage = React.lazy(() => import('./pages/LandingPage/LandingPage'));
const AuthPage = React.lazy(
    () => import(/* webpackChunkName: "auth-page" */ './pages/AuthPage/AuthPage'),
);

export const AuthContext = React.createContext({
    token: '',
    setToken: function (_token: string) {
        /* default no-op until provider mounts */
    },
    superUser: {},
    setSuperUser: function (_value: boolean) {
        /* default no-op until provider mounts */
    },
});

const DatalensPageView = (props: any) => {
    useClearReloadedQuery();
    // YDL OS: заголовок вкладки — Aeronavigator BI (из serviceName или по умолчанию)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const name =
                (window as Window & {DL?: {serviceName?: string}}).DL?.serviceName ||
                'Aeronavigator BI';
            document.title = name;
        }
    }, []);
    const token = props.token;
    const setToken = props.setToken;

    const superUser = props.superUser;
    const setSuperUser = props.setSuperUser;

    // const isLanding = useSelector(selectIsLanding);
    const location = useLocation();

    // if (isLanding) {
    //     return (
    //         <React.Suspense fallback={<FallbackPage />}>
    //             <LandingPage />
    //         </React.Suspense>
    //     );
    // }

    // YDL-OS: облачный auth-layout ставит isAuthPage и тянет registry Signin («Yandex DataLens»).
    // В opensource всегда показываем CustomAuthPage / CustomSignin (брендинг, OIDC-кнопки, версия).
    if (DL.IS_AUTH_PAGE && DL.installationType !== AppInstallation.Opensource) {
        return (
            <React.Suspense fallback={<FallbackPage />}>
                <AuthPage />
            </React.Suspense>
        );
    }

    return (
        <AuthContext.Provider value={{token, setToken, superUser, setSuperUser}}>
            <React.Suspense fallback={<FallbackPage />}>
                <Switch>
                    {!token && location?.pathname !== '/auth' && <Redirect from="*" to="/auth" />}
                    {token && <Redirect from="/auth" to="/" />}
                    <Route
                        path={'/auth'}
                        component={() => (
                            <CustomAuthPage setToken={setToken} logoIcon={LOGO_PNG_URL} />
                        )}
                    />
                    <Route
                        path={['/admin/users']}
                        component={
                            superUser?.isMaster
                                ? UsersPage
                                : () => <Redirect from="/admin/users" to="/" />
                        }
                    />
                    <Route
                        path={['/admin/roles']}
                        component={
                            superUser?.isMaster
                                ? RolesPage
                                : () => <Redirect from="/admin/roles" to="/" />
                        }
                    />
                    <Route
                        path={['/admin/projects']}
                        component={
                            superUser?.isMaster
                                ? ProjectsPage
                                : () => <Redirect from="/admin/projects" to="/" />
                        }
                    />
                    <Route path={getDatasetShellPaths()} component={DatasetPage} />
                    {/* {Utils.isEnabledFeature(Feature.EnableChartEditor) && (
                        <Route
                            path={['/editor', '/workbooks/:workbookId/editor']}
                            component={EditorPage}
                        />
                    )} */}

                    <Route path="/preview" component={PreviewPage} />

                    {/* Prevent attempts to create a standalone (outside of workbook) connection */}
                    <Route path={['/connections/new/:type', '/connections/new']}>
                        <Redirect to={`/collections${location.search}`} />
                    </Route>
                    <Route path={getConnectionsShellPaths()} component={ConnectionsPage} />

                    <Route path="/settings" component={ServiceSettings} />

                    <Route path={['/collections']} component={CollectionsNavigtaionPage} />

                    <Route exact path={dashAndWizardQLRoutes} component={DashAndWizardQLPages} />

                    <Route
                        path={['/collections/:collectionId', '/workbooks/:workbookId']}
                        component={CollectionsNavigtaionPage}
                    />

                    {DL.AUTH_ENABLED && <Route path="/auth" component={AuthPage} />}

                    <Route path="/">
                        <Redirect to={`/collections${location.search}`} />
                    </Route>

                    {/* comment till we have main page */}
                    {/*<Route path="/" component={MainPage} />*/}
                </Switch>
                <LocationChange onLocationChanged={locationChangeHandler} />
            </React.Suspense>
        </AuthContext.Provider>
    );
};

const DatalensPage: React.FC = () => {
    const showAsideHeaderAdapter = getIsAsideHeaderEnabled() && !isEmbeddedMode() && !isTvMode();
    const location = useLocation();

    /** На /auth currentUser не вызываем — не дергаем US (401 при устаревшем токене в localStorage). */
    const [superUser, setSuperUser] = React.useState<Object | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        if (isAuthRoutePath(window.location.pathname)) {
            return {};
        }
        return null;
    });

    useEffect(() => {
        if (isAuthRoutePath(location.pathname)) {
            setSuperUser({});
            return;
        }

        Utils.universalService({action: 'datalens', method: 'currentUser', data: [{}]})
            .then((value) => {
                if (value.err || value.data.length == 0) {
                    setSuperUser({});
                } else {
                    setSuperUser(value.data[0]);
                }
            })
            .catch(() => {
                setSuperUser({});
            });
    }, [location.pathname]);

    const [token, _setToken] = React.useState(Utils.getRpcAuthorization() || '');

    function setToken(value: any) {
        localStorage.setItem('x-rpc-authorization', value);
        getSdk().sdk.setDefaultHeader({
            name: RPC_AUTHORIZATION,
            value: value,
        });
        _setToken(value);
        // перегружаем страницу, чтобы применить LocalStorage
        window.location.assign('/');
    }
    const showMobileHeader = !isEmbeddedMode() && DL.IS_MOBILE;
    // const showMobileHeader =
    //     !isEmbeddedMode() && DL.IS_MOBILE && !DL.IS_NOT_AUTHENTICATED && !DL.IS_AUTH_PAGE;

    useIframeRender();

    if (token && showMobileHeader && superUser) {
        return (
            <MobileHeaderComponent
                renderContent={() => (
                    <DatalensPageView
                        token={token}
                        setToken={setToken}
                        superUser={superUser}
                        setSuperUser={setSuperUser}
                    />
                )}
                logoIcon={LOGO_PNG_URL}
                logoTextProps={{}}
            />
        );
    }

    if (token && showAsideHeaderAdapter && superUser) {
        return (
            <AsideHeaderAdapter
                superUser={superUser}
                renderContent={() => (
                    <DatalensPageView
                        token={token}
                        setToken={setToken}
                        superUser={superUser}
                        setSuperUser={setSuperUser}
                    />
                )}
                logoIcon={LOGO_PNG_URL}
                logoTextProps={{}}
            />
        );
    }

    if (superUser) {
        return (
            <DatalensPageView
                token={token}
                setToken={setToken}
                superUser={superUser}
                setSuperUser={setSuperUser}
            />
        );
    }

    return <div>currentUser loading error</div>;
};

export default DatalensPage;
