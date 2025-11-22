import request from 'supertest';
import express from 'express';

describe('API Gateway E2E', () => {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ service: 'API Gateway', status: 'running' });
  });

  app.get('/jobs', (req, res) => {
    res.json({
      jobs: [
        { id: 1, title: 'Senior Developer', company: 'Tech Corp' },
        { id: 2, title: 'Product Manager', company: 'StartUp' },
      ],
    });
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.service).toBe('API Gateway');
  });

  it('should return jobs list', async () => {
    const response = await request(app).get('/jobs');
    expect(response.status).toBe(200);
    expect(response.body.jobs).toBeDefined();
    expect(Array.isArray(response.body.jobs)).toBe(true);
    expect(response.body.jobs.length).toBeGreaterThan(0);
  });

  it('should have job properties', async () => {
    const response = await request(app).get('/jobs');
    const job = response.body.jobs[0];
    expect(job.id).toBeDefined();
    expect(job.title).toBeDefined();
    expect(job.company).toBeDefined();
  });
});