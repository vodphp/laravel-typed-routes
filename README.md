# laravel-typed-routes

[![Latest Version on Packagist](https://img.shields.io/packagist/v/vod/laravel-typed-routes.svg?style=flat-square)](https://packagist.org/packages/vod/laravel-typed-routes)
[![GitHub Tests Action Status](https://img.shields.io/github/actions/workflow/status/vod/laravel-typed-routes/run-tests.yml?branch=main&label=tests&style=flat-square)](https://github.com/vod/laravel-typed-routes/actions?query=workflow%3Arun-tests+branch%3Amain)
[![GitHub Code Style Action Status](https://img.shields.io/github/actions/workflow/status/vod/laravel-typed-routes/fix-php-code-style-issues.yml?branch=main&label=code%20style&style=flat-square)](https://github.com/vod/laravel-typed-routes/actions?query=workflow%3A"Fix+PHP+code+style+issues"+branch%3Amain)
[![Total Downloads](https://img.shields.io/packagist/dt/vod/laravel-typed-routes.svg?style=flat-square)](https://packagist.org/packages/vod/laravel-typed-routes)

## Installation

You can install the package via composer:

```bash
composer require vod/laravel-typed-routes
```

You can publish and run the migrations with:

```bash
php artisan vendor:publish --tag="laravel-typed-routes-migrations"
php artisan migrate
```

You can publish the config file with:

```bash
php artisan vendor:publish --tag="laravel-typed-routes-config"
```

This is the contents of the published config file:

```php
return [
];
```

Optionally, you can publish the views using

```bash
php artisan vendor:publish --tag="laravel-typed-routes-views"
```

## Usage

```php
$laravelTypedRoutes = new Vod\LaravelTypedRoutes();
echo $laravelTypedRoutes->echoPhrase('Hello, Vod!');
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
