import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Bàn phím cơ ATK68' })
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @MaxLength(200, { message: 'Tên sản phẩm tối đa 200 ký tự' })
  name: string;

  @ApiProperty({ example: 1890000 })
  @IsNumber({}, { message: 'Giá phải là một con số' })
  @Min(0, { message: 'Giá sản phẩm không được âm' })
  price: number;

  @ApiProperty({ example: 'https://picsum.photos/400' })
  @IsUrl({}, { message: 'Ảnh sản phẩm phải là một URL hợp lệ' })
  image: string;
}
