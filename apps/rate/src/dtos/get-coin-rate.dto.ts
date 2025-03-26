import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class GetCoinRateDto {
  @IsString()
  coin: string;

  @IsString()
  @IsOptional()
  currency?: string = 'usd';

  @IsBoolean()
  @IsOptional()
  skipCache?: boolean = false;
}
