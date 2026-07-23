import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiKeyDuration = new Trend('api_key_duration');

export let options = {
  stages: [
    { duration: '10s', target: 5 },  // ramp up to 5 VUs
    { duration: '20s', target: 10 },  // ramp to 10 VUs
    { duration: '10s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    errors: ['rate<0.1'],               // less than 10% errors
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000';

function getApiKey() {
  // For load testing, we use a mock key (real auth is mocked in dev mode)
  return 'hl_test_load_test_key';
}

export default function () {
  const apiKey = getApiKey();
  const params = {
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  };

  // 1. Health check
  {
    const res = http.get(`${BASE_URL}/v1/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response ok': (r) => r.json('status') === 'ok',
    });
    errorRate.add(res.status !== 200);
    apiKeyDuration.add(res.timings.duration);
  }

  // 2. Create a job
  const jobPayload = JSON.stringify({
    title: `Load Test Job ${__VU}-${__ITER}`,
    description: 'Performance test job',
    status: 'published',
    passing_score: 7.0,
    interview_question_count: 3,
  });

  let jobId;
  {
    const res = http.post(`${BASE_URL}/v1/jobs`, jobPayload, params);
    check(res, {
      'job created successfully': (r) => r.status === 201,
      'job has id': (r) => r.json('id') !== undefined,
    });
    errorRate.add(res.status !== 201);
    if (res.status === 201) {
      jobId = res.json('id');
    }
  }

  // 3. List jobs
  {
    const res = http.get(`${BASE_URL}/v1/jobs`, params);
    check(res, {
      'jobs listed successfully': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
  }

  // 4. If we created a job, perform additional operations
  if (jobId) {
    // Get single job
    {
      const res = http.get(`${BASE_URL}/v1/jobs/${jobId}`, params);
      check(res, {
        'get job returns 200': (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    }

    // Update job
    {
      const res = http.patch(
        `${BASE_URL}/v1/jobs/${jobId}`,
        JSON.stringify({ title: `Updated ${__VU}-${__ITER}` }),
        params,
      );
      check(res, {
        'job updated successfully': (r) => r.status === 200,
      });
      errorRate.add(res.status !== 200);
    }

    // Create application (via direct store for load testing)
    const appPayload = JSON.stringify({
      to_status: 'shortlisted',
      reason: 'Load test transition',
    });

    // Try transition (will fail if no application exists, but tests the endpoint)
    {
      const res = http.post(
        `${BASE_URL}/v1/applications/test-app/transition`,
        appPayload,
        params,
      );
      // Accept 400 (invalid transition) or 200 (success) or 404 (app not found)
      check(res, {
        'transition endpoint responded': (r) => [200, 400, 404].includes(r.status),
      });
      errorRate.add(res.status === 500 || res.status === 503);
    }
  }

  // 5. Check webhooks endpoint
  {
    const res = http.get(`${BASE_URL}/v1/webhooks`, params);
    check(res, {
      'webhooks listed': (r) => r.status === 200 || r.status === 401 || r.status === 403,
    });
  }

  // Simulate a user think time (100-500ms)
  sleep(Math.random() * 0.4 + 0.1);
}
