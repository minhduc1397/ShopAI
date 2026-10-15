import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChatHistoryItemDto {
  @ApiProperty({ enum: ['user', 'model'] })
  @IsIn(['user', 'model'])
  role: 'user' | 'model';

  @ApiProperty({ example: 'Laptop nào hợp để lập trình?' })
  @IsString()
  text: string;
}

export class ChatDto {
  @ApiProperty({ example: 'Tai nghe chống ồn nào tốt?' })
  @IsString()
  @IsNotEmpty({ message: 'Câu hỏi không được để trống' })
  @MaxLength(1000, { message: 'Câu hỏi tối đa 1000 ký tự' })
  message: string;

  @ApiPropertyOptional({ type: [ChatHistoryItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
