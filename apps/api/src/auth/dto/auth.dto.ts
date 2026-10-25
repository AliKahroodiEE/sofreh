import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '09121111111', description: 'Iranian mobile number (Persian digits and +98 are accepted)' })
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '09121111111' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '12345', description: '5-digit code received by SMS' })
  @IsString()
  @Matches(/^[0-9۰-۹]{5}$/, { message: 'کد تأیید باید ۵ رقم باشد.' })
  code: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @Length(20, 200)
  refreshToken: string;
}
