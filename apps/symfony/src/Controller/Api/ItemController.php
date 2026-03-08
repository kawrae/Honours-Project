<?php

namespace App\Controller\Api;

use App\Entity\Item;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ItemController extends AbstractController
{
    #[Route('/api/items', methods: ['GET'])]
    public function index(EntityManagerInterface $em): JsonResponse
    {
        $items = $em->getRepository(Item::class)->findBy([], ['id' => 'ASC']);
        $data = array_map(fn(Item $item) => $item->toArray(), $items);

        return $this->json($data);
    }

    #[Route('/api/items/{id}', methods: ['GET'])]
    public function show(int $id, EntityManagerInterface $em): JsonResponse
    {
        $item = $em->getRepository(Item::class)->find($id);

        if (!$item) {
            return $this->json(['message' => 'Item not found'], 404);
        }

        return $this->json($item->toArray());
    }

    #[Route('/api/items', methods: ['POST'])]
    public function store(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $payload = json_decode($request->getContent(), true);

        if (empty($payload['name'])) {
            return $this->json(['message' => 'Name is required'], 422);
        }

        $item = new Item();
        $item->setName($payload['name']);
        $item->setDescription($payload['description'] ?? null);
        $item->setCreatedAt(new \DateTime());
        $item->setUpdatedAt(new \DateTime());

        $em->persist($item);
        $em->flush();

        return $this->json($item->toArray(), 201);
    }

    #[Route('/api/items/{id}', methods: ['PUT'])]
    public function update(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $item = $em->getRepository(Item::class)->find($id);

        if (!$item) {
            return $this->json(['message' => 'Item not found'], 404);
        }

        $payload = json_decode($request->getContent(), true);

        if (isset($payload['name'])) {
            $item->setName($payload['name']);
        }

        if (array_key_exists('description', $payload)) {
            $item->setDescription($payload['description']);
        }

        $item->setUpdatedAt(new \DateTime());

        $em->flush();

        return $this->json($item->toArray());
    }

    #[Route('/api/items/{id}', methods: ['DELETE'])]
    public function destroy(int $id, EntityManagerInterface $em): JsonResponse
    {
        $item = $em->getRepository(Item::class)->find($id);

        if (!$item) {
            return $this->json(['message' => 'Item not found'], 404);
        }

        $em->remove($item);
        $em->flush();

        return $this->json(['message' => 'Item deleted']);
    }
}