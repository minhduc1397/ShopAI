import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Tra User bằng email, so khớp mật khẩu đã hash
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      // Chung một thông báo cho "sai email" và "sai mật khẩu" (chống User Enumeration)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // Hồ sơ người dùng đang đăng nhập + thống kê đơn — phục vụ tab "Tài khoản" trên Mobile
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      // Token còn hạn nhưng user đã bị xóa khỏi DB → coi như hết phiên
      throw new UnauthorizedException('Tài khoản không còn tồn tại');
    }
    const [orderCount, paid] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { total: true },
      }),
    ]);
    return { ...user, orderCount, totalSpent: paid._sum.total ?? 0 };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email đã được đăng ký');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.create({
      data: { email: dto.email, password: hash, name: dto.name ?? null },
    });
    // Đăng ký xong → đăng nhập luôn (cùng contract { accessToken, user })
    return this.login({ email: dto.email, password: dto.password });
  }
}
