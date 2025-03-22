import { Test, TestingModule } from '@nestjs/testing';
import { RateServiceController } from './rate-service.controller';
import { RateServiceService } from './rate-service.service';

describe('RateServiceController', () => {
  let rateServiceController: RateServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RateServiceController],
      providers: [RateServiceService],
    }).compile();

    rateServiceController = app.get<RateServiceController>(RateServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(rateServiceController.getHello()).toBe('Hello World!');
    });
  });
});
