<?php

namespace App\Data;

use Illuminate\Support\Carbon;
use Spatie\LaravelData\Data;

/** @typescript */
class ExampleResponseTypeData extends Data
{
    public function __construct(
        public string $message,
        public Carbon $createdAt,
    ) {
    }
}