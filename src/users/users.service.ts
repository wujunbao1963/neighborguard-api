import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './user.entity';
import { Circle } from '../circles/circle.entity';
import { CircleMember, MemberRole } from '../circles/circle-member.entity';
import { MeResponseDto } from './dto/me-response.dto';
import { CircleResponseDto } from '../circles/dto/circle-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Circle)
    private readonly circlesRepo: Repository<Circle>,
    @InjectRepository(CircleMember)
    private readonly circleMembersRepo: Repository<CircleMember>,
  ) {}

  // 默认屋主邮箱
  private readonly defaultEmail = 'owner@neighborguard.local';
  private readonly defaultName = 'Default Owner';

  // 通用：按 email 找或建用户
  async getOrCreateUserByEmail(email: string, name?: string): Promise<User> {
    let user = await this.usersRepo.findOne({
      where: { email },
    });

    if (!user) {
      user = this.usersRepo.create({
        email,
        name:
          name && name.trim().length > 0 ? name.trim() : email.split('@')[0],
      });
      await this.usersRepo.save(user);
    } else if (name && !user.name) {
      user.name = name;
      await this.usersRepo.save(user);
    }

    return user;
  }

  // 默认屋主
  async getOrCreateDefaultUser(): Promise<User> {
    let user = await this.usersRepo.findOne({
      where: { email: this.defaultEmail },
    });

    if (!user) {
      user = this.usersRepo.create({
        name: 'Default Owner',
        email: this.defaultEmail,
      });
      await this.usersRepo.save(user);
    }

    return user;
  }

  // 确保有默认圈子以及 owner 成员
  // 确保有默认圈子以及 owner 成员
  async ensureDefaultCircleForUser(user: User): Promise<Circle> {
    let circle = await this.circlesRepo.findOne({
      where: { ownerId: user.id },
      order: { createdAt: 'ASC' },
    });

    if (!circle) {
      circle = this.circlesRepo.create({
        name: 'My Home',
        address: 'Unknown address',
        ownerId: user.id,
      });
      await this.circlesRepo.save(circle);
    }

    // 确保 user 在这个 circle 里有一条 OWNER 成员记录
    let member = await this.circleMembersRepo.findOne({
      where: { circleId: circle.id, userId: user.id },
    });

    if (!member) {
      member = this.circleMembersRepo.create({
        circleId: circle.id,
        userId: user.id,
        role: MemberRole.OWNER,
      });
      await this.circleMembersRepo.save(member);
    } else if (member.role !== MemberRole.OWNER) {
      member.role = MemberRole.OWNER;
      await this.circleMembersRepo.save(member);
    }

    // ✅ 把屋主自己也写进 circle_members，role = owner
    const existingOwnerMember = await this.circleMembersRepo.findOne({
      where: { circleId: circle.id, userId: user.id },
    });

    if (!existingOwnerMember) {
      const ownerMember = this.circleMembersRepo.create({
        circleId: circle.id,
        userId: user.id,
        role: MemberRole.OWNER,
      });
      await this.circleMembersRepo.save(ownerMember);
    }

    return circle;
  }
  /**
   * 根据 header 提供的 email/name，返回当前用户 & 其可见圈子
   * - 默认屋主：看到自己家的圈子（owner）
   * - 其他邮箱：看到自己作为成员加入的圈子
   */

  async resolveCurrentUser(headerUserId?: string | null): Promise<User> {
    if (headerUserId) {
      const user = await this.usersRepo.findOne({
        where: { id: headerUserId },
      });
      if (!user) {
        throw new NotFoundException(
          `User with id from x-user-id not found: ${headerUserId}`,
        );
      }
      return user;
    }

    // 没有 header → 用默认 owner
    const defaultUser = await this.getOrCreateDefaultUser();
    await this.ensureDefaultCircleForUser(defaultUser);
    return defaultUser;
  }
  async buildMeResponse(user: User): Promise<MeResponseDto> {
    // 1) 我是 owner 的圈子
    const ownedCircles = await this.circlesRepo.find({
      where: { ownerId: user.id },
      order: { createdAt: 'ASC' },
    });

    // 2) 我作为成员加入的圈子（通过 circle_members）
    const memberships = await this.circleMembersRepo.find({
      where: { userId: user.id },
    });

    let memberCircles: Circle[] = [];
    if (memberships.length > 0) {
      const circleIds = memberships.map((m) => m.circleId);
      memberCircles = await this.circlesRepo.find({
        where: { id: In(circleIds) },
      });
    }

    // 3) owner 圈 + member 圈 去重合并
    const circleMap = new Map<string, Circle>();
    for (const c of ownedCircles) {
      circleMap.set(c.id, c);
    }
    for (const c of memberCircles) {
      circleMap.set(c.id, c);
    }

    const allCircles = Array.from(circleMap.values()).sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      return 0;
    });

    const dto = new MeResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.avatarUrl = user.avatarUrl;

    dto.circles = allCircles.map((c) => {
      const cd = new CircleResponseDto();
      cd.id = c.id;
      cd.name = c.name;
      cd.address = c.address ?? undefined;
      cd.ownerId = c.ownerId;
      cd.createdAt = c.createdAt;
      cd.updatedAt = c.updatedAt;
      return cd;
    });

    return dto;
  }

  // 仅开发调试用：列出所有用户
  async findAllUsers(): Promise<User[]> {
    return this.usersRepo.find({
      order: { createdAt: 'ASC' },
    });
  }
}
