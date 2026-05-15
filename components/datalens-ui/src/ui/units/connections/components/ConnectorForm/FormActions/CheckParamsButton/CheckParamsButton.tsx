import React from 'react';

import type {ButtonButtonProps} from '@gravity-ui/uikit';
import {Button, Icon, Popover} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';

import type {CheckData} from '../../../../store';

import iconError from 'ui/assets/icons/error.svg';
import iconOkay from 'ui/assets/icons/okay.svg';

import './CheckParamsButton.scss';

const b = block('conn-form-check-params-button');
const i18n = I18n.keyset('connections.form');
const ICON_SIZE = 16;

type OwnProps = {
    checkData: CheckData;
    onTooltipActionButtonClick: () => void;
};
type CheckParamsButtonProps = ButtonButtonProps & OwnProps;

export const CheckParamsButton = (props: CheckParamsButtonProps) => {
    const {checkData, loading, disabled, onClick, onTooltipActionButtonClick} = props;

    return (
        <div className={b()}>
            <Button
                size="l"
                view="outlined"
                loading={loading}
                disabled={disabled}
                onClick={onClick}
            >
                {i18n('button_verify')}
            </Button>
            {checkData.status !== 'unknown' &&
                (() => {
                    const iconData = checkData.status === 'error' ? iconError : iconOkay;
                    const isUrl = typeof iconData === 'string';
                    return (
                        <Popover
                            disabled={checkData.status !== 'error'}
                            className={b('tooltip')}
                            content={
                                <div className={b('tooltip-content')}>
                                    {i18n('toast_verify-error')}
                                    <Button onClick={onTooltipActionButtonClick}>
                                        {i18n('button_details')}
                                    </Button>
                                </div>
                            }
                        >
                            {isUrl ? (
                                <img
                                    src={iconData}
                                    alt=""
                                    className={b('icon')}
                                    width={ICON_SIZE}
                                    height={ICON_SIZE}
                                />
                            ) : (
                                <Icon className={b('icon')} data={iconData} size={ICON_SIZE} />
                            )}
                        </Popover>
                    );
                })()}
        </div>
    );
};
