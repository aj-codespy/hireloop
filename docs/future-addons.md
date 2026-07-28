# Future paid add-ons (plan)

This document lists optional paid services and integrations to consider in future iterations.

- Redis (managed, e.g., AWS ElastiCache, Azure Redis, Upstash): distributed WebSocket per-IP counters, rate-limiting across instances, session locking.
- Sentry / Hosted APM: centralized error tracking and release health monitoring.
- Prometheus + Managed Metrics: long-term metrics storage and dashboards (Grafana Cloud).
- Managed DB backups / read-replicas: for production resilience and zero-downtime migrations.
- E2E test infrastructure (paid device/browser farms or managed runners) for scalable cross-region testing.

Provisioning notes: prefer managed providers with a free tier for staging; plan network/security and IAM access.
