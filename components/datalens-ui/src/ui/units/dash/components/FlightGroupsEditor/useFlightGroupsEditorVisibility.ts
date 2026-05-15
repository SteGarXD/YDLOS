import React from 'react';

import type {DashData} from 'shared';

import {fetchFlightGroupsConfig} from '../../api/flightGroupsEditorApi';

function getAllowlistFromDl(): string[] {
    if (typeof window === 'undefined') {
        return [];
    }
    const ids = window.DL?.flightGroupsEditorDatasetIds;
    return Array.isArray(ids) ? ids : [];
}

export function useFlightGroupsEditorVisibility(_dashData: DashData | undefined) {
    const [allowlist, setAllowlist] = React.useState<string[]>(() => getAllowlistFromDl());

    React.useEffect(() => {
        let cancelled = false;
        fetchFlightGroupsConfig()
            .then((cfg) => {
                if (!cancelled && cfg) {
                    setAllowlist(cfg.datasetIds);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAllowlist(getAllowlistFromDl());
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const visible = React.useMemo(() => {
        // Show the button on every dashboard as long as the feature is configured.
        return allowlist.length > 0;
    }, [allowlist]);

    return {visible};
}
