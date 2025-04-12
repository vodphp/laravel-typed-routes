interface GenericRouteError extends Error {
    response: unknown;
    body: unknown;
    status: number;
}

export interface RouteMethods<RequestType, ResponseType> {
    method: 'get' | 'post' | 'put' | 'delete';
    request: RequestType;
    response: ResponseType;
    href: string;
}

export interface Routes {
    up: {
        get: any;
    };

    example: {
        manuallyTyped: {
            get: () => RouteMethods<
                {
                    message?: string;
                },
                {
                    message: string;
                    statusCode: number;
                }
            >;
        };

        dto: {
            post: () => RouteMethods<App.Data.ExampleRequestTypeData, App.Data.ExampleResponseTypeData>;
        };

        form: {
            post: () => RouteMethods<App.Data.ExampleRequestTypeData, any>;
        };
    };

    '': {
        '': {
            get: any;
        };
    };

    dashboard: {
        get: any;
    };

    settings: {
        get: () => RouteMethods<any, any>;
        post: () => RouteMethods<any, any>;
        put: () => RouteMethods<any, any>;
        patch: () => RouteMethods<any, any>;
        delete: () => RouteMethods<any, any>;
        options: () => RouteMethods<any, any>;
        profile: {
            get: () => RouteMethods<any, any>;
            patch: () => RouteMethods<
                {
                    name: string;
                    email: string;
                    [key: string]: any;
                },
                any
            >;
            delete: () => RouteMethods<any, any>;
        };

        password: {
            get: () => RouteMethods<any, any>;
            put: () => RouteMethods<any, any>;
        };

        appearance: {
            get: any;
        };
    };

    register: {
        get: () => RouteMethods<any, any>;
        post: () => RouteMethods<any, any>;
    };

    login: {
        get: () => RouteMethods<any, any>;
        post: () => RouteMethods<
            {
                email: string;
                password: string;
                [key: string]: any;
            },
            any
        >;
    };

    forgotPassword: {
        get: () => RouteMethods<any, any>;
        post: () => RouteMethods<any, any>;
    };

    resetPassword: {
        token: (param: string | number) => {
            get: () => RouteMethods<any, any>;
        };

        post: () => RouteMethods<any, any>;
    };

    verifyEmail: {
        get: () => RouteMethods<any, any | any>;
        id: (param: string | number) => {
            hash: (param: string | number) => {
                get: () => RouteMethods<any, any>;
            };
        };
    };

    email: {
        verificationNotification: {
            post: () => RouteMethods<any, any>;
        };
    };

    confirmPassword: {
        get: () => RouteMethods<any, any>;
        post: () => RouteMethods<any, any>;
    };

    logout: {
        post: () => RouteMethods<any, any>;
    };

    storage: {
        path: (param: string | number) => {
            get: any;
        };
    };
}
