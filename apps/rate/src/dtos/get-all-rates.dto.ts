import { IsString, IsOptional } from 'class-validator';

export class GetRatesDto {
  @IsString()
  coins: string;

  @IsString()
  @IsOptional()
  currency?: string = 'usd';
}
