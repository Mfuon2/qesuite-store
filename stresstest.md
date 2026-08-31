# API Load and Stress Test Report

**Date:** 2026-08-26  
**Target:** Local Wrangler Worker API at `http://127.0.0.1:8787`  
**Runtime:** macOS, Apple M5, local Wrangler/`workerd`, local Cloudflare D1  
**Test duration:** 10 seconds per concurrency level  
**SLO used for interpretation:** less than 500 ms p95 latency and less than 1% errors

## Executive result

For the tested read-heavy storefront workload, the local application sustained **50 concurrent virtual users** while meeting the SLO. At 100 concurrent users, the test crossed the SLO because p95 latency reached 544.7 ms and errors reached 2.23%. At 200 concurrent users, p95 reached 837.4 ms and errors reached 4.63%.

This means **50 concurrent active users is the measured safe baseline for this exact local workload**, not a universal application limit. It is a conservative starting point for capacity planning until authenticated, write-heavy, multi-tenant tests are added.

## Workload simulated

Each virtual user repeatedly performed this sequence until the 10-second level ended:

1. `GET /api/storefront`
2. `GET /api/storefront/sweet`
3. `GET /api/storefront/sweet/categories`
4. `GET /api/storefront/sweet/products`
5. `GET /api/store/check-slug/load-test-store`

Requests were made concurrently per user, with a 10–25 ms think-time between screen transitions. Responses were fully consumed so connection reuse and response-body work were included. The test used unique `CF-Connecting-IP` values per simulated user.

This is a read-only, public storefront scenario. It does **not** claim to measure authenticated dashboard writes, order creation, POS sales, expenses, image uploads, payments, queue delivery, or concurrent password verification.

## Measured results

| Concurrent users | Requests | Requests/sec | p50 | p95 | p99 | Errors | Error rate | >500 ms |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1,875 | 187.5 | 4.6 ms | 7.3 ms | 17.0 ms | 0 | 0.00% | 0.00% |
| 10 | 14,240 | 1,424.0 | 11.0 ms | 34.2 ms | 52.0 ms | 0 | 0.00% | 0.00% |
| 25 | 13,485 | 1,348.5 | 62.5 ms | 132.3 ms | 194.3 ms | 0 | 0.00% | 0.00% |
| 50 | 16,085 | 1,608.5 | 125.7 ms | 202.0 ms | 310.9 ms | 58 | 0.36% | 0.00% |
| 100 | 13,625 | 1,362.5 | 351.7 ms | 544.7 ms | 571.8 ms | 304 | 2.23% | 11.05% |
| 200 | 16,815 | 1,681.5 | 610.6 ms | 837.4 ms | 886.6 ms | 778 | 4.63% | 79.16% |

The error count includes any non-2xx response or failed request. Because this is local Wrangler/D1, occasional errors at the highest levels should be investigated rather than treated as a production Cloudflare failure rate.

## Interpretation

- **Reliable tested point:** 25 concurrent users, 0% errors, p95 132.3 ms.
- **Maximum tested SLO point:** 50 concurrent users, p95 202.0 ms and 0.36% errors.
- **First failed SLO point:** 100 concurrent users, p95 above 500 ms and error rate above 1%.
- **Stress behavior:** 200 concurrent users still completed substantial traffic, but queueing and latency were no longer suitable for interactive use.

The synthetic request rate is intentionally aggressive: a user issued five API requests per screen transition and repeated continuously. Normal human users will have much longer think times, so the number of logged-in people present at once can be higher than this measured “actively requesting” concurrency. Conversely, a dashboard refresh storm, POS burst, or order campaign can be much heavier than the tested read-only flow.

## Cloudflare Workers + D1 expectation

The local result cannot be converted directly into a production user count. Production response time will include client-to-edge network latency, while Cloudflare Workers can execute close to users and D1 is managed infrastructure. Reads should generally be more stable than this local single-process test, but D1 query latency, database size, indexes, plan limits, and write contention will determine the real ceiling.

For initial planning, use these deliberately conservative targets until a staging deployment is measured:

- **50–100 actively requesting concurrent users per Worker/API deployment** for this read-heavy flow, subject to regional latency and plan limits.
- Expect ordinary human sessions to represent more total connected users because they are not continuously issuing requests.
- Treat order creation, POS sales, stock updates, expenses, and payment callbacks as a separate capacity class; they are writes and require contention/atomicity testing.
- Keep D1 queries indexed and bounded, avoid unbounded lists, and monitor Worker CPU time, D1 duration, 5xx/429 rate, p95/p99 latency, and queue backlog.

Only a staging or production-like Cloudflare test can establish a deployable SLA. Load testing a live production database should use an isolated tenant/database and synthetic accounts.

## Recommended next tests

1. Add authenticated sessions with seeded test users and run dashboard reads (`analytics`, orders, products, settings, access).
2. Run a write scenario: create order → update status → record payment → create expense → adjust stock.
3. Test mixed traffic (for example 70% reads, 25% writes, 5% auth) at 25, 50, 100, and 200 users.
4. Repeat against a Cloudflare staging Worker and D1 database from Nairobi and at least one non-East-African region.
5. Add a 15–30 minute soak test to detect memory growth, rate-limit bucket behavior, D1 lock contention, and queue buildup.
6. Compare p50/p95/p99 and error classes by route; a single aggregate number can hide one slow endpoint.

## Reproducibility

The temporary harness used for this run was `api-load-test.ts` and was removed after execution. It used environment variables for the base URL, duration, and concurrency levels. The local Worker was already listening on port 8787; no production endpoint or external payment/SMS service was exercised.

