import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class SetTrackedCoinsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  coins: string[];
}
