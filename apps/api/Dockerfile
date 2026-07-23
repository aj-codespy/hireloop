FROM python:3.11-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY apps/api/pyproject.toml apps/api/
RUN cd apps/api && uv sync --no-dev

FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /app /app
COPY apps/api/ /app/apps/api/

ENV PYTHONPATH=/app/apps/api \
    DEV_SQLITE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
