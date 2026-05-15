import React, {useEffect} from 'react';

import {Checkbox, Dialog, Table} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {I18n} from 'i18n';
import type {WorkbookId} from 'shared';

import Utils from '../../utils/utils';
import DialogManager from '../DialogManager/DialogManager';

export interface DialogAssignClaimsProps {
    entryId: string | null;
    workbookId: WorkbookId;
    collectionId?: string;
    onClose: () => void;
}

const b = block('dl-dialog-need-reset');
const i18n = I18n.keyset('component.open-dialog-assign-claims');

export const DIALOG_ASSIGN_CLAIMS = Symbol('DIALOG_ASSIGN_CLAIMS');

export type OpenDialogAssignClaimsArgs = {
    id: typeof DIALOG_ASSIGN_CLAIMS;
    props?: DialogAssignClaimsProps;
};
function DialogAssignClaims(props: DialogAssignClaimsProps) {
    const [accesses, setAccesses] = React.useState<any>([]);

    const {onClose, entryId, workbookId, collectionId} = props;
    const itemId = collectionId || entryId || workbookId;

    useEffect(() => {
        Utils.getRoles({}).then((_roles) => {
            Utils.getAccesses({id: itemId}).then((_accesses) => {
                const nextRoles = _roles.map(
                    (role: Record<string, unknown> & {role_id: unknown}) => {
                        const accessFiltered = _accesses.filter(
                            (item: any) => item.role_id === role.role_id,
                        );
                        const r = {
                            ...role,
                            add: false,
                            delete: false,
                            select: false,
                            update: false,
                        };
                        accessFiltered.forEach((access: any) => {
                            if (access.add) r.add = true;
                            if (access.delete) r.delete = true;
                            if (access.select) r.select = true;
                            if (access.update) r.update = true;
                        });
                        return r;
                    },
                );
                setAccesses(nextRoles.sort((a: any, b: any) => a.weight - b.weight));
            });
        });
    }, [itemId]);

    function onApply() {
        const arr: Array<any> = [];

        accesses.forEach((item: any) => {
            // const recordRequests = [];
            // const isDestroy = !item.select && !item.add && !item.update && !item.delete;
            // recordRequests.push(Utils.setAccesses({
            //     "id": itemId,
            //     "role_id": item.role_id,
            //     "select": false,
            //     "add": false,
            //     "update": false,
            //     "delete": false,
            //     "destroy": true,
            // }));
            // if (!isDestroy) {
            arr.push({
                id: itemId,
                role_id: item.role_id,
                select: item.select,
                add: item.add,
                update: item.update,
                delete: item.delete,
                destroy: true, //isDestroy
            });
            // }
            // requests.push(Promise.all(recordRequests));
        });
        Utils.setAccesses([arr]).then(() => onClose());
    }

    function onChange(index: number, name: string) {
        return (e: any) => {
            accesses[index][name] = e.target.checked;
            setAccesses([...accesses]);
        };
    }

    const READ_ONLY_ROLE = 'datalens';
    const columns = [
        {id: 'description', name: i18n('role')},
        {
            id: 'select',
            name: i18n('read'),
            template: (item: any, index: number) => (
                <Checkbox
                    onChange={onChange(index, 'select')}
                    defaultChecked={item.select}
                    size="l"
                />
            ),
        },
        {
            id: 'add',
            name: i18n('add'),
            template: (item: any, index: number) => (
                <Checkbox
                    disabled={item.name == READ_ONLY_ROLE}
                    onChange={onChange(index, 'add')}
                    defaultChecked={item.add}
                    size="l"
                />
            ),
        },
        {
            id: 'update',
            name: i18n('update'),
            template: (item: any, index: number) => (
                <Checkbox
                    disabled={item.name == READ_ONLY_ROLE}
                    onChange={onChange(index, 'update')}
                    defaultChecked={item.update}
                    size="l"
                />
            ),
        },
        {
            id: 'delete',
            name: i18n('delete'),
            template: (item: any, index: number) => (
                <Checkbox
                    disabled={item.name == READ_ONLY_ROLE}
                    onChange={onChange(index, 'delete')}
                    defaultChecked={item.delete}
                    size="l"
                />
            ),
        },
    ];

    return (
        <Dialog
            onClose={onClose}
            hasCloseButton={false}
            open={true}
            disableEscapeKeyDown={true}
            disableOutsideClick={true}
            className={b()}
        >
            <Dialog.Header caption={i18n('assign_claims')} />
            <Dialog.Body className={b('content')}>
                <Table data={accesses} columns={columns} />
            </Dialog.Body>
            <Dialog.Footer
                preset={'default'}
                showError={false}
                //listenKeyEnter={false}
                textButtonCancel={i18n('cancel')}
                onClickButtonCancel={onClose}
                textButtonApply={i18n('save')}
                onClickButtonApply={onApply}
                loading={false}
            ></Dialog.Footer>
        </Dialog>
    );
}

DialogManager.registerDialog(DIALOG_ASSIGN_CLAIMS, DialogAssignClaims);
