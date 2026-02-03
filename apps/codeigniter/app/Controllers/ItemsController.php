<?php

namespace App\Controllers;

use CodeIgniter\Controller;
use Config\Database;

class ItemsController extends Controller
{
    private $db;
    private $table;

    public function __construct()
    {
        $this->db = Database::connect();
        $this->table = $this->db->table('items');
    }

    public function index()
    {
        $items = $this->table->get()->getResultArray();

        $items = array_map(function ($row) {
            $row['id'] = (int) $row['id'];
            return $row;
        }, $items);

        return $this->response->setJSON($items);
    }

    public function show($id)
    {
        $item = $this->table->where('id', (int)$id)->get()->getRowArray();
        if (!$item) {
            return $this->response->setStatusCode(404)->setJSON(['message' => 'Not Found']);
        }
        return $this->response->setJSON($item);
    }

    public function store()
    {
        $data = $this->request->getJSON(true) ?? $this->request->getPost();

        $insert = [
            'name' => $data['name'] ?? null,
            'description' => $data['description'] ?? null,
            'created_at' => gmdate('Y-m-d H:i:s'),
            'updated_at' => gmdate('Y-m-d H:i:s'),
        ];

        $this->table->insert($insert);
        $id = $this->db->insertID();

        $item = $this->table->where('id', (int)$id)->get()->getRowArray();
        return $this->response->setStatusCode(201)->setJSON($item);
    }

    public function update($id)
    {
        $data = $this->request->getJSON(true) ?? $this->request->getRawInput();

        $exists = $this->table->where('id', (int)$id)->get()->getRowArray();
        if (!$exists) {
            return $this->response->setStatusCode(404)->setJSON(['message' => 'Not Found']);
        }

        $update = [
            'name' => $data['name'] ?? $exists['name'],
            'description' => $data['description'] ?? $exists['description'],
            'updated_at' => gmdate('Y-m-d H:i:s'),
        ];

        $this->table->where('id', (int)$id)->update($update);

        $item = $this->table->where('id', (int)$id)->get()->getRowArray();
        return $this->response->setJSON($item);
    }

    public function destroy($id)
    {
        $exists = $this->table->where('id', (int)$id)->get()->getRowArray();
        if (!$exists) {
            return $this->response->setStatusCode(404)->setJSON(['message' => 'Not Found']);
        }

        $this->table->where('id', (int)$id)->delete();
        return $this->response->setJSON(['deleted' => true]);
    }
}
