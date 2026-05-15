import React from 'react';

import type {TableCommonCell} from 'shared';

/** Direct +/- toggle from the button; avoids relying on bubbling to td (CSS grid + rowspan). */
export const FlatTableRowTreeToggleContext = React.createContext<
    ((cell: TableCommonCell) => void) | null
>(null);
