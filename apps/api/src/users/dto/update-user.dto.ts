import { IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: '홍길동', description: '이름' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '010-1234-5678', description: '전화번호' })
  @IsOptional()
  @IsString()
  @Matches(/^01[0-9]-?\d{3,4}-?\d{4}$/)
  phone?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'OldPassword123!', description: '현재 비밀번호' })
  @IsString()
  currentPassword: string;

  @ApiPropertyOptional({ example: 'NewPassword123!', description: '새 비밀번호' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  newPassword: string;
}
