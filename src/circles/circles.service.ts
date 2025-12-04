import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Circle } from './circle.entity';
import { CircleMember, MemberRole } from './circle-member.entity';
import { CircleResponseDto } from './dto/circle-response.dto';
import { CircleMemberResponseDto } from './dto/circle-member-response.dto';
import { AddCircleMemberDto } from './dto/add-circle-member.dto';
import { User } from '../users/user.entity';

@Injectable()
export class CirclesService {
  constructor(
    @InjectRepository(Circle)
    private readonly circlesRepo: Repository<Circle>,
    @InjectRepository(CircleMember)
    private readonly circleMembersRepo: Repository<CircleMember>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // ---------- 内部小工具：DTO 转换 ----------

  private toCircleDto(c: Circle): CircleResponseDto {
    return {
      id: c.id,
      name: c.name,
      address: c.address ?? undefined,
      ownerId: c.ownerId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  private toMemberDto(m: CircleMember): CircleMemberResponseDto {
    return {
      id: m.id,
      circleId: m.circleId,
      userId: m.userId,
      userName: m.user?.name ?? '',
      userEmail: m.user?.email ?? '',
      role: m.role,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  // ---------- 新增：基于“当前用户”的查询接口 ----------

  /**
   * 返回“与当前用户有关”的圈子：
   * - 他作为成员在 circle_members 里的圈子
   * - 再加上他作为 owner 的圈子（避免 owner 没建成员记录时看不到自己家的圈子）
   */
  async findAllForUser(userId: string): Promise<CircleResponseDto[]> {
    // 1) 通过成员关系找到圈子
    const memberships = await this.circleMembersRepo.find({
      where: { userId },
      relations: ['circle'],
      order: { createdAt: 'ASC' },
    });

    const circleMap = new Map<string, Circle>();

    for (const m of memberships) {
      if (m.circle) {
        circleMap.set(m.circle.id, m.circle);
      }
    }

    // 2) 把作为 owner 的圈子补进来（如果 membership 缺失）
    const ownerCircles = await this.circlesRepo.find({
      where: { ownerId: userId },
      order: { createdAt: 'ASC' },
    });

    for (const c of ownerCircles) {
      if (!circleMap.has(c.id)) {
        circleMap.set(c.id, c);
      }
    }

    return Array.from(circleMap.values()).map((c) => this.toCircleDto(c));
  }

  /**
   * 当前用户必须是圈内成员/owner 才能看到成员列表
   */
  async findMembersByCircleForUser(
    circleId: string,
    currentUserId: string,
  ): Promise<CircleMemberResponseDto[]> {
    const circle = await this.circlesRepo.findOne({ where: { id: circleId } });
    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    // 如果是 owner，直接放行
    if (circle.ownerId === currentUserId) {
      return this.findMembersByCircle(circleId);
    }

    // 否则要求在成员表中
    const myMember = await this.circleMembersRepo.findOne({
      where: { circleId, userId: currentUserId },
    });

    if (!myMember) {
      throw new ForbiddenException('You are not a member of this circle');
    }

    return this.findMembersByCircle(circleId);
  }

  /**
   * 只有 owner 才能添加/更新成员
   */
  async addMemberAsOwner(
    circleId: string,
    dto: AddCircleMemberDto,
    currentUserId: string,
  ): Promise<CircleMemberResponseDto> {
    const circle = await this.circlesRepo.findOne({ where: { id: circleId } });
    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    await this.ensureUserIsOwner(circle, currentUserId);

    return this.addMemberInternal(circle, dto);
  }

  /**
   * 只有 owner 才能删除成员（仍然保护 owner 本人不被删）
   */
  async removeMemberAsOwner(
    circleId: string,
    memberId: string,
    currentUserId: string,
  ): Promise<void> {
    const circle = await this.circlesRepo.findOne({ where: { id: circleId } });
    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    await this.ensureUserIsOwner(circle, currentUserId);
    await this.removeMember(circleId, memberId);
  }

  // ---------- 内部权限工具 ----------

  /**
   * 确保 user 是圈主：
   * - 如果 circle.ownerId === userId，直接通过
   * - 否则再看 circle_members 里是否有 role=OWNER
   */
  private async ensureUserIsOwner(
    circle: Circle,
    userId: string,
  ): Promise<void> {
    if (circle.ownerId === userId) {
      return;
    }

    const member = await this.circleMembersRepo.findOne({
      where: { circleId: circle.id, userId },
    });

    if (!member || member.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only circle owner can manage members');
    }
  }

  // ---------- 原有“管理用”接口：findAll / findMembersByCircle / addMember / removeMember ----------

  // GET /circles （原来的：列出所有圈子 – 现在可以当“admin 用”）
  async findAll(): Promise<CircleResponseDto[]> {
    const circles = await this.circlesRepo.find({
      order: { createdAt: 'ASC' },
    });

    return circles.map((c) => this.toCircleDto(c));
  }

  // GET /circles/:id/members （原来的：不校验权限）
  async findMembersByCircle(
    circleId: string,
  ): Promise<CircleMemberResponseDto[]> {
    const members = await this.circleMembersRepo.find({
      where: { circleId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return members.map((m) => this.toMemberDto(m));
  }

  // DELETE /circles/:id/members/:memberId （原来的：不判断谁删的）
  async removeMember(circleId: string, memberId: string): Promise<void> {
    const member = await this.circleMembersRepo.findOne({
      where: { id: memberId, circleId },
    });

    if (!member) {
      throw new NotFoundException('Circle member not found');
    }

    // 简单保护：不允许删除圈主
    if (member.role === MemberRole.OWNER) {
      throw new BadRequestException('Cannot remove circle owner');
    }

    await this.circleMembersRepo.remove(member);
  }

  // POST /circles/:id/members （原来的：不判断当前用户身份）
  async addMember(
    circleId: string,
    dto: AddCircleMemberDto,
  ): Promise<CircleMemberResponseDto> {
    const circle = await this.circlesRepo.findOne({ where: { id: circleId } });
    if (!circle) {
      throw new NotFoundException('Circle not found');
    }

    return this.addMemberInternal(circle, dto);
  }

  // ---------- 内部复用：具体“找/建 user + 建/改 member”逻辑 ----------

  private async addMemberInternal(
    circle: Circle,
    dto: AddCircleMemberDto,
  ): Promise<CircleMemberResponseDto> {
    // 1. 找或建 User
    let user = await this.usersRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      user = this.usersRepo.create({
        email: dto.email,
        name: dto.name || dto.email.split('@')[0],
      });
      await this.usersRepo.save(user);
    }

    // 2. 看是否已经是成员
    let member = await this.circleMembersRepo.findOne({
      where: { circleId: circle.id, userId: user.id },
      relations: ['user'],
    });

    if (!member) {
      // 新成员
      member = this.circleMembersRepo.create({
        circleId: circle.id,
        userId: user.id,
        role: dto.role ?? MemberRole.NEIGHBOR,
      });
    } else {
      // 已经是成员，如果传了新的 role，就更新一下
      if (dto.role && member.role !== dto.role) {
        member.role = dto.role;
      } else {
        // 不用修改，直接返回现有
        return this.toMemberDto(member);
      }
    }

    await this.circleMembersRepo.save(member);

    const saved = await this.circleMembersRepo.findOne({
      where: { id: member.id },
      relations: ['user'],
    });

    return this.toMemberDto(saved!);
  }
}
