import { CircleResponseDto } from '../../circles/dto/circle-response.dto';

export class MeResponseDto {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;

  // 当前用户拥有的圈子（MVP 只做 owner 的圈子）
  circles: CircleResponseDto[];
}
