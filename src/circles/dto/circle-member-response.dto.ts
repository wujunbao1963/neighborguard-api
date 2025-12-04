import { MemberRole } from '../circle-member.entity';

export class CircleMemberResponseDto {
  id: string;
  circleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: MemberRole;
  createdAt: Date;
  updatedAt: Date;
}
