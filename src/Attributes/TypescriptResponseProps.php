<?php

namespace Vod\LaravelTypedRoutes\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD)]
class TypescriptResponseProps
{
    public function __construct(
        public string $typescriptType,
    ) {
    }
}
