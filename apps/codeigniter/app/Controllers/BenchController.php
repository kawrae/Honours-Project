<?php

namespace app\Controllers;

use CodeIgniter\Controller;
use Config\Database;

class BenchController extends Controller
{
    public function ping()
    {
        return $this->response->setJSON(['ok' => true]);
    }

    public function db()
    {
        $db = Database::connect();
        $count = $db->table('items')->countAllResults();
        return $this->response->setJSON(['count' => $count]);
    }
}