import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CirclesService } from './circles.service';
import { CircleResponseDto } from './dto/circle-response.dto';
import { AddCircleMemberDto } from './dto/add-circle-member.dto';
import { CircleMemberResponseDto } from './dto/circle-member-response.dto';
import { UsersService } from '../users/users.service';
import { DevAuthGuard } from '../auth/dev-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('circles')
@UseGuards(DevAuthGuard)
export class CirclesController {
  constructor(
    private readonly circlesService: CirclesService,
    private readonly usersService: UsersService,
  ) {}

  private getHeaderUserId(req: Request): string | null {
    const raw = req.headers['x-user-id'];
    return Array.isArray(raw) ? raw[0] : (raw ?? null);
  }

  // GET /circles
  // MVP：返回“当前用户相关的圈子”
  @Get()
  async getCircles(@Req() req: Request): Promise<CircleResponseDto[]> {
    const headerUserId = this.getHeaderUserId(req);
    const currentUser =
      await this.usersService.resolveCurrentUser(headerUserId);

    // 推荐 CirclesService 里实现 findAllForUser(userId)
    return this.circlesService.findAllForUser(currentUser.id);
  }

  // GET /circles/:id/members
  // 只有圈内成员可以看成员列表
  @Get(':id/members')
  async getCircleMembers(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<CircleMemberResponseDto[]> {
    const headerUserId = this.getHeaderUserId(req);
    const currentUser =
      await this.usersService.resolveCurrentUser(headerUserId);

    // CirclesService 内部做：确认 currentUser 是这个 circle 的成员，否则 Forbidden
    return this.circlesService.findMembersByCircleForUser(id, currentUser.id);
  }

  // POST /circles/:id/members
  // 只有圈主（owner）有权限加人
  @Post(':id/members')
  async addMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AddCircleMemberDto,
  ): Promise<CircleMemberResponseDto> {
    const headerUserId = this.getHeaderUserId(req);
    const currentUser =
      await this.usersService.resolveCurrentUser(headerUserId);

    // 在 service 里确认 currentUser 是 owner，不是就 Forbidden
    return this.circlesService.addMemberAsOwner(id, dto, currentUser.id);
  }

  // DELETE /circles/:id/members/:memberId
  // 只有圈主（owner）有权限删人（包括把邻居踢出圈子）
  @Delete(':id/members/:memberId')
  async removeMember(
    @Req() req: Request,
    @Param('id') circleId: string,
    @Param('memberId') memberId: string,
  ): Promise<{ success: boolean }> {
    const headerUserId = this.getHeaderUserId(req);
    const currentUser =
      await this.usersService.resolveCurrentUser(headerUserId);

    await this.circlesService.removeMemberAsOwner(
      circleId,
      memberId,
      currentUser.id,
    );
    return { success: true };
  }
}
