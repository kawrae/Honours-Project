<?php

namespace App\Controllers\Api;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ItemModel;

class Items extends ResourceController
{
    protected $format = 'json';

    public function index()
    {
        $model = new ItemModel();
        return $this->respond($model->orderBy('id', 'ASC')->findAll());
    }

    public function show($id = null)
    {
        $model = new ItemModel();
        $item = $model->find($id);

        if (!$item) {
            return $this->failNotFound('Item not found');
        }

        return $this->respond($item);
    }

    public function create()
    {
        $model = new ItemModel();
        $json = $this->request->getJSON(true);

        $data = [
            'name' => $json['name'] ?? null,
            'description' => $json['description'] ?? null,
        ];

        if (!$data['name']) {
            return $this->failValidationErrors('Name is required');
        }

        $model->insert($data);

        return $this->respondCreated($model->find($model->getInsertID()));
    }

    public function update($id = null)
    {
        $model = new ItemModel();
        $item = $model->find($id);

        if (!$item) {
            return $this->failNotFound('Item not found');
        }

        $json = $this->request->getJSON(true);

        $data = [
            'name' => $json['name'] ?? $item['name'],
            'description' => $json['description'] ?? $item['description'],
        ];

        $model->update($id, $data);

        return $this->respond($model->find($id));
    }

    public function delete($id = null)
    {
        $model = new ItemModel();
        $item = $model->find($id);

        if (!$item) {
            return $this->failNotFound('Item not found');
        }

        $model->delete($id);

        return $this->respondDeleted(['message' => 'Item deleted']);
    }
}