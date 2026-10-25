import { Body, Controller, Get, HttpCode, Module, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../common/auth.js';
import { PaginationQuery } from '../common/pagination.js';
import { CreateOrderDto, ReviewDto, ValidateDiscountDto } from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('discounts/validate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Check a discount code before placing the order' })
  validateDiscount(@Body() dto: ValidateDiscountDto) {
    return this.orders.validateDiscount(dto.code, dto.amount);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place an order (prices are recalculated on the server)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.sub, dto);
  }

  @Get('orders')
  list(@CurrentUser() user: AuthUser, @Query() q: PaginationQuery) {
    return this.orders.listMine(user.sub, q);
  }

  @Get('orders/:id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.findForUser(user, id);
  }

  @Post('orders/:id/pay')
  @HttpCode(200)
  @ApiOperation({ summary: 'Simulated online payment (demo gateway)' })
  pay(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.pay(user, id);
  }

  @Post('orders/:id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.orders.cancelByCustomer(user, id);
  }

  @Post('orders/:id/review')
  review(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ReviewDto) {
    return this.orders.review(user, id, dto);
  }
}

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
