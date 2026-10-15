import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

// Unit test: thay Prisma thật bằng object giả — không cần Database để chạy
describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
  };
  const jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('login đúng mật khẩu → trả accessToken và KHÔNG lộ password', async () => {
    const hash = await bcrypt.hash('123456', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'demo@shopai.com',
      name: 'Demo',
      password: hash,
    });

    const result = await service.login({
      email: 'demo@shopai.com',
      password: '123456',
    });

    expect(result.accessToken).toBe('signed.jwt.token');
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'demo@shopai.com',
    });
    expect(result.user).not.toHaveProperty('password');
  });

  it('login sai mật khẩu → UnauthorizedException', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'demo@shopai.com',
      password: await bcrypt.hash('123456', 4),
    });
    await expect(
      service.login({ email: 'demo@shopai.com', password: 'sai-roi' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login email không tồn tại → cùng thông báo lỗi (chống dò email)', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'ghost@shopai.com', password: '123456' }),
    ).rejects.toThrow('Email hoặc mật khẩu không đúng');
  });

  it('register email trùng → ConflictException (409)', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(
      service.register({ email: 'demo@shopai.com', password: '123456' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('register lưu mật khẩu ĐÃ HASH, không lưu plain text', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockImplementation(
      ({ data }: { data: { password: string } }) => {
        // Lần findUnique tiếp theo (bên trong login) trả về đúng user vừa tạo
        prisma.user.findUnique.mockResolvedValue({
          id: 'u2',
          email: 'new@shopai.com',
          name: null,
          password: data.password,
        });
        return Promise.resolve({ id: 'u2' });
      },
    );

    await service.register({ email: 'new@shopai.com', password: '123456' });

    const saved = prisma.user.create.mock.calls[0][0] as {
      data: { password: string };
    };
    expect(saved.data.password).not.toBe('123456');
    expect(saved.data.password.startsWith('$2')).toBe(true);
  });
});
