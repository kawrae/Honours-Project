<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/bench/ping', fn () =>
    response()->json(['ok' => true])
);

Route::get('/bench/db', function () {
    $count = DB::table('items')->limit(100)->count();
    return response()->json(['count' => $count]);
});
