import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/setup.js';

/**
 * End-to-end tests against a real PostgreSQL + Redis (docker compose locally,
 * service containers in CI). Needs migrations and the demo seed, and
 * OTP_DEV_MODE=true so the login code comes back in the response.
 */
describe('Sofreh API (e2e)', () => {
  let app: NestExpressApplication;
  const phone = `0912${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
  let token = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports healthy database and Redis', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up', redis: 'up' });
  });

  it('lists restaurants without logging in', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/restaurants?limit=5').expect(200);
    expect(res.body).toMatchObject({ page: 1, limit: 5 });
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('rejects an invalid phone number with a Persian message', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/otp/request').send({ phone: '123' }).expect(400);
    expect(res.body.message).toContain('شماره');
  });

  it('logs in with a one-time code', async () => {
    const otp = await request(app.getHttpServer()).post('/api/v1/auth/otp/request').send({ phone }).expect(200);
    expect(otp.body.devCode).toMatch(/^\d{5}$/);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: otp.body.devCode })
      .expect(200);
    expect(login.body.user).toMatchObject({ phone, role: 'CUSTOMER' });
    expect(login.body.isNewUser).toBe(true);
    token = login.body.accessToken;

    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
  });

  it('protects customer and admin routes', async () => {
    await request(app.getHttpServer()).get('/api/v1/orders').expect(401);
    await request(app.getHttpServer()).get('/api/v1/admin/stats').set('Authorization', `Bearer ${token}`).expect(403);
  });

  it('recalculates prices on the server when placing an order', async () => {
    const menu = await request(app.getHttpServer()).get('/api/v1/restaurants/napoli-no').expect(200);
    const dish = menu.body.sections[0].items[0];
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        restaurantId: menu.body.id,
        items: [{ menuItemId: dish.id, quantity: 2 }],
        addressText: 'تهران، خیابان آزمایشی، پلاک ۱',
        paymentMethod: 'CASH',
      })
      .expect(201);
    const unit = Math.round((dish.price * (100 - dish.discountPercent)) / 100);
    expect(res.body.total).toBe(unit * 2 + menu.body.deliveryFee);
    expect(res.body.status).toBe('PENDING');
  });
});
