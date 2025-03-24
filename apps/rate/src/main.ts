import { NestFactory } from '@nestjs/core';
import { RateServiceModule } from './rate.module';

async function bootstrap() {
  const app = await NestFactory.create(RateServiceModule);
  await app.listen(3002);
  console.log('Rate Service running on http://localhost:3002');
}
void bootstrap();
