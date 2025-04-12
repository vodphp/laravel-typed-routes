# Laravel Typed Routes - TRPC style routes for Laravel

[![Latest Version on Packagist](https://img.shields.io/packagist/v/vod/laravel-typed-routes.svg?style=flat-square)](https://packagist.org/packages/vod/laravel-typed-routes)
[![GitHub Tests Action Status](https://img.shields.io/github/actions/workflow/status/vod/laravel-typed-routes/run-tests.yml?branch=main&label=tests&style=flat-square)](https://github.com/vod/laravel-typed-routes/actions?query=workflow%3Arun-tests+branch%3Amain)
[![GitHub Code Style Action Status](https://img.shields.io/github/actions/workflow/status/vod/laravel-typed-routes/fix-php-code-style-issues.yml?branch=main&label=code%20style&style=flat-square)](https://github.com/vod/laravel-typed-routes/actions?query=workflow%3A"Fix+PHP+code+style+issues"+branch%3Amain)
[![Total Downloads](https://img.shields.io/packagist/dt/vod/laravel-typed-routes.svg?style=flat-square)](https://packagist.org/packages/vod/laravel-typed-routes)

## Introduction

This package generates TypeScript types from your Laravel routes, and provides an
extensible client for interacting with the routes in a type safe way. 
It relies on the fantastic Spatie Typescript Transformer under the hood.

## Installation

You can install the package via composer:

```bash
composer require vod/laravel-typed-routes
```

You can publish the config file with:

```bash
php artisan vendor:publish --tag="laravel-typed-routes-config"
```

This is the contents of the published config file:

```php
return [
    'output_path' => 'resources/routes.d.ts',
];
```
This defines where the generated types will be output.

## Generating Types

```bash
php artisan typescript:transform-routes
```

This will generate the types and output them to the path defined in the config file. It's recommended
That you run this on save or as a part of your front end dev tooling, so that types are kept up to date.

## Setup with Typescript

Setup is easy! In your project, you'll need to setup an rpc client, something as simple as this;

```ts
/**
 * This puts together the client with the route types. Depending on where you 
 * publish the routes, and where this file is, you may need to adjust the import.
 * 
 */
import { Routes } from "./types/routes";

//... A basic client, only exposes a basic fetch wrapper;
import { makeBasicClient } from "../../vendor/vod/laravel-typed-routes/js/basicClient";
//... Expects React Query to be installed, and exposes `useQuery` and `useMutation` methods;
import {makeReactQueryClient} from "../../vendor/vod/laravel-typed-routes/js/reactQueryClient";
//... Expects Inertia to be installed, and exposes `useForm` and `visit` methods;
import { makeInertiaClient } from "../../vendor/vod/laravel-typed-routes/js/inertiaClient";
//... Expects React Query and Inertia to be installed, and exposes `useQuery`, `useMutation`, `useForm`, and `usePage` methods;
import { makeFullClient } from "../../vendor/vod/laravel-typed-routes/js/fullClient";

//... Create the client - swap out the client that best suits your needs, or copy any of the clients to extend or modify as you like!
export const routes = makeFullClient<Routes>();
```
Depending on your project, you will need to adjust the paths for the imports.

## Using the client

### Route navigation

This library automatically converts routes to a type path. For example, the following 
laravel routes would be accessible as;

```php
Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/example/{id}/hello', [ExampleController::class, 'hello'])->name('example.hello');
Route::put('/example/{id}/update', [ExampleController::class, 'update'])->name('example.update');

```

```ts
// Routes are automatically converted to a type path. 
routes.dashboard.get()
routes.example.id(idGoesHere).hello.get()
routes.example.id(idGoesHere).update.put()
```

The API chosen will determine the methods available. For example, the full client
exposes `useQuery`, `useMutation`, `useForm`, and `usePage` methods, so you can
use these methods to interact with the routes like this;


### Basic fetch

```ts
const response = await routes.example.id(idGoesHere).hello.get().call({
    message: 'Hello, world!',
});
```

### Inertia


```ts

 //Inside a component
 //use Form to update data on the route;
 const {submit, data, setData} = routes.example.id(idGoesHere).update.post().useForm({
    message: 'hello world',
});

const goToDashboard = () => {
    /**The "visit" method calls the inertia router with the full path,
     * the appropriate method, and any data you want to pass. */
    routes.dashboard.get().visit({success: true});
}
```

### @tanstack/react-query

```ts


//Inside a component
//use Query to fetch data from the route;
const { data, isLoading, error } = routes.example.id(idGoesHere).hello.get().useQuery({
    message: 'Hello, world!',
});

//use Mutation to update data on the route;
const { mutate, isLoading, error } = routes.example.id(idGoesHere).update.put().useMutation({
});

mutate({
    message: 'hello world'
})
```

## Testing

```bash
composer test
```

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security Vulnerabilities

Please review [our security policy](../../security/policy) on how to report security vulnerabilities.

## Credits

- [Dean McPherson](https://github.com/deanmcpherson)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
