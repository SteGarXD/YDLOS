import React from 'react';

import block from 'bem-cn-lite';
import {Feature} from 'shared/types';
import {PRODUCT_NAME, REBRANDING_PRODUCT_NAME} from 'ui/constants';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';

import './LogoText.scss';

const b = block('aside-header-logo-text');

export type LogoTextProps = {
    installationInfo?: string;
    productName?: string;
    installationInfoClassName?: string;
};

export const LogoText = React.forwardRef<HTMLDivElement, LogoTextProps>(
    ({installationInfo, productName, installationInfoClassName}, ref) => {
        const isRebrandingEnabled = isEnabledFeature(Feature.EnableDLRebranding);
        // YDL OS: в opensource показываем только productName (Aeronavigator BI), без подписи "OPEN SOURCE"
        const serviceName =
            typeof window !== 'undefined' &&
            (window as Window & {DL?: {serviceName?: string}}).DL?.serviceName;
        const displayName =
            productName ||
            serviceName ||
            (isRebrandingEnabled ? REBRANDING_PRODUCT_NAME : PRODUCT_NAME);
        const showInstallation = isRebrandingEnabled && installationInfo && !serviceName;

        return (
            <div className={b()}>
                <div className={b('title', {rebranding: isRebrandingEnabled})}>{displayName}</div>
                {showInstallation && (
                    <div ref={ref} className={b('installation-info', installationInfoClassName)}>
                        {installationInfo}
                    </div>
                )}
            </div>
        );
    },
);

LogoText.displayName = 'LogoText';
