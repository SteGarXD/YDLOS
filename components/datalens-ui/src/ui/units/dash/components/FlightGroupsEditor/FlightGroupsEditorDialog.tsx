import React from 'react';

import {Xmark} from '@gravity-ui/icons';
import {Button, Dialog, Icon, TextInput} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import {useDispatch} from 'react-redux';
import {showToast} from 'ui/store/actions/toaster';

import {
    type FlightGroupRow,
    addFlightToGroup,
    createGroup,
    deleteGroup,
    fetchFlightsIn,
    fetchFlightsOut,
    fetchGroups,
    removeFlightFromGroup,
    updateGroup,
} from '../../api/flightGroupsEditorApi';

import './FlightGroupsEditorDialog.scss';

const b = block('flight-groups-editor-dialog');
const i18n = I18n.keyset('dash.flight-groups-editor.view');

type Props = {
    open: boolean;
    onClose: (changed?: boolean) => void;
};

/** Клик по рейсу переключает его в наборе выбранных (несколько подряд — без Ctrl). */
function toggleFlightSelection(prev: Set<string>, flight: string): Set<string> {
    const next = new Set(prev);
    if (next.has(flight)) {
        next.delete(flight);
    } else {
        next.add(flight);
    }
    return next;
}

export const FlightGroupsEditorDialog: React.FC<Props> = ({open, onClose}) => {
    const dispatch = useDispatch();
    const hasChangesRef = React.useRef(false);
    const [groups, setGroups] = React.useState<FlightGroupRow[]>([]);
    const [selectedGroupId, setSelectedGroupId] = React.useState<number | null>(null);
    const [nameInput, setNameInput] = React.useState('');
    const [filterIn, setFilterIn] = React.useState('');
    const [filterOut, setFilterOut] = React.useState('');
    const [flightsIn, setFlightsIn] = React.useState<string[]>([]);
    const [flightsOut, setFlightsOut] = React.useState<string[]>([]);
    const [selectedIn, setSelectedIn] = React.useState<Set<string>>(() => new Set());
    const [selectedOut, setSelectedOut] = React.useState<Set<string>>(() => new Set());
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            return;
        }
        hasChangesRef.current = false;
        // Каждый раз открываем редактор "с чистого листа" по локальному UI-состоянию.
        setNameInput('');
        setFilterIn('');
        setFilterOut('');
        setSelectedIn(new Set());
        setSelectedOut(new Set());
        setFlightsIn([]);
        setFlightsOut([]);
        setSelectedGroupId(null);
        const {body, documentElement} = document;
        const prevBodyOverflow = body.style.overflow;
        const prevHtmlOverflowY = documentElement.style.overflowY;

        // Блокируем фон, но сохраняем "резерв" под вертикальный скроллбар,
        // чтобы фиксированный хедер не прыгал по X при открытии модалки.
        documentElement.style.overflowY = 'scroll';
        body.style.overflow = 'hidden';

        return () => {
            body.style.overflow = prevBodyOverflow;
            documentElement.style.overflowY = prevHtmlOverflowY;
        };
    }, [open]);

    const reloadGroups = React.useCallback(async () => {
        const list = await fetchGroups();
        setGroups(list);
        return list;
    }, []);

    const handleRequestClose = React.useCallback(() => {
        onClose(hasChangesRef.current);
    }, [onClose]);

    React.useEffect(() => {
        if (!open) {
            return () => {};
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const list = await reloadGroups();
                if (cancelled) {
                    return;
                }
                // На новое открытие всегда выбираем первый элемент текущего списка.
                setSelectedGroupId(list[0]?.id ?? null);
            } catch (e) {
                dispatch(
                    showToast({
                        title: i18n('toast_load_error'),
                        error: e instanceof Error ? e : new Error(String(e)),
                    }),
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, reloadGroups, dispatch]);

    React.useEffect(() => {
        if (!open || selectedGroupId === null) {
            return () => {};
        }
        let cancelled = false;
        (async () => {
            try {
                const [fin, fout] = await Promise.all([
                    fetchFlightsIn(selectedGroupId, filterIn),
                    fetchFlightsOut(selectedGroupId, filterOut),
                ]);
                if (!cancelled) {
                    setFlightsIn(fin);
                    setFlightsOut(fout);
                }
            } catch (e) {
                dispatch(
                    showToast({
                        title: i18n('toast_load_error'),
                        error: e instanceof Error ? e : new Error(String(e)),
                    }),
                );
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, selectedGroupId, filterIn, filterOut, dispatch]);

    React.useEffect(() => {
        setSelectedIn(new Set());
        setSelectedOut(new Set());
    }, [selectedGroupId, filterIn, filterOut]);

    const handleAddGroup = async () => {
        const name = nameInput.trim();
        if (!name) {
            return;
        }
        try {
            const id = await createGroup(name);
            hasChangesRef.current = true;
            await reloadGroups();
            setSelectedGroupId(id);
            setNameInput('');
        } catch (e) {
            dispatch(
                showToast({
                    title: i18n('toast_save_error'),
                    error: e instanceof Error ? e : new Error(String(e)),
                }),
            );
        }
    };

    const handleDeleteGroup = async () => {
        if (selectedGroupId === null) {
            return;
        }
        try {
            await deleteGroup(selectedGroupId);
            hasChangesRef.current = true;
            const list = await reloadGroups();
            setSelectedGroupId(list[0]?.id ?? null);
        } catch (e) {
            dispatch(
                showToast({
                    title: i18n('toast_save_error'),
                    error: e instanceof Error ? e : new Error(String(e)),
                }),
            );
        }
    };

    const handleRenameGroup = async () => {
        if (selectedGroupId === null) {
            return;
        }
        const name = nameInput.trim();
        if (!name) {
            return;
        }
        try {
            await updateGroup(selectedGroupId, name);
            hasChangesRef.current = true;
            await reloadGroups();
        } catch (e) {
            dispatch(
                showToast({
                    title: i18n('toast_save_error'),
                    error: e instanceof Error ? e : new Error(String(e)),
                }),
            );
        }
    };

    const refreshFlights = async () => {
        if (selectedGroupId === null) {
            return;
        }
        const [fin, fout] = await Promise.all([
            fetchFlightsIn(selectedGroupId, filterIn),
            fetchFlightsOut(selectedGroupId, filterOut),
        ]);
        setFlightsIn(fin);
        setFlightsOut(fout);
    };

    const handleMoveOut = async () => {
        if (selectedGroupId === null || selectedIn.size === 0) {
            return;
        }
        const flightNos = [...selectedIn];
        try {
            await Promise.all(flightNos.map((fn) => removeFlightFromGroup(selectedGroupId, fn)));
            hasChangesRef.current = true;
            setSelectedIn(new Set());
            await refreshFlights();
        } catch (e) {
            dispatch(
                showToast({
                    title: i18n('toast_save_error'),
                    error: e instanceof Error ? e : new Error(String(e)),
                }),
            );
        }
    };

    const handleMoveIn = async () => {
        if (selectedGroupId === null || selectedOut.size === 0) {
            return;
        }
        const flightNos = [...selectedOut];
        try {
            await Promise.all(flightNos.map((fn) => addFlightToGroup(selectedGroupId, fn)));
            hasChangesRef.current = true;
            setSelectedOut(new Set());
            await refreshFlights();
        } catch (e) {
            dispatch(
                showToast({
                    title: i18n('toast_save_error'),
                    error: e instanceof Error ? e : new Error(String(e)),
                }),
            );
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleRequestClose}
            size="m"
            contentOverflow="auto"
            disableBodyScrollLock
            hasCloseButton={false}
            className={b()}
            modalClassName={b('modal')}
        >
            <Dialog.Body>
                <div className={b('title-strip')}>
                    <span className={b('title-text')}>{i18n('title_dialog')}</span>
                    <button
                        type="button"
                        className={b('title-close')}
                        onClick={handleRequestClose}
                        aria-label={i18n('button_close')}
                    >
                        <Icon data={Xmark} size={14} />
                    </button>
                </div>
                <div className={b('body-inner')}>
                    <div className={b('toolbar')}>
                        <TextInput
                            className={b('name-field')}
                            pin="brick-brick"
                            value={nameInput}
                            onUpdate={setNameInput}
                            placeholder={i18n('placeholder_group_name')}
                            size="m"
                        />
                        <div className={b('toolbar-actions')}>
                            <Button
                                className={b('btn-toolbar')}
                                view="normal"
                                pin="brick-brick"
                                size="m"
                                onClick={handleAddGroup}
                            >
                                {i18n('button_add')}
                            </Button>
                            <Button
                                className={b('btn-toolbar')}
                                view="normal"
                                pin="brick-brick"
                                size="m"
                                onClick={handleDeleteGroup}
                                disabled={!selectedGroupId}
                            >
                                {i18n('button_delete')}
                            </Button>
                            <Button
                                className={b('btn-toolbar')}
                                view="normal"
                                pin="brick-brick"
                                size="m"
                                onClick={handleRenameGroup}
                                disabled={!selectedGroupId}
                            >
                                {i18n('button_replace')}
                            </Button>
                        </div>
                    </div>
                    <div className={b('main-grid')}>
                        <div className={b('head-spacer')} aria-hidden />
                        <div className={b('head-title', {in: true})}>
                            {i18n('label_flights_in')}
                        </div>
                        <div className={b('head-spacer', {mid: true})} aria-hidden />
                        <div className={b('head-title', {out: true})}>
                            {i18n('label_flights_out')}
                        </div>

                        <div className={b('pane-groups')}>
                            <div className={b('list')} role="listbox" aria-multiselectable={false}>
                                {groups.map((g) => (
                                    <button
                                        type="button"
                                        key={g.id}
                                        className={b('list-item', {
                                            active: g.id === selectedGroupId,
                                        })}
                                        onClick={() => setSelectedGroupId(g.id)}
                                    >
                                        {g.groupName}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={b('pane-in')}>
                            <div className={b('list')} role="listbox" aria-multiselectable>
                                {flightsIn.map((f) => (
                                    <button
                                        type="button"
                                        key={f}
                                        className={b('list-item', {active: selectedIn.has(f)})}
                                        onClick={() =>
                                            setSelectedIn((prev) => toggleFlightSelection(prev, f))
                                        }
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={b('shuttle')}>
                            <button
                                type="button"
                                className={b('shuttle-btn')}
                                onClick={handleMoveOut}
                                disabled={selectedIn.size === 0}
                                title={i18n('button_remove_flight')}
                            >
                                &gt;
                            </button>
                            <button
                                type="button"
                                className={b('shuttle-btn')}
                                onClick={handleMoveIn}
                                disabled={selectedOut.size === 0}
                                title={i18n('button_add_flight')}
                            >
                                &lt;
                            </button>
                        </div>
                        <div className={b('pane-out')}>
                            <div className={b('list')} role="listbox" aria-multiselectable>
                                {flightsOut.map((f) => (
                                    <button
                                        type="button"
                                        key={f}
                                        className={b('list-item', {active: selectedOut.has(f)})}
                                        onClick={() =>
                                            setSelectedOut((prev) => toggleFlightSelection(prev, f))
                                        }
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={b('foot-spacer')} aria-hidden />
                        <div className={b('foot-filter', {in: true})}>
                            <TextInput
                                className={b('filter-input')}
                                pin="brick-brick"
                                value={filterIn}
                                onUpdate={setFilterIn}
                                size="s"
                            />
                            <Button
                                className={b('btn-clear')}
                                view="normal"
                                pin="brick-brick"
                                size="s"
                                onClick={() => setFilterIn('')}
                                title={i18n('button_clear_filter')}
                            >
                                <Icon data={Xmark} size={16} />
                            </Button>
                        </div>
                        <div className={b('foot-spacer', {mid: true})} aria-hidden />
                        <div className={b('foot-filter', {out: true})}>
                            <TextInput
                                className={b('filter-input')}
                                pin="brick-brick"
                                value={filterOut}
                                onUpdate={setFilterOut}
                                size="s"
                            />
                            <Button
                                className={b('btn-clear')}
                                view="normal"
                                pin="brick-brick"
                                size="s"
                                onClick={() => setFilterOut('')}
                                title={i18n('button_clear_filter')}
                            >
                                <Icon data={Xmark} size={16} />
                            </Button>
                        </div>
                    </div>
                    <div className={b('footer')}>
                        <Button
                            className={`${b('btn-toolbar')} ${b('btn-close')}`}
                            view="normal"
                            pin="brick-brick"
                            size="m"
                            onClick={handleRequestClose}
                            loading={loading}
                        >
                            {i18n('button_close')}
                        </Button>
                    </div>
                </div>
            </Dialog.Body>
        </Dialog>
    );
};
