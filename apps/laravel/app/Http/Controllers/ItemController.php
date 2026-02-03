<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index() {
        return Item::all();
    }

    public function show($id){
        return Item::findOrFail($id);
    }

    public function store(Request $request){
        return Item::create(
            $request->only(['name', 'description'])
        );
    }

    public function update(Request $request, $id){
        $item = Item::findOrFail($id);
        $item->update(
            $request->only(['name', 'description'])
        );
        return $item;
    }

    public function destroy($id){
        Item::destroy($id);
        return ['deleted' => true];
    }
}
