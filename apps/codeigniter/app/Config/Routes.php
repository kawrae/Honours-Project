<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', function($routes) {
    $routes->get('items', 'Api\Items::index');
    $routes->get('items/(:num)', 'Api\Items::show/$1');
    $routes->post('items', 'Api\Items::create');
    $routes->put('items/(:num)', 'Api\Items::update/$1');
    $routes->delete('items/(:num)', 'Api\Items::delete/$1');
});