import { Injectable, BadRequestException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

type CreateKycLinkResponse = {
  id: string;
  email: string;
  type: 'individual' | 'business';
  kyc_link: string;
  tos_link: string;
  kyc_status:
    | 'not_started'
    | 'under_review'
    | 'incomplete'
    | 'approved'
    | 'rejected';
  tos_status: 'pending' | 'approved';
  created_at: string;
};

type KycStatusResponse = CreateKycLinkResponse & {
  customer_id: string;
};

@Injectable()
export class KycService {
  private readonly bridgeApiUrl: string;
  private readonly bridgeApiKey: string;

  constructor(private configService: ConfigService) {
    this.bridgeApiUrl = this.configService.get('BRIDGE_API_URL')!;
    this.bridgeApiKey = this.configService.get('BRIDGE_API_KEY')!;
  }

  async createKycLink(fullName: string, email: string) {
    try {
      const response = await axios.post<CreateKycLinkResponse>(
        `${this.bridgeApiUrl}/kyc_links`,
        {
          full_name: fullName,
          email: email,
          type: 'individual',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': this.bridgeApiKey,
            'Idempotency-Key': uuidv4(),
          },
        },
      );

      return response.data;
    } catch (error) {
      if (
        error instanceof AxiosError &&
        error.response?.data?.code === 'duplicate_record'
      ) {
        const existingData = error.response.data
          ?.existing_kyc_link as KycStatusResponse & {
          rejection_reasons: string[];
          full_name: string;
          persona_inquiry_type: string;
        };

        const newData: CreateKycLinkResponse = {
          ...existingData,
        };

        return newData;
      }

      console.error(
        'Bridge API Error:',
        (error as AxiosError).response?.data || (error as Error).message,
      );
      throw new BadRequestException('Failed to create KYC link');
    }
  }

  async getKycStatus(kycLinkId: string) {
    try {
      const response = await axios.get<KycStatusResponse>(
        `${this.bridgeApiUrl}/kyc_links/${kycLinkId}`,
        {
          headers: {
            'Api-Key': this.bridgeApiKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        'Bridge API Error:',
        (error as AxiosError).response?.data || (error as Error).message,
      );
      throw new BadRequestException('Failed to get KYC status');
    }
  }
}
