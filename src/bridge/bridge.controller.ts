import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BridgeService } from './bridge.service';
import { Request } from 'express';

@Controller('bridge')
@UseGuards(JwtAuthGuard)
export class BridgeController {
  constructor(private bridgeService: BridgeService) {}

  @Post('wallet')
  async createWallet(@Req() req) {
    return this.bridgeService.createWallet(req.user.id, 'solana');
  }

  @Get('wallet')
  async getWallet(@Req() req) {
    return this.bridgeService.getWallet(req.user.id, 'solana');
  }

  @Post('address')
  async createLiquidationAddress(@Req() req) {
    const solanaWalletId = await this.bridgeService.getWallet(
      req.user.id,
      'solana',
    );

    if (!solanaWalletId) {
      throw new Error('Solana wallet not found');
    }

    return this.bridgeService.createLiquidationAddress(req.user.id, {
      chain: 'stellar',
      currency: 'usdc',
      destination_payment_rail: 'solana',
      bridge_wallet_id: solanaWalletId.bridgeWalletId,
      destination_currency: 'usdc',
    });
  }

  @Get('address')
  async getLiquidationAddress(@Req() req) {
    return this.bridgeService.getLiquidationAddress(req.user.id, 'stellar');
  }
}
