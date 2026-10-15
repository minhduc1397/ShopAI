import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

type AuthedRequest = Request & { user: { userId: string; email: string } };

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Toàn bộ Orders API yêu cầu JWT
@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng (PENDING)' })
  create(@Body() dto: CreateOrderDto, @Req() req: AuthedRequest) {
    return this.orderService.createOrder(dto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lịch sử đơn của user đang đăng nhập' })
  findMine(@Req() req: AuthedRequest) {
    return this.orderService.getOrdersForUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết hóa đơn' })
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.orderService.getOrderForUser(id, req.user.userId);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Thanh toán giả lập PENDING → PAID' })
  pay(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.orderService.payOrder(id, req.user.userId);
  }
}
