# k6 Load Testing

## Quick Start
```bash
# Ensure the FastAPI backend is running on port 8000
cd apps/api && python main.py

# In another terminal, run the load test
k6 run tests/load/api_health.js
```

## Tests

| Script | Description | VUs | Duration |
|--------|-------------|-----|----------|
| `api_health.js` | Health check + Job CRUD + Webhook listing | 5-10 | 40s |

## Environment Variables
- `API_BASE_URL` — API base URL (default: `http://localhost:8000`)

## CI Integration
The load tests are not run in CI by default as they require a running backend.
To enable:
```yaml
- name: Run k6 load tests
  run: k6 run tests/load/api_health.js
  env:
    API_BASE_URL: http://localhost:8000
```
