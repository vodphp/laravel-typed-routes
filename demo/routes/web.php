<?php

use App\Http\Controllers\ExampleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::prefix('example')->group(function () {
    Route::get('/manually-typed', [ExampleController::class, 'manuallyTyped'])->name('example.manually-typed');
    Route::post('/dto', [ExampleController::class, 'exampleDTO'])->name('example.dto');
    Route::post('/form', [ExampleController::class, 'exampleForm'])->name('example.form');
});

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
