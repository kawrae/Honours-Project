# Benchmarking Infrastructure

This directory contains all artefacts related to performance testing and benchmarking execution for the Honours Project.

It includes test plans, raw benchmark results, and processed analysis files generated during experimentation.

---

## Structure

- `bench/`
  - `jmeter/` — Apache JMeter test plans (.jmx)
  - `results/`
    - `jmeter/` — Raw JMeter CSV outputs
  - `jmeter_S1_analysis.xlsx` — Processed analysis workbook

---

## Apache JMeter

### Test Plans

- Located in `bench/jmeter/`
- Stored as reusable `.jmx` files
- Shared across all framework implementations

Each JMeter test plan defines:
- Target endpoint and HTTP method
- Request headers and defaults
- Thread group configuration

Only concurrency parameters (number of users and ramp-up period) are modified between runs to ensure experimental consistency.

---

### Benchmark Results

Raw benchmark outputs are exported directly from Apache JMeter as CSV files and stored in:

bench/results/jmeter/

These CSV files are preserved unmodified and represent the primary source of quantitative performance data used in analysis.

---

## Analysis Workbook

- `jmeter_S1_analysis.xlsx`

This Excel workbook aggregates and summarises raw benchmark data for Scenario S1.

It is used to extract and compare:
- Average response time
- Median latency
- 95th percentile latency (P95)
- Throughput under load
- Error rate

All charts and tables presented in the dissertation are derived directly from this workbook.

---

## Role in the Project

The `bench/` directory represents the experimental execution layer of the project.

It provides a clear separation between:
- Test definition
- Raw data collection
- Result processing

This structure supports reproducibility, transparency, and defensible performance analysis.
