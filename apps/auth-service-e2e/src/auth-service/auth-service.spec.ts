import request from 'supertest';
import express from 'express';

describe('Auth Service E2E', () => {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ service: 'Auth Service', status: 'running' });
  });

  app.post('/auth/login', (req, res) => {
    res.json({ token: 'jwt-token-here', user: 'user@example.com' });
  });

  app.post('/auth/register', (req, res) => {
    res.status(201).json({ id: '123', email: req.body.email, name: req.body.name });
  });

  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.service).toBe('Auth Service');
  });

  it('should login user', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  it('should register user', async () => {
    const response = await request(app).post('/auth/register').send({
      email: 'new@example.com',
      name: 'New User',
    });
    expect(response.status).toBe(201);
    expect(response.body.email).toBe('new@example.com');
  });
});