import {  useMutation, UseMutationOptions, UseMutationResult, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { router, useForm, InertiaFormProps } from "@inertiajs/react";
import { Routes } from "./types/routes";
import { typedRoutesClient } from "../../vendor/vod/laravel-typed-routes/resources/typedRoutes";

const addMethods = (base: {href: string, method: 'get' | 'post' | 'put' | 'delete'}) => {

  const href = base.href;
  const method = base.method;

  const call = async (input: any) => {
    const shouldUseQueryParams = method === 'get';
    const queryParams = shouldUseQueryParams ? new URLSearchParams(input) : undefined;
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
    visit: (input: any) => {router[method](href, input)},
    useQuery: (input: any, options?: UseQueryOptions) => {
      return useQuery({
        queryKey: [href, input],
        queryFn: call,
        ...options,
      });
    },
    doTheThing: () => {
      return 'hello';
    },
    useForm: (initialValues?: any): Omit<InertiaFormProps<any>, 'submit'> & {
      submit: () => void
    } => {
      const form = useForm<any>(initialValues);
      form.submit = () => form[method](href, form.data);
      return form;
    },
    useMutation: (options?: UseMutationOptions | undefined) => {
      return useMutation({
        mutationFn: call,
        ...options,
      }) as UseMutationResult<any>;
    },
    call,
  };
}

export const routes = typedRoutesClient<Routes, ReturnType<typeof addMethods>>(addMethods);