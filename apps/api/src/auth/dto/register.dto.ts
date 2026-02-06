import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: '비밀번호 (8자 이상)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '비밀번호는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
  })
  password: string;

  @ApiProperty({ example: '홍길동', description: '이름' })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
  name: string;

  @ApiPropertyOptional({ example: '010-1234-5678', description: '전화번호' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]-?\d{3,4}-?\d{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다.',
  })
  phone?: string;
}
