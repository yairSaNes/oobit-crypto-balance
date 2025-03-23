import { NestFactory } from '@nestjs/core';
import { BalanceServiceModule } from './balance.module';

async function bootstrap() {
  const app = await NestFactory.create(BalanceServiceModule);
  await app.listen(3001);
  console.log('Balance Service running on http://localhost:3001');
}
bootstrap();
