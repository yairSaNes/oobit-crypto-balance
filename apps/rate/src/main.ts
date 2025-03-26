import { NestFactory } from '@nestjs/core';
import { RateServiceModule } from './rate.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(RateServiceModule);
  const port = process.env.PORT || 3002;
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(port);
  console.log(`Rate Service running on http://localhost:${port}`);
}
void bootstrap();
