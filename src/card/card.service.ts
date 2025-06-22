import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string) {
    const cardExists = await this.prisma.card.findUnique({
      where: { userId },
    });

    if (cardExists) {
      return cardExists;
    }

    const cardNumber = this.generateCardNumber();
    const expiryMonth = faker.number.int({ min: 1, max: 12 });
    const expiryYear =
      new Date().getFullYear() + faker.number.int({ min: 1, max: 5 });
    const cvv = faker.finance.creditCardCVV();

    const usdcBalance = faker.number.float({
      min: 10,
      max: 1000,
    });

    return this.prisma.card.create({
      data: {
        cardNumber,
        expiryMonth,
        expiryYear,
        cvv,
        usdcBalance,
        userId,
      },
    });
  }

  get(userId: string) {
    return this.prisma.card.findUnique({ where: { userId } });
  }

  private generateCardNumber(): string {
    // Visa starts with 4, 16 digits
    const number = '4' + faker.string.numeric(14);
    const checkDigit = this.luhnCheckDigit(number);

    return number + checkDigit;
  }

  private luhnCheckDigit(number: string): string {
    const digits = number.split('').map(Number).reverse();
    const total = digits
      .map((d, i) => {
        if (i % 2 === 0) return d;
        const doubled = d * 2;
        return doubled > 9 ? doubled - 9 : doubled;
      })
      .reduce((a, b) => a + b, 0);

    const check = (10 - (total % 10)) % 10;
    return check.toString();
  }
}
