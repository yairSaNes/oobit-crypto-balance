import { NestFactory } from '@nestjs/core';
import { RateServiceModule } from './rate.module';

async function bootstrap() {
  const app = await NestFactory.create(RateServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
