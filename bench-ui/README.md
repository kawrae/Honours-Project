## Test UI (Auxiliary Benchmark Visualisation)

In addition to formal load testing conducted using Apache JMeter and Locust, a lightweight frontend user interface was developed to assist with **manual testing, request parity verification, and exploratory visualisation** during development.

This UI was not used to collect quantitative benchmark results and does not form part of the formal performance evaluation presented in the dissertation. All measured results are derived exclusively from controlled load testing tools.

### Purpose

The test UI was created to:

- Manually trigger API endpoints during development
- Verify functional parity across framework implementations
- Visualise request responses and latency in real time
- Provide an intuitive way to inspect benchmark behaviour during experimentation

The interface was developed as a supporting tool to aid understanding and debugging, rather than as a performance measurement instrument.

### Hosting and Deployment

During development, the test UI is hosted locally via Apache at:
**localhost/bench-ui**
The live version resides within the local web server (`htdocs`) for execution.  
The `bench/bench-ui/` directory within this repository contains a **replicated copy** of the UI source code for version control, documentation, and reproducibility purposes.

No production deployment is required, and the UI is not accessed during automated benchmark execution.

### Scope Clarification

While this project primarily focuses on backend framework performance, the inclusion of a small frontend component provided practical benefits during development without influencing experimental results.

All performance comparisons and conclusions are based solely on backend metrics collected under identical, controlled conditions.



