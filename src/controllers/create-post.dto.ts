import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  visibility!: string;

  @IsString()
  scope!: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  metadata?: any;
}
