<?php

namespace Vod\LaravelTypedRoutes;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;
use Vod\LaravelTypedRoutes\Commands\TypescriptTransformRoutes;

class LaravelTypedRoutesServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        /*
         * This class is a Package Service Provider
         *
         * More info: https://github.com/spatie/laravel-package-tools
         */
        $package
            ->name('laravel-typed-routes')
            ->hasConfigFile()

            ->hasCommand(TypescriptTransformRoutes::class);
    }
}
