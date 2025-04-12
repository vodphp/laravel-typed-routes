import { typedRoutesClient, RouteMethods } from "./typedRoutes";
import { router, useForm, InertiaFormProps } from "@inertiajs/react";

type API<T extends RouteMethods<any, any>> = {
  visit: (input: T['request']) => void; 
  call: (input: T['request']) => Promise<T['response']>;
  useForm: (initialValues?: T['request']) => Omit<InertiaFormProps<T['request']>, 'submit'> & {
    submit: () => void
  }
}

const extendMethods = (base: RouteMethods<any, any>): API<typeof base> => {

  const href = base.href;
  const method = base.method;

  const call = async (input: typeof base.request): Promise<typeof base.response> => {
    const shouldUseQueryParams = method === 'get';
    const queryParams = shouldUseQueryParams ? new URLSearchParams(input as any) : undefined;
    const hrefWithParams = queryParams ? `${href}?${queryParams.toString()}` : href;

    const res = await fetch(hrefWithParams, {
      method,
      body: shouldUseQueryParams ? undefined : JSON.stringify(input),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (res.ok) {
      return res.json();
    }

    throw new Error(res.statusText, {
      cause: await res.text()
    });
  };
  return {
    visit: (input: typeof base.request) => {router[method](href, input as any)},
    useForm: (initialValues?: typeof base.request): Omit<InertiaFormProps<typeof base.request>, 'submit'> & {
        submit: () => void
      } => {
        const form = useForm<typeof base.request>(initialValues);
        form.submit = () => form[method](href, form.data as any);
        return form;
      },
    call,
  };
};

type RoutesWithAPI<T> = {
  [K in keyof T]: T[K] extends RouteMethods<any, any> ? API<T[K]> : 
  T[K] extends (...args: any[]) => RouteMethods<any, any> ?  () => API<ReturnType<T[K]>> & ReturnType<T[K]> :
  T[K] extends object ? RoutesWithAPI<T[K]> : T[K]
}

export const makeInertiaClient = <T extends object>() => typedRoutesClient<RoutesWithAPI<T>>(extendMethods);