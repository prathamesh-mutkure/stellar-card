import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { CardService } from './card.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('card')
@UseGuards(JwtAuthGuard)
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  create(@Req() req) {
    return this.cardService.create(req.user.id);
  }

  @Get()
  findAll(@Req() req) {
    return this.cardService.get(req.user.id);
  }
}
