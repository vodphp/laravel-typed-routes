
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
  

  export interface RouteMethods<RequestType, ResponseType> {
    method: 'get' | 'post' | 'put' | 'delete';
    request: RequestType;
    response: ResponseType;
    href: string;
}
  export interface RpcClientOptions {
    pathSegments?: PathSegment[];
  }
  
  
 
  export type ExtensionFunction = (arg: RouteMethods<any, any>) => Record<string, any>;
  
  export function typedRoutesClient<T extends object>(extend: ExtensionFunction, options: RpcClientOptions = {pathSegments: []}): T {
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
          return typedRoutesClient<T>(extend, {
            pathSegments,
          });
        }
  
        return typedRoutesClient<T>(extend, {
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
        return typedRoutesClient<T>(extend, {
          pathSegments: [...pathSegments, { type: 'parameter', value: args[0] }],
        });
      },
    };
    
    //@ts-ignore
    return new Proxy<T>(function ignore() {} as T, definition);
  }