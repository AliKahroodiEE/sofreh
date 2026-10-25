import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { Roles } from '../common/auth.js';
import { OrdersModule } from '../orders/orders.module.js';
import { OrdersService } from '../orders/orders.service.js';
import { AdminService } from './admin.service.js';
import {
  AdminOrdersQuery,
  DiscountDto,
  MenuItemDto,
  RestaurantDto,
  SearchQuery,
  SectionDto,
  StatsQuery,
  UpdateDiscountDto,
  UpdateMenuItemDto,
  UpdateOrderStatusDto,
  UpdateRestaurantDto,
  UpdateUserDto,
} from './dto/admin.dto.js';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

/** Everything under /admin requires the ADMIN role. */
@ApiTags('admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly orders: OrdersService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard numbers, daily series and top restaurants' })
  stats(@Query() q: StatsQuery) {
    return this.admin.stats(q.days);
  }

  // orders
  @Get('orders')
  listOrders(@Query() q: AdminOrdersQuery) {
    return this.admin.orders(q);
  }

  @Patch('orders/:id/status')
  setOrderStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.changeStatus(id, dto.status);
  }

  // restaurants
  @Get('restaurants')
  listRestaurants(@Query() q: SearchQuery) {
    return this.admin.restaurants(q);
  }

  @Get('restaurants/:id')
  getRestaurant(@Param('id', ParseIntPipe) id: number) {
    return this.admin.restaurant(id);
  }

  @Post('restaurants')
  createRestaurant(@Body() dto: RestaurantDto) {
    return this.admin.createRestaurant(dto);
  }

  @Patch('restaurants/:id')
  updateRestaurant(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRestaurantDto) {
    return this.admin.updateRestaurant(id, dto);
  }

  @Delete('restaurants/:id')
  deleteRestaurant(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deleteRestaurant(id);
  }

  // menu sections
  @Post('restaurants/:id/sections')
  createSection(@Param('id', ParseIntPipe) id: number, @Body() dto: SectionDto) {
    return this.admin.createSection(id, dto);
  }

  @Patch('sections/:id')
  updateSection(@Param('id', ParseIntPipe) id: number, @Body() dto: SectionDto) {
    return this.admin.updateSection(id, dto);
  }

  @Delete('sections/:id')
  deleteSection(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deleteSection(id);
  }

  // menu items
  @Post('menu-items')
  createMenuItem(@Body() dto: MenuItemDto) {
    return this.admin.createMenuItem(dto);
  }

  @Patch('menu-items/:id')
  updateMenuItem(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuItemDto) {
    return this.admin.updateMenuItem(id, dto);
  }

  @Delete('menu-items/:id')
  deleteMenuItem(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deleteMenuItem(id);
  }

  // discount codes
  @Get('discounts')
  listDiscounts() {
    return this.admin.discounts();
  }

  @Post('discounts')
  createDiscount(@Body() dto: DiscountDto) {
    return this.admin.createDiscount(dto);
  }

  @Patch('discounts/:id')
  updateDiscount(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiscountDto) {
    return this.admin.updateDiscount(id, dto);
  }

  @Delete('discounts/:id')
  deleteDiscount(@Param('id', ParseIntPipe) id: number) {
    return this.admin.deleteDiscount(id);
  }

  // users
  @Get('users')
  listUsers(@Query() q: SearchQuery) {
    return this.admin.users(q);
  }

  @Patch('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.admin.updateUser(id, dto);
  }

  // uploads
  @Post('uploads')
  @ApiOperation({ summary: 'Upload an image; it is resized to max 1200px and saved as WebP' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async upload(@UploadedFile() file?: { mimetype: string; buffer: Buffer }) {
    if (!file?.mimetype.startsWith('image/')) throw new BadRequestException('یک فایل تصویری انتخاب کنید.');
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${randomBytes(4).toString('hex')}.webp`;
    try {
      await sharp(file.buffer)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(join(UPLOAD_DIR, name));
    } catch {
      throw new BadRequestException('فایل تصویر قابل خواندن نیست.');
    }
    return { url: `/uploads/${name}` };
  }
}

@Module({
  imports: [OrdersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
