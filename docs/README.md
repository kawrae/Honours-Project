# Benchmark Environment Configuration

This document defines the hardware, software, and runtime configuration used for all benchmarking experiments conducted in this project.  
The purpose of this configuration freeze is to ensure fairness, repeatability, and reproducibility across all framework comparisons.

All benchmarks were executed under identical conditions unless explicitly stated otherwise.

---

## Operating System

- Windows 11 Home (Version 25H2, OS Build 26200.7623)

---

## Hardware Environment

- CPU: AMD Ryzen 7 5800X 8-Core Processor
- RAM: 32GB DDR4

---

## Development Stack

- XAMPP: 3.3.0
- Apache: 2.4.58 (Win64)
- PHP: 8.2.12 (Thread Safe)
- Database: MariaDB 10.4.32
- Dependency Manager: Composer 2.2.25

---

## PHP Configuration

- memory_limit: 128M
- max_execution_time: 30
- OPcache: Enabled
- display_errors: Off

---

## Database Configuration

- Storage Engine: InnoDB
- Character Set: utf8mb4
- Collation: utf8mb4_general_ci

---

## Framework Versions

- Laravel: 8.83.29
- Symfony: 6.4.33
- CodeIgniter: 4.6.4
- Yii: 2.0.54

---

## Runtime Configuration

- Debug mode disabled across all frameworks
- Production-equivalent settings used
- No framework-specific performance optimisations applied
- All framework dependencies were installed via Composer and frozen for the duration of benchmarking

---

## Notes on Fairness and Reproducibility

All frameworks interact with the same database schema and dataset.  
Caching, debugging, and logging settings were standardised to minimise variability arising from configuration differences rather than framework architecture.
