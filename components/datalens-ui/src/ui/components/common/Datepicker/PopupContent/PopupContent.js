import React from 'react';

import {Button, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import PropTypes from 'prop-types';

import {Calendar} from '../Calendar/Calendar';
import {Presets} from '../Presets/Presets';
import {getTabs} from '../constants';

import './PopupContent.scss';

const i18n = I18n.keyset('components.common.Datepicker');
const b = block('dl-datepicker-popup-content');

export class PopupContent extends React.PureComponent {
    static propTypes = {
        from: PropTypes.object,
        to: PropTypes.object,
        min: PropTypes.object,
        max: PropTypes.object,
        zone: PropTypes.string,
        activeTab: PropTypes.string,
        mod: PropTypes.string,
        pick: PropTypes.number,
        range: PropTypes.bool,
        scrollCalendar: PropTypes.bool,
        showTabs: PropTypes.bool,
        enabledTabs: PropTypes.arrayOf(
            PropTypes.oneOf(['day', 'week', 'month', 'quarter', 'year']),
        ),
        showApply: PropTypes.bool,
        onDateClick: PropTypes.func,
        onRangeDateClick: PropTypes.func,
        onSelectTab: PropTypes.func,
        onSubmit: PropTypes.func,
    };

    render() {
        const {
            from,
            to,
            min,
            max,
            zone,
            activeTab,
            mod,
            pick,
            range,
            scrollCalendar,
            showTabs,
            enabledTabs,
            showApply,
        } = this.props;

        const tabs = enabledTabs?.length
            ? getTabs().filter((item) => enabledTabs.includes(item.id))
            : getTabs();
        // YDL OS: быстрые диапазоны (7/30/90/365 дней) только при разрешённом выборе по дням
        const showPresets = range && (!enabledTabs?.length || enabledTabs.includes('day'));

        return (
            <div className={b(null, mod)}>
                {showTabs && tabs.length > 0 && (
                    <React.Fragment>
                        <div className={b('tabs')}>
                            <TabProvider value={activeTab} onUpdate={this.props.onSelectTab}>
                                <TabList>
                                    {tabs.map((item) => (
                                        <Tab key={item.id} value={item.id}>
                                            {item.title}
                                        </Tab>
                                    ))}
                                </TabList>
                            </TabProvider>
                        </div>
                        {showPresets && (
                            <Presets
                                zone={zone}
                                activeTab={activeTab}
                                range={range}
                                onRangeDateClick={this.props.onRangeDateClick}
                            />
                        )}
                    </React.Fragment>
                )}
                <Calendar
                    from={from}
                    to={to}
                    min={min}
                    max={max}
                    zone={zone}
                    activeTab={activeTab}
                    pick={pick}
                    range={range}
                    scrollCalendar={scrollCalendar}
                    onDateClick={this.props.onDateClick}
                    onRangeDateClick={this.props.onRangeDateClick}
                />
                {showApply && (
                    <div className={b('apply-btn')}>
                        <Button view="action" size="l" width="max" onClick={this.props.onSubmit}>
                            {i18n('apply_button_text')}
                        </Button>
                    </div>
                )}
            </div>
        );
    }
}
