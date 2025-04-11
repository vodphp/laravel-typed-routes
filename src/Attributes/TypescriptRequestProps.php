<?php

namespace Vod\LaravelTypedRoutes\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class TypescriptRequestProps
{
    public function __construct(
        public string $typescriptType,
    ) {}
}
