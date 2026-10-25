import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Order } from '@prisma/client';
import type { Server, Socket } from 'socket.io';
import type { AuthUser } from '../common/auth.js';

/**
 * Socket.IO gateway on the `/realtime` namespace.
 * Clients connect with `{ auth: { token: <accessToken> } }`; each user joins
 * the room `user:<id>` and admins also join `admins`.
 *
 * Events sent by the server:
 *   order.created  → admins            { id, code, status, total, restaurantId, createdAt }
 *   order.updated  → owner + admins    { id, code, status, isPaid, updatedAt }
 */
@WebSocketGateway({ namespace: '/realtime', cors: { origin: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token = (client.handshake.auth?.token as string | undefined) ?? (client.handshake.query.token as string | undefined);
    try {
      const user = this.jwt.verify<AuthUser>(String(token));
      void client.join(`user:${user.sub}`);
      if (user.role === 'ADMIN') void client.join('admins');
    } catch {
      this.logger.debug('Rejected socket connection without a valid token');
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
    }
  }
}

@Injectable()
export class RealtimeService {
  constructor(private readonly gateway: RealtimeGateway) {}

  orderCreated(order: Order) {
    this.gateway.server?.to('admins').emit('order.created', {
      id: order.id,
      code: order.code,
      status: order.status,
      total: order.total,
      restaurantId: order.restaurantId,
      createdAt: order.createdAt,
    });
  }

  orderUpdated(order: Order) {
    const payload = { id: order.id, code: order.code, status: order.status, isPaid: order.isPaid, updatedAt: order.updatedAt };
    this.gateway.server?.to([`user:${order.userId}`, 'admins']).emit('order.updated', payload);
  }
}

@Global()
@Module({
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
