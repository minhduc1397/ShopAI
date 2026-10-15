import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// AuthGuard('jwt') tự dùng JwtStrategy đã đăng ký
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
