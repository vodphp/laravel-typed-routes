<?php

namespace App\Data;

use Spatie\LaravelData\Data;

/** @typescript */
class ExampleRequestTypeData extends Data
{
    public function __construct(
        public string $message,
        public ?string $name,
        public ?string $email,
    ) {
        
    }
}