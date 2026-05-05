import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { HashService } from './hash/hash.service';
import { UsersController } from './users.controller';
import { EmployeeModule } from 'src/employee/employee.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmployeeModule],
  controllers: [UsersController],
  providers: [UsersService, HashService],
  exports: [UsersService, HashService],
})
export class UsersModule {}
