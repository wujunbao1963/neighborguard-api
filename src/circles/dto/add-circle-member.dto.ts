import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { MemberRole } from '../circle-member.entity';

export class AddCircleMemberDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;
}
