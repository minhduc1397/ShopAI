import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ example: 'prod_1' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayNotEmpty({ message: 'Giỏ hàng đang trống, không thể đặt hàng' })
  @ValidateNested({ each: true }) // Kiểm tra TỪNG phần tử trong mảng
  @Type(() => OrderItemDto) // BẮT BUỘC cho validate lồng nhau
  items: OrderItemDto[];

  @ApiProperty({ example: 3780000 })
  @IsNumber()
  @Min(0)
  total: number; // Chỉ để ĐỐI CHIẾU, không ghi vào đơn (Phần 9.12)
}
