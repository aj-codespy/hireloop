"""Metrics endpoint auth: 401 without token, 503 when unset, 200 with token.

The token is read from the env at request time, so tests toggle
os.environ between requests against a single imported app.
"""

import os

import pytest
from fastapi.testclient import TestClient

import main as main_mod

pytestmark = pytest.mark.skipif(
    not getattr(main_mod, "METRICS_ENABLED", False),
    reason="prometheus_client not installed",
)

client = TestClient(main_mod.app)


def test_metrics_requires_token():
    os.environ["METRICS_TOKEN"] = "secret-token"
    r = client.get("/metrics")
    assert r.status_code == 401, r.text


def test_metrics_rejects_wrong_token():
    os.environ["METRICS_TOKEN"] = "secret-token"
    r = client.get("/metrics", headers={"X-Metrics-Token": "wrong"})
    assert r.status_code == 401, r.text


def test_metrics_accepts_correct_token():
    os.environ["METRICS_TOKEN"] = "secret-token"
    r = client.get("/metrics", params={"token": "secret-token"})
    assert r.status_code == 200, r.text
    assert "text/plain" in r.headers.get("content-type", "")


def test_metrics_disabled_without_token():
    os.environ["METRICS_TOKEN"] = ""
    r = client.get("/metrics")
    assert r.status_code == 503, r.text
