import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/repository/UserRepository', () => ({
  UserRepository: {
    findByEmail: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}));

describe('Authentication - sign in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'test-secret');
  });

  it('Authentication - wrong password rejected', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/auth/signin/route');
    const { UserRepository } = await import('@/lib/repository/UserRepository');
    const bcrypt = await import('bcryptjs');

    vi.mocked(UserRepository.findByEmail).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: 'hashed',
      emailVerified: true,
      mustChangePassword: false,
      role: 'USER',
      companyId: null,
      banned: false,
      banReason: null,
      bannedAt: null,
      name: 'Test User',
    } as never);

    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never);

    const req = new Request('http://localhost/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'wrongpass',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
