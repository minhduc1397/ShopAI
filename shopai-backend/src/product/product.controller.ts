import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@Controller('api/products')
export class ProductController {
  // Dependency Injection: Tiêm Service vào Controller
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm (lọc theo danh mục / từ khóa)' })
  @ApiQuery({ name: 'category', required: false, example: 'audio' })
  @ApiQuery({ name: 'q', required: false, example: 'tai nghe' })
  getProducts(@Query('category') category?: string, @Query('q') q?: string) {
    return this.productService.getAllProducts({ category, q });
  }

  // Route tĩnh khai báo TRƯỚC route động :id
  @Get('categories')
  @ApiOperation({ summary: 'Danh mục sản phẩm + số lượng' })
  getCategories() {
    return this.productService.getCategories();
  }

  @Post() // Chỉ để minh họa ValidationPipe (Bước 7b), ShopAI chưa dùng đến
  @ApiOperation({ summary: 'Minh họa ValidationPipe + DTO' })
  createProduct(@Body() dto: CreateProductDto) {
    return { message: 'Dữ liệu hợp lệ, đã nhận sản phẩm', data: dto };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết 1 sản phẩm' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }
}
