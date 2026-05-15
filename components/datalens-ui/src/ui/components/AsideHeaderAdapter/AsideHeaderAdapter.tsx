import React from 'react';

import {
    ArrowRightFromSquare,
    CircleQuestion,
    FolderTree,
    Gear,
    Lock,
    Persons,
    Sliders,
} from '@gravity-ui/icons';
import type {AsideHeaderProps, MenuItem, TopAlertProps} from '@gravity-ui/navigation';
import {AsideHeader, FooterItem} from '@gravity-ui/navigation';
import type {IconData} from '@gravity-ui/uikit';
import {List} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n, i18n as baseI18n} from 'i18n';
import {useDispatch, useSelector} from 'react-redux';
import {Link, useHistory, useLocation} from 'react-router-dom';
import {DlNavigationQA, Feature, RPC_AUTHORIZATION} from 'shared';
import {DL, LOGO_PNG_URL} from 'ui/constants';
import {getSdk} from 'ui/libs/schematic-sdk';
import {closeDialog, openDialog} from 'ui/store/actions/dialog';
import {
    selectAsideHeaderIsCompact,
    selectAsideHeaderIsHidden,
} from 'ui/store/selectors/asideHeader';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';

import {setAsideHeaderData, updateAsideHeaderIsCompact} from '../../store/actions/asideHeader';
import type {AsideHeaderData} from '../../store/typings/asideHeader';
import {UserAvatar} from '../UserMenu/UserAvatar';
import {UserMenu} from '../UserMenu/UserMenu';

import type {LogoTextProps} from './LogoText/LogoText';
import {LogoText} from './LogoText/LogoText';
import {Settings as SettingsPanel} from './Settings/Settings';
import {DIALOG_RELEASE_VERSION} from './VersionDialog/VersionDialog';
import {ASIDE_HEADER_LOGO_ICON_SIZE} from './constants';

import monoCollectionIcon from 'ui/assets/icons/mono-collection.svg';

import './AsideHeaderAdapter.scss';

const b = block('dl-aside-header');
const i18n = I18n.keyset('component.aside-header.view');

const COLLECTIONS_PATH = '/collections';
const SERVICE_SETTINGS_PATH = '/settings';
const PROJECTS_PATH = '/admin/projects';
const ROLES_PATH = '/admin/roles';
const USERS_PATH = '/admin/users';

const FOOTER_ITEM_DEFAULT_SIZE = 18;
const PROMO_SITE_DOMAIN = 'https://datalens.tech';
const PROMO_DOC_PATH = '/docs';
const GITHUB_URL = 'https://github.com/akrasnov87/datalens';

export const DOCUMENTATION_LINK =
    DL.DOCS_URL || `${PROMO_SITE_DOMAIN}${PROMO_DOC_PATH}/${DL.USER_LANG}/`;

export const ITEMS_NAVIGATION_DEFAULT_SIZE = 18;

export type AsideHeaderAdapterProps = {
    renderContent?: AsideHeaderProps['renderContent'];
    superUser?: any;
    logoIcon?: IconData;
    logoTextProps?: LogoTextProps & {ref?: React.RefObject<HTMLDivElement>};
    collapseButtonWrapper?: AsideHeaderProps['collapseButtonWrapper'];
    customMenuItems?: MenuItem[];
    logoWrapperRef?: React.RefObject<HTMLAnchorElement>;
    asideRef?: React.RefObject<HTMLDivElement>;
};

enum Panel {
    Settings = 'settings',
}

enum PopupName {
    Main = 'main',
    Account = 'account',
}

export const getLinkWrapper = (node: React.ReactNode, path: string) => {
    return (
        <Link to={path} className={b('item-link')} data-qa={DlNavigationQA.AsideMenuItem}>
            <div className={b('item-wrap')}>{node}</div>
        </Link>
    );
};

type DocsItem = {
    text: React.ReactNode;
    hint?: string;
    url?: string;
    itemWrapper?: (item: DocsItem) => React.ReactNode;
};

const renderDocsItem = (item: DocsItem) => {
    const {text, url, hint, itemWrapper} = item;
    const title = hint ?? (typeof text === 'string' ? text : undefined);
    if (typeof itemWrapper === 'function') {
        return itemWrapper(item);
    } else if (url) {
        return (
            <a
                className={b('docs-link')}
                rel="noopener noreferrer"
                target="_blank"
                href={url}
                title={title}
            >
                {text}
            </a>
        );
    } else {
        return text;
    }
};

