import { NestFactory } from '@nestjs/core';
import { BalanceServiceModule } from './balance.module';

async function bootstrap() {
  const app = await NestFactory.create(BalanceServiceModule);
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Balance Service running on http://localhost:${port}`);
}
void bootstrap();
