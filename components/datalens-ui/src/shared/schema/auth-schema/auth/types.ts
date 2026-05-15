export type SigninArgs = {
    login: string;
    password: string;
};

export type SigninResponse = {
    token: string;
    user?: {
        id: number;
        login: string;
        claims?: string;
    };
    projectId?: string;
};

export type SignupArgs = {
    login: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
};
