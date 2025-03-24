/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RateController } from './rate.controller';
import { RateService } from './rate.service';
import { BadRequestException } from '@nestjs/common';

describe('RateController', () => {
  let controller: RateController;
  let rateService: RateService;

  const mockRateService = {
    getSupportedCoins: jest.fn().mockReturnValue(['bitcoin', 'ethereum']),
    getSupportedCurrencies: jest.fn().mockReturnValue(['usd', 'eur']),
    setSupportedCoins: jest.fn(),
    setSupportedCurrencies: jest.fn(),
    getCryptoPrice: jest.fn().mockResolvedValue(50000),
    fetchRates: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateController],
      providers: [{ provide: RateService, useValue: mockRateService }],
    }).compile();

    controller = module.get<RateController>(RateController);
    rateService = module.get<RateService>(RateService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSupportedCoins', () => {
    it('should return supported coins', () => {
      expect(controller.getSupportedCoins()).toEqual(['bitcoin', 'ethereum']);
    });
  });

  describe('getSupportedCurrencies', () => {
    it('should return supported currencies', () => {
      expect(controller.getSupportedCurrencies()).toEqual(['usd', 'eur']);
    });
  });

  describe('setSupportedCoins', () => {
    it('should call setSupportedCoins with valid input', () => {
      controller.setSupportedCoins(['bitcoin', 'ethereum']);
      expect(rateService.setSupportedCoins).toHaveBeenCalledWith([
        'bitcoin',
        'ethereum',
      ]);
    });

    it('should throw BadRequestException when input is invalid', () => {
      expect(() => controller.setSupportedCoins([])).toThrow(
        BadRequestException,
      );
    });
  });

  describe('setSupportedCurrencies', () => {
    it('should call setSupportedCurrencies with valid input', () => {
      controller.setSupportedCurrencies(['usd', 'eur']);
      expect(rateService.setSupportedCurrencies).toHaveBeenCalledWith([
        'usd',
        'eur',
      ]);
    });

    it('should throw BadRequestException when input is invalid', () => {
      expect(() => controller.setSupportedCurrencies([])).toThrow(
        BadRequestException,
      );
    });
  });

  describe('getCryptoPrice', () => {
    it('should return the crypto price', async () => {
      await expect(
        controller.getCryptoPrice('bitcoin', 'usd', 'false'),
      ).resolves.toEqual(50000);
      expect(rateService.getCryptoPrice).toHaveBeenCalledWith(
        'bitcoin',
        'usd',
        false,
      );
    });

    it('should throw an error if coin is not provided', async () => {
      await expect(
        controller.getCryptoPrice('', 'usd', 'false'),
      ).rejects.toThrow(Error);
    });
  });

  describe('fetchRates', () => {
    it('should call fetchRates and return success message', async () => {
      await expect(controller.fetchRates()).resolves.toEqual({
        message: 'Rates updated successfully',
      });
      expect(rateService.fetchRates).toHaveBeenCalled();
    });
  });
});
