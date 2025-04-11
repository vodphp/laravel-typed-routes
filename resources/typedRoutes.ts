
const METHODS = ['get', 'post', 'put', 'delete'] as const;

function camelToKebabCase(path: string) {
    return path
      .split('')
      .flatMap((char) => {
        if (char === char.toUpperCase() && char !== char.toLowerCase()) {
          return ['-', char.toLowerCase()];
        }
        return char;
      })
      .join('');
  }
  
  function pathFromSegments(segments: PathSegment[], query?: string): string {
    const path = segments
      .map(({ value, type }) => {
        if (type === 'simple') {
          return camelToKebabCase(value);
        }
        return value;
      })
      .join('/');
  
    return `/${query ? `${path}?${query}` : path}`;
  }
  interface PathSegment {
    type: 'simple' | 'parameter';
    value: string;
  }
  

  interface RouteMethods<RequestType, ResponseType> {
    method: 'get' | 'post' | 'put' | 'delete';
    request: RequestType;
    response: ResponseType;
    href: string;
}
  export interface RpcClientOptions {
    pathSegments?: PathSegment[];
  }
  
  type RouteMethodFn = (...args: any[]) => RouteMethods<any, any>;
  
  type Extended<T, E extends Record<string, any>> = {
    [K in keyof T]: T[K] extends RouteMethods<any, any> ? E : 
    T[K] extends RouteMethodFn ? () => ReturnType<T[K]> & E:
    T[K] extends object ? Extended<T[K], E> : T[K]
  }
  
  
  export function typedRoutesClient<T extends object,  API extends Record<string, any>>(extend: (base: RouteMethods<any, any>) => API, options: RpcClientOptions = {pathSegments: []}): Extended<T, API> {
    const pathSegments = options?.pathSegments ?? [];
  
    const definition = {
      get(_: any, prop: any) {
        if (typeof prop !== 'string') {
          throw new Error('Path segments must be strings');
        }
        if (prop === 'href') {
          return pathFromSegments(pathSegments);
        }
  
        const pathSegment = prop.replaceAll('/', '').trim();
        if (!pathSegment) {
          return typedRoutesClient<T, API>(extend, {
            pathSegments,
          });
        }
  
        return typedRoutesClient<T, API>(extend, {
          pathSegments: [...pathSegments, { type: 'simple', value: pathSegment }],
        });
      },
  
      apply: (_: any, __: any, args: any) => {      
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment.type === 'simple' &&  METHODS.includes(lastSegment.value as (typeof METHODS)[number])) {
          const href = pathFromSegments(pathSegments.slice(0, -1));
          let method = lastSegment.value as (typeof METHODS)[number];
          return extend({
            method,
            href
          } as RouteMethods<any, any>)
        }
        return typedRoutesClient<T, API>(extend, {
          pathSegments: [...pathSegments, { type: 'parameter', value: args[0] }],
        });
      },
    };
    
    //@ts-ignore
    return new Proxy<T>(function ignore() {} as T, definition);
  }