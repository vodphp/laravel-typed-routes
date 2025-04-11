<?php

namespace Vod\LaravelTypedRoutes\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @see \Vod\LaravelTypedRoutes\LaravelTypedRoutes
 */
class LaravelTypedRoutes extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return \Vod\LaravelTypedRoutes\LaravelTypedRoutes::class;
    }
}
