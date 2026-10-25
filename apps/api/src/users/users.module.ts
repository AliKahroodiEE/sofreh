import { Body, Controller, Delete, Get, Injectable, Module, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';
import { CurrentUser, type AuthUser } from '../common/auth.js';
import { PrismaService } from '../prisma/prisma.service.js';

export class UpdateProfileDto {
  @ApiProperty({ example: 'سارا محمدی' })
  @IsString()
  @Length(2, 50, { message: 'نام باید بین ۲ تا ۵۰ حرف باشد.' })
  name: string;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'خانه' })
  @IsString()
  @Length(1, 30)
  title: string;

  @ApiProperty({ example: 'تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۱۲، واحد ۴' })
  @IsString()
  @Length(5, 250, { message: 'آدرس را کامل‌تر وارد کنید.' })
  details: string;

  @ApiPropertyOptional({ example: 35.7801 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: 51.3762 })
  @IsOptional()
  @IsLongitude()
  lng?: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  updateProfile(userId: number, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name.trim() },
      select: { id: true, phone: true, name: true, role: true },
    });
  }

  addresses(userId: number) {
    return this.prisma.address.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  addAddress(userId: number, dto: CreateAddressDto) {
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async removeAddress(userId: number, id: number) {
    // deleteMany scoped by userId: users can only delete their own addresses.
    const { count } = await this.prisma.address.deleteMany({ where: { id, userId } });
    return { ok: count > 0 };
  }
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.sub, dto);
  }

  @Get('addresses')
  addresses(@CurrentUser() user: AuthUser) {
    return this.users.addresses(user.sub);
  }

  @Post('addresses')
  addAddress(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
    return this.users.addAddress(user.sub, dto);
  }

  @Delete('addresses/:id')
  removeAddress(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.users.removeAddress(user.sub, id);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
