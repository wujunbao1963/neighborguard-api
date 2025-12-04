import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Circle } from './circle.entity';
import { CircleMember } from './circle-member.entity';
import { CirclesService } from './circles.service';
import { CirclesController } from './circles.controller';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module'; // ⭐ 新增

@Module({
  imports: [
    TypeOrmModule.forFeature([Circle, CircleMember, User]),
    UsersModule,
  ],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService, TypeOrmModule],
})
export class CirclesModule {}
