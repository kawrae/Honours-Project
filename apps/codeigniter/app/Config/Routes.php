<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', function($routes) {
    $routes->get('bench/ping', 'BenchController::ping');
    $routes->get('bench/db', 'BenchController::db');

    $routes->get('items', 'ItemsController::index');
    $routes->get('items/(:num)', 'ItemsController::show/$1');
    $routes->post('items', 'ItemsController::store');
    $routes->put('items/(:num)', 'ItemsController::update/$1');
    $routes->delete('items/(:num)', 'ItemsController::destroy/$1');
});