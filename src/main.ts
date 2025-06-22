import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: '*',
  });

  const PORT = process.env.PORT || 3000;

  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}

void bootstrap();
