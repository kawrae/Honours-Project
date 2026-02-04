# Framework Implementations

This directory contains the four PHP MVC framework implementations evaluated in this Honours Project.

Each subdirectory represents a **functionally equivalent backend application**, exposing the same REST API endpoints and interacting with the same database schema and dataset. The purpose of this structure is to enable controlled, fair performance comparisons between frameworks under identical conditions.

---

## Included Frameworks

apps/
├── laravel/
├── symfony/
├── codeigniter/
└── yii/


### Laravel
Located in `apps/laravel/`

- Framework version: Laravel 8.x
- Full-stack MVC framework with a rich service container and extensive abstraction layers
- Uses Eloquent ORM for database access

---

### Symfony
Located in `apps/symfony/`

- Framework version: Symfony 6.x
- Modular, component-based MVC framework
- Uses Doctrine ORM for database access

---

### CodeIgniter
Located in `apps/codeigniter/`

- Framework version: CodeIgniter 4.x
- Lightweight MVC framework with minimal abstraction overhead
- Uses the built-in database layer

---

### Yii
Located in `apps/yii/`

- Framework version: Yii 2.x
- High-performance MVC framework with strong code generation support
- Uses Active Record for database access

---

## Functional Parity

All framework implementations provide the same core API functionality, including:

- `GET /api/items` — retrieve all items
- `GET /api/items/{id}` — retrieve a single item
- `POST /api/items` — create a new item

Routes, controllers, and database interactions were implemented to achieve **functional equivalence**, ensuring that performance differences arise from framework architecture rather than application logic.

---

## Configuration and Environment

All applications are configured to:

- Run under identical PHP and Apache settings
- Use the same MariaDB database instance
- Disable debug and development tooling
- Operate in production-equivalent mode during benchmarking

Framework dependencies are managed via Composer and frozen for the duration of benchmarking.

---

## Role in the Project

These applications form the **experimental subjects** of the benchmarking process.  
They are not intended to represent production-ready systems, but rather **controlled test implementations** designed to isolate and evaluate framework-level performance characteristics.

Benchmark execution and result collection are handled separately and can be found in the `bench/` directory.
