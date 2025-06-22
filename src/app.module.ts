import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'nestjs-prisma';
import { KycModule } from './kyc/kyc.module';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { BridgeModule } from './bridge/bridge.module';

@Module({
  imports: [
    PrismaModule.forRoot({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    KycModule,
    UserModule,
    BridgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
