import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { KycModule } from 'src/kyc/kyc.module';

@Module({
  imports: [KycModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
