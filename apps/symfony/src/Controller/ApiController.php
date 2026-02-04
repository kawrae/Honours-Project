<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ApiController extends AbstractController
{
    #[Route('/api/bench/ping', name: 'api_bench_ping', methods: ['GET'])]
    public function ping(): JsonResponse
    {
        return $this->json(['ok' => true]);
    }

    #[Route('/api/bench/db', name: 'api_bench_db', methods: ['GET'])]
    public function db(Connection $conn): JsonResponse
    {
        $count = (int) $conn->fetchOne('SELECT COUNT(*) FROM items');
        return $this->json(['count' => $count]);
    }

    #[Route('/api/items', name: 'api_items_index', methods: ['GET'])]
    public function itemsIndex(Connection $conn): JsonResponse
    {
        $rows = $conn->fetchAllAssociative(
            'SELECT id, name, description, created_at, updated_at FROM items ORDER BY id ASC'
        );

        return $this->json($rows);
    }

    #[Route('/api/items/{id<\d+>}', name: 'api_items_show', methods: ['GET'])]
    public function itemsShow(int $id, Connection $conn): JsonResponse
    {
        $row = $conn->fetchAssociative(
            'SELECT id, name, description, created_at, updated_at FROM items WHERE id = ?',
            [$id]
        );

        if (!$row) {
            return $this->json(['error' => 'Not found'], 404);
        }

        return $this->json($row);
    }

    #[Route('/api/items', name: 'api_items_create', methods: ['POST'])]
    public function itemsCreate(Request $request, Connection $conn): JsonResponse
    {
        $data = json_decode($request->getContent() ?: '[]', true);

        $name = trim((string) ($data['name'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));

        if ($name === '') {
            return $this->json(['error' => 'Name is required'], 422);
        }

        $conn->insert('items', [
            'name' => $name,
            'description' => $description,
        ]);

        $id = (int) $conn->lastInsertId();

        return $this->json(['id' => $id], 201);
    }

    #[Route('/api/items/{id<\d+>}', name: 'api_items_delete', methods: ['DELETE'])]
    public function itemsDelete(int $id, Connection $conn): JsonResponse
    {
        $affected = $conn->executeStatement('DELETE FROM items WHERE id = ?', [$id]);

        if ($affected === 0) {
            return $this->json(['error' => 'Not found'], 404);
        }

        return $this->json(['deleted' => true]);
    }
}
