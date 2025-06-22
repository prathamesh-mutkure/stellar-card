import { Injectable, NotFoundException } from '@nestjs/common';
import { KycService } from '../kyc/kyc.service';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private kycService: KycService,
  ) {}

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        kycLink: true,
        tosLink: true,
        kycStatus: true,
        tosStatus: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
      canAccessFullFeatures:
        user.kycStatus === 'approved' && user.tosStatus === 'approved',
    };
  }

  async refreshKycStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.kycLinkId) {
      return new NotFoundException('KYC link not found for user');
    }

    try {
      const kycData = await this.kycService.getKycStatus(user.kycLinkId);

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: kycData.kyc_status,
          tosStatus: kycData.tos_status,
          isVerified:
            kycData.kyc_status === 'approved' &&
            kycData.tos_status === 'approved',
          bridgeCustomerId: kycData.customer_id,
        },
      });

      return {
        kycStatus: updatedUser.kycStatus,
        tosStatus: updatedUser.tosStatus,
        isVerified: updatedUser.isVerified,
      };
    } catch (error) {
      console.log(error);

      return { error: 'Failed to refresh KYC status' };
    }
  }
}
