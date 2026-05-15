import type {IconData} from '@gravity-ui/uikit';

export type CustomSigninProps = {
    setToken: (token: string) => void;
    /** Лого на форме входа. Если не передан — используется логика платформы (ребрандинг / дефолт). */
    logoIcon?: IconData | string;
};
