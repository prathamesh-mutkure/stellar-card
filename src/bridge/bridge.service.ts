import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from 'nestjs-prisma';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BridgeService {
  private readonly bridgeApiUrl: string;
  private readonly bridgeApiKey: string;

  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.bridgeApiUrl = this.configService.get('BRIDGE_API_URL')!;
    this.bridgeApiKey = this.configService.get('BRIDGE_API_KEY')!;
  }

  async createCustomer(fullName: string, email: string) {
    try {
      const response = await axios.post(
        `${this.bridgeApiUrl}/customers`,
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
      console.error('Bridge API Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create Bridge customer');
    }
  }

  async createWallet(userId: string, chain: 'solana' | 'base') {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { bridgeCustomerId: true, Wallet: true },
      });

      if (!user || !user.bridgeCustomerId) {
        throw new BadRequestException(
          'User not found or Bridge customer ID missing',
        );
      }

      const wallet = user.Wallet.find((w) => w.chain === chain);

      if (wallet) {
        return wallet;
      }

      const response = await axios.post<{
        id: string;
        chain: 'solana' | 'base';
        address: string;
        tags: [];
        created_at: string;
        updated_at: string;
      }>(
        `${this.bridgeApiUrl}/customers/${user.bridgeCustomerId}/wallets`,
        {
          chain: chain,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': this.bridgeApiKey,
            'Idempotency-Key': uuidv4(),
          },
        },
      );

      const newWallet = await this.prisma.wallet.create({
        data: {
          userId: userId,
          bridgeWalletId: response.data.id,
          chain: response.data.chain,
          address: response.data.address,
        },
      });

      return newWallet;
    } catch (error) {
      console.error('Bridge API Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create Bridge wallet');
    }
  }

  async getWallet(userId: string, chain: 'solana' | 'base') {
    return this.prisma.wallet.findFirst({
      where: {
        userId,
        chain,
      },
    });
  }

  async getWalletBalance(customerId: string, walletId: string) {
    try {
      const response = await axios.get<{
        id: string;
        chain: 'solana' | 'base';
        address: string;
        tags: [];
        created_at: string;
        updated_at: string;
        balances: {
          balance: string;
          currency: string;
          chain: 'solana' | 'base';
          contract_address: string;
        }[];
      }>(`${this.bridgeApiUrl}/customers/${customerId}/wallets/${walletId}`, {
        headers: {
          'Api-Key': this.bridgeApiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Bridge API Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to get wallet balance');
    }
  }

  async createLiquidationAddress(
    userId: string,
    body: {
      chain: 'stellar';
      currency: 'usdc';
      destination_payment_rail: 'solana';
      bridge_wallet_id: string;
      destination_currency: 'usdc';
    },
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { bridgeCustomerId: true, LiquidationAddress: true },
      });

      if (!user || !user.bridgeCustomerId) {
        throw new BadRequestException(
          'User not found or Bridge customer ID missing',
        );
      }

      const address = user.LiquidationAddress.find(
        (w) => w.chain === body.chain,
      );

      if (address) {
        return address;
      }

      const response = await axios.post<{
        id: string;
        chain: 'stellar' | 'solana';
        address: string;
        currency: 'usdc';
        blockchain_memo: string;
        destination_payment_rail: 'solana';
        destination_currency: 'usdc';
        destination_address: string;
        created_at: string;
        updated_at: string;
        state: 'active';
      }>(
        `${this.bridgeApiUrl}/customers/${user.bridgeCustomerId}/liquidation_addresses`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': this.bridgeApiKey,
            'Idempotency-Key': uuidv4(),
          },
        },
      );

      const newAddress = await this.prisma.liquidationAddress.create({
        data: {
          userId: userId,
          bridgeId: response.data.id,
          chain: response.data.chain,
          address: response.data.address,
          currency: response.data.currency,
          blockchain_memo: response.data.blockchain_memo,
          destination_address: response.data.destination_address,
          destination_payment_rail: response.data.destination_payment_rail,
          destination_currency: response.data.destination_currency,
        },
      });

      return newAddress;
    } catch (error) {
      console.error('Bridge API Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create liquidation address');
    }
  }

  async getLiquidationAddress(
    userId: string,
    chain: 'solana' | 'base' | 'stellar',
  ) {
    return this.prisma.liquidationAddress.findFirst({
      where: {
        userId,
        chain,
      },
    });
  }

  async createTransfer(transferData: {
    customerId: string;
    amount: string;
    source: any;
    destination: any;
  }) {
    try {
      const response = await axios.post(
        `${this.bridgeApiUrl}/transfers`,
        {
          amount: transferData.amount,
          on_behalf_of: transferData.customerId,
          source: transferData.source,
          destination: transferData.destination,
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
      console.error('Bridge API Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to create transfer');
    }
  }

  async getTransfer(transferId: string) {
    try {
      const response = await axios.get(
        `${this.bridgeApiUrl}/transfers/${transferId}`,
        {
          headers: {
            'Api-Key': this.bridgeApiKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Bridge API Error:', error.response?.data || error.message);
      throw new BadRequestException('Failed to get transfer status');
    }
  }
}
