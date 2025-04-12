

import { typedRoutesClient, RouteMethods } from "./typedRoutes";
import { UseQueryOptions, UseQueryResult, UseMutationOptions, UseMutationResult, useQuery, useMutation } from "@tanstack/react-query";
import { router, useForm, InertiaFormProps } from "@inertiajs/react";

type API<T extends RouteMethods<any, any>> = {
    visit: (input: T['request']) => void;
    useQuery: (input: T['request'], options?: UseQueryOptions) => UseQueryResult<T['response'], Error>;
    useMutation: (options?: UseMutationOptions | undefined) => UseMutationResult<T['response'], Error>;
    call: (input: T['request']) => Promise<T['response']>;
    doTheThing: () => string;
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
    useQuery: (input: typeof base.request, options?: UseQueryOptions) => {
      return useQuery({
        queryKey: [href, input],
        queryFn: () => call(input),
        ...options,
      });
    },
    doTheThing: () => {
      return 'hello';
    },
    useForm: (initialValues?: typeof base.request): Omit<InertiaFormProps<typeof base.request>, 'submit'> & {
      submit: () => void
    } => {
      const form = useForm<typeof base.request>(initialValues);
      form.submit = () => form[method](href, form.data as any);
      return form;
    },
    useMutation: (options?: UseMutationOptions | undefined) => {
      return useMutation({
      
        ...options,
      }) as UseMutationResult<typeof base.response>;
    },
    call,
  };
};

type RoutesWithAPI<T> = {
  [K in keyof T]: T[K] extends RouteMethods<any, any> ? API<T[K]> : 
  T[K] extends (...args: any[]) => RouteMethods<any, any> ?  () => API<ReturnType<T[K]>> & ReturnType<T[K]> :
  T[K] extends object ? RoutesWithAPI<T[K]> : T[K]
}

export const makeFullClient = <T extends object>() => typedRoutesClient<RoutesWithAPI<T>>(extendMethods);