export const AsideHeaderAdapter = ({
    renderContent,
    superUser,
    logoIcon,
    logoTextProps,
    collapseButtonWrapper,
    customMenuItems,
    logoWrapperRef: _logoWrapperRef,
    asideRef,
}: AsideHeaderAdapterProps) => {
    const dispatch = useDispatch();
    const {pathname} = useLocation();
    const history = useHistory();
    const isCompact = useSelector(selectAsideHeaderIsCompact);
    const isHidden = useSelector(selectAsideHeaderIsHidden);
    const [visiblePanel, setVisiblePanel] = React.useState<Panel>();
    const [currentPopup, setCurrentPopup] = React.useState<PopupName | null>(null);

    const renderAsideHeaderContent = React.useCallback(
        (asideHeaderData: AsideHeaderData) => {
            // Cause it's dispatch moving it to next tick to prevent render race warnings
            window.requestAnimationFrame(() => {
                dispatch(setAsideHeaderData(asideHeaderData));
            });

            return renderContent?.(asideHeaderData);
        },
        [renderContent, dispatch],
    );

    const onChangeCompact = React.useCallback(
        (compact: boolean) => {
            dispatch(updateAsideHeaderIsCompact(compact));
        },
        [dispatch],
    );

    const handleClosePanel = React.useCallback(() => {
        setVisiblePanel(undefined);
    }, []);

    const isReadOnly = isEnabledFeature(Feature.ReadOnlyMode);
    const topAlert: TopAlertProps | undefined = isReadOnly
        ? {
              message: baseI18n('common.read-only', 'toast_editing-warning'),
          }
        : undefined;

    const menuItems: MenuItem[] = React.useMemo(
        () => [
            {
                id: 'collections',
                title: i18n('label_collections'),
                current: pathname.includes(COLLECTIONS_PATH),
                icon: monoCollectionIcon,
                iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                itemWrapper: (params: any, makeItem: any) => {
                    return getLinkWrapper(makeItem(params), COLLECTIONS_PATH);
                },
            },
            ...(customMenuItems || []),
            {
                id: 'settings',
                title: i18n('switch_service-settings'),
                current: pathname.includes(SERVICE_SETTINGS_PATH),
                icon: Sliders,
                iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                itemWrapper: (params: any, makeItem: any) => {
                    return getLinkWrapper(makeItem(params), SERVICE_SETTINGS_PATH);
                },
            },
            ...(superUser?.isMaster
                ? [
                      {
                          id: 'users',
                          title: i18n('switch_service-users'),
                          current: pathname.includes(USERS_PATH),
                          icon: Persons,
                          iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                          itemWrapper: (params: any, makeItem: any) => {
                              return getLinkWrapper(makeItem(params), USERS_PATH);
                          },
                      },
                      {
                          id: 'projects',
                          title: i18n('switch_service-projects'),
                          current: pathname.includes(PROJECTS_PATH),
                          icon: FolderTree,
                          iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                          itemWrapper: (params: any, makeItem: any) => {
                              return getLinkWrapper(makeItem(params), PROJECTS_PATH);
                          },
                      },
                      {
                          id: 'roles',
                          title: i18n('switch_service-roles'),
                          current: pathname.includes(ROLES_PATH),
                          icon: Lock,
                          iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                          itemWrapper: (params: any, makeItem: any) => {
                              return getLinkWrapper(makeItem(params), ROLES_PATH);
                          },
                      },
                  ]
                : []),
        ],
        [pathname, customMenuItems, superUser?.isMaster],
    );

    const panelItems = React.useMemo(
        () => [
            {
                id: Panel.Settings,
                content: <SettingsPanel />,
                visible: visiblePanel === Panel.Settings,
            },
        ],
        [visiblePanel],
    );

    const getReliaseVersionWrapper = React.useCallback(
        ({text}) => {
            const handleShowReleaseVersion = () => {
                setCurrentPopup(null);
                dispatch(
                    openDialog({
                        id: DIALOG_RELEASE_VERSION,
                        props: {
                            releaseVersion: DL.RELEASE_VERSION || '',
                            open: true,
                            onClose: () => {
                                dispatch(closeDialog());
                            },
                        },
                    }),
                );
            };

            return (
                <div className={b('info-btn')} onClick={handleShowReleaseVersion}>
                    {text}
                </div>
            );
        },
        [dispatch],
    );

    const handleClosePopup = React.useCallback(() => {
        setCurrentPopup(null);
    }, []);

    const renderFooter = () => {
        return (
            <React.Fragment>
                <FooterItem
                    compact={isCompact}
                    item={{
                        id: Panel.Settings,
                        icon: Gear,
                        iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                        title: i18n('label_settings'),
                        tooltipText: i18n('label_settings'),
                        current: visiblePanel === Panel.Settings,
                        onItemClick: () =>
                            setVisiblePanel(
                                visiblePanel === Panel.Settings ? undefined : Panel.Settings,
                            ),
                    }}
                />
                <FooterItem
                    compact={isCompact}
                    item={{
                        id: PopupName.Main,
                        icon: CircleQuestion,
                        iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                        title: i18n('label_main'),
                        tooltipText: i18n('label_main'),
                        current: currentPopup === PopupName.Main,
                        onItemClick: () => {
                            setVisiblePanel(undefined);
                            setCurrentPopup(
                                currentPopup === PopupName.Main ? null : PopupName.Main,
                            );
                        },
                    }}
                    enableTooltip={false}
                    popupVisible={currentPopup === PopupName.Main}
                    popupOffset={{mainAxis: 0, crossAxis: 8}}
                    onOpenChangePopup={(isOpen) => {
                        if (!isOpen) {
                            setCurrentPopup(null);
                        }
                    }}
                    renderPopupContent={() => {
                        return (
                            <List
                                size="s"
                                items={[
                                    {
                                        text: i18n('label_github'),
                                        url: GITHUB_URL,
                                    },
                                    DL.RELEASE_VERSION
                                        ? {
                                              text: i18n('label_about'),
                                              itemWrapper: getReliaseVersionWrapper,
                                          }
                                        : {
                                              text: i18n('label_about'),
                                              url: PROMO_SITE_DOMAIN,
                                          },
                                    {
                                        text: i18n('label_docs'),
                                        url: DOCUMENTATION_LINK,
                                    },
                                ].filter(Boolean)}
                                filterable={false}
                                virtualized={false}
                                renderItem={renderDocsItem}
                            />
                        );
                    }}
                />
                <FooterItem
                    compact={isCompact}
                    item={{
                        id: 'logout',
                        icon: ArrowRightFromSquare,
                        iconSize: FOOTER_ITEM_DEFAULT_SIZE,
                        title: superUser.username || superUser.c_login,
                        tooltipText: i18n('label_logout'),
                        current: visiblePanel === Panel.Settings,
                        onItemClick: () => {
                            localStorage.removeItem('x-rpc-authorization');
                            getSdk().sdk.setDefaultHeader({
                                name: RPC_AUTHORIZATION,
                                value: '',
                            });
                            window.location.assign('/auth');
                        },
                    }}
                />
                {(DL.ZITADEL_ENABLED || DL.AUTH_ENABLED) && (
                    <FooterItem
                        compact={isCompact}
                        item={{
                            id: PopupName.Account,
                            itemWrapper: (params, makeItem) =>
                                makeItem({...params, icon: <UserAvatar size="m" />}),
                            title: i18n('label_account'),
                            tooltipText: i18n('label_account'),
                            current: currentPopup === PopupName.Account,
                            onItemClick: () => {
                                setVisiblePanel(undefined);
                                setCurrentPopup(
                                    currentPopup === PopupName.Account ? null : PopupName.Account,
                                );
                            },
                        }}
                        enableTooltip={false}
                        popupVisible={currentPopup === PopupName.Account}
                        popupOffset={{mainAxis: 0, crossAxis: 8}}
                        onOpenChangePopup={(isOpen) => {
                            if (!isOpen) {
                                handleClosePopup();
                            }
                        }}
                        renderPopupContent={() => <UserMenu onClose={handleClosePopup} />}
                    />
                )}
            </React.Fragment>
        );
    };

    /* Лого — родное для платформы: иконка и текст передаём в AsideHeader, рендер и разметка от @gravity-ui/navigation */
    return (
        <AsideHeader
            compact={isCompact}
            logo={{
                text: () => <LogoText {...logoTextProps} />,
                // PNG в интерфейсе: тип AsideHeader ожидает SVGIconData, в рантайме ReactNode тоже принимается
                icon: (logoIcon ?? (
                    <img
                        src={LOGO_PNG_URL}
                        alt=""
                        width={ASIDE_HEADER_LOGO_ICON_SIZE}
                        height={ASIDE_HEADER_LOGO_ICON_SIZE}
                    />
                )) as IconData,
                iconSize: ASIDE_HEADER_LOGO_ICON_SIZE,
                textSize: 15,
                iconClassName: b('logo-icon'),
                className: b('logo'),
                href: COLLECTIONS_PATH,
                onClick: (e: React.MouseEvent<HTMLElement>) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
                        return;
                    }
                    e.preventDefault();
                    history.push(COLLECTIONS_PATH);
                },
            }}
            topAlert={topAlert}
            menuItems={menuItems}
            panelItems={panelItems}
            headerDecoration={false}
            onChangeCompact={onChangeCompact}
            renderFooter={renderFooter}
            renderContent={renderAsideHeaderContent}
            onClosePanel={handleClosePanel}
            className={b({
                hidden: isHidden,
            })}
            collapseButtonWrapper={collapseButtonWrapper}
            ref={asideRef}
        />
    );
};
