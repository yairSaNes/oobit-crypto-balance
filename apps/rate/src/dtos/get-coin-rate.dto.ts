import { IsString, IsOptional } from 'class-validator';

export class GetCoinRateDto {
  @IsString()
  coin: string;

  @IsString()
  @IsOptional()
  currency?: string = 'usd';
}
