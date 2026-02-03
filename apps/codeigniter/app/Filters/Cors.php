<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class Cors implements FilterInterface
{
    private array $allowedOrigins = [
        'http://localhost',
        'http://localhost:80',
        'http://bench-ui.local'
    ];

    public function before(RequestInterface $request, $arguments = null)
    {
        if (strtolower($request->getMethod()) === 'options') {
            $origin = $request->getHeaderLine('Origin');
            return service('response')
                ->setHeader('Access-Control-Allow-Origin', $this->originOrBlank($origin))
                ->setHeader('Vary', 'Origin')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->setStatusCode(204);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        $origin = $request->getHeaderLine('Origin');

        if (!$origin) return $response;

        return $response
            ->setHeader('Access-Control-Allow-Origin', $this->originOrBlank($origin))
            ->setHeader('Vary', 'Origin')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    }

    private function originOrBlank(string $origin): string
    {
        return in_array($origin, $this->allowedOrigins, true) ? $origin : '';
    }
}
