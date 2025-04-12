

import { typedRoutesClient, RouteMethods } from "./typedRoutes";
import { UseQueryOptions, UseQueryResult, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";


type API<T extends RouteMethods<any, any>> = {
    useQuery: (input: T['request'], options?: UseQueryOptions) => UseQueryResult<T['response'], Error>;
    useMutation: (options?: UseMutationOptions | undefined) => UseMutationResult<T['response'], Error>;
    call: (input: T['request']) => Promise<T['response']>;
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
    useQuery: (input: typeof base.request, options?: UseQueryOptions) => {
      return useQuery({
        queryKey: [href, input],
        queryFn: () => call(input),
        ...options,
      });
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

export const makeReactQueryClient = <T extends object>() => typedRoutesClient<RoutesWithAPI<T>>(extendMethods);