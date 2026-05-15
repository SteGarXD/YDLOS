import Utils from 'ui/utils/utils';

function headers(json = true): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) {
        h['Content-Type'] = 'application/json';
    }
    const csrf = document.querySelector<HTMLMetaElement>('meta[name=csrf-token]')?.content;
    if (csrf) {
        h['x-csrf-token'] = csrf;
    }
    const rpc = Utils.getRpcAuthorization();
    if (rpc) {
        h['x-rpc-authorization'] = rpc;
    }
    const editorToken = (window as unknown as {DL?: {flightGroupsEditorToken?: string}}).DL
        ?.flightGroupsEditorToken;
    if (editorToken) {
        h['x-flight-groups-editor-token'] = editorToken;
    }
    return h;
}

export type FlightGroupsConfig = {
    datasetIds: string[];
};

export async function fetchFlightGroupsConfig(): Promise<FlightGroupsConfig> {
    const res = await fetch('/api/flight-groups-editor/config', {headers: headers(false)});
    if (!res.ok) {
        throw new Error(`config ${res.status}`);
    }
    return res.json();
}

export type FlightGroupRow = {id: number; groupName: string};

export async function fetchGroups(): Promise<FlightGroupRow[]> {
    const res = await fetch('/api/flight-groups-editor/groups', {headers: headers(false)});
    if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `groups ${res.status}`);
    }
    const data = await res.json();
    return data.groups || [];
}

export async function createGroup(groupName: string): Promise<number> {
    const res = await fetch('/api/flight-groups-editor/groups', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({groupName}),
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
    const data = await res.json();
    return data.id;
}

export async function updateGroup(id: number, groupName: string): Promise<void> {
    const res = await fetch(`/api/flight-groups-editor/groups/${id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({groupName}),
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
}

export async function deleteGroup(id: number): Promise<void> {
    const res = await fetch(`/api/flight-groups-editor/groups/${id}`, {
        method: 'DELETE',
        headers: headers(false),
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
}

export async function fetchFlightsIn(groupId: number, filter: string): Promise<string[]> {
    const q = new URLSearchParams();
    if (filter) {
        q.set('filter', filter);
    }
    const res = await fetch(
        `/api/flight-groups-editor/groups/${groupId}/flights-in?${q.toString()}`,
        {headers: headers(false)},
    );
    if (!res.ok) {
        throw new Error(await res.text());
    }
    const data = await res.json();
    return data.flights || [];
}

export async function fetchFlightsOut(groupId: number, filter: string): Promise<string[]> {
    const q = new URLSearchParams();
    if (filter) {
        q.set('filter', filter);
    }
    const res = await fetch(
        `/api/flight-groups-editor/groups/${groupId}/flights-out?${q.toString()}`,
        {headers: headers(false)},
    );
    if (!res.ok) {
        throw new Error(await res.text());
    }
    const data = await res.json();
    return data.flights || [];
}

export async function addFlightToGroup(groupId: number, flightNo: string): Promise<void> {
    const res = await fetch(`/api/flight-groups-editor/groups/${groupId}/flights`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({flightNo}),
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
}

export async function removeFlightFromGroup(groupId: number, flightNo: string): Promise<void> {
    const enc = encodeURIComponent(flightNo);
    const res = await fetch(`/api/flight-groups-editor/groups/${groupId}/flights/${enc}`, {
        method: 'DELETE',
        headers: headers(false),
    });
    if (!res.ok) {
        throw new Error(await res.text());
    }
}
