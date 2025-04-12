<?php

namespace App\Http\Controllers;

use App\Data\ExampleRequestTypeData;
use App\Data\ExampleResponseTypeData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Vod\LaravelTypedRoutes\Attributes\TypescriptRequestProps;
use Vod\LaravelTypedRoutes\Attributes\TypescriptResponseProps;

class ExampleController extends Controller
{
    #[TypescriptRequestProps('{
        message?: string;
    }')]
    #[TypescriptResponseProps('{
        message: string;
        statusCode: number;
    }')]
    public function manuallyTyped(Request $request)
    {
        return response()->json([
            'message' => $request->input('message') ?? 'Hello, world!',
            'statusCode' => 200,
        ]);
    }

    public function exampleDTO(ExampleRequestTypeData $request): ExampleResponseTypeData
    {
        return new ExampleResponseTypeData(
            message: $request->message,
            createdAt: now(),
        );
    }

    public function exampleForm(ExampleRequestTypeData $request): RedirectResponse
    {
        return back()->withErrors(['form' => 'Woah there!!']);
    }
}
