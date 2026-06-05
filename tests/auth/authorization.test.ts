import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireCompanyUser } from '@/lib/auth/requireCompany';

const mockGetAuthUser = vi.fn();

vi.mock('@/lib/auth', () => ({
  getAuthUser: () => mockGetAuthUser(),
}));

vi.mock('@/lib/repository/UserRepository', () => ({
  UserRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('@/lib/auth/getTokenFromRequest', () => ({
  getTokenFromRequest: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
  JsonWebTokenError: class JsonWebTokenError extends Error {},
  TokenExpiredError: class TokenExpiredError extends Error {},
}));

describe('Authorization - role access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('JWT_SECRET', 'test-secret');
  });

  it('Authorization - non-admin denied', async () => {
    vi.resetModules();
    const { requireAdmin } = await import('@/lib/auth/requireAdmin');
    const { getTokenFromRequest } = await import('@/lib/auth/getTokenFromRequest');
    const { UserRepository } = await import('@/lib/repository/UserRepository');
    const jwt = await import('jsonwebtoken');

    vi.mocked(getTokenFromRequest).mockReturnValue('token');
    vi.mocked(jwt.default.verify).mockReturnValue({ userId: 1 } as never);
    vi.mocked(UserRepository.findById).mockResolvedValue({
      id: 1,
      role: 'USER',
    } as never);

    const res = await requireAdmin(new Request('http://localhost'));
    expect(res.ok).toBe(false);
    expect(res.resp.status).toBe(403);
  });

  it('Authorization - company access allowed', async () => {
    mockGetAuthUser.mockResolvedValue({
      id: 7,
      companyId: 3,
      role: 'COMPANY',
    });

    const result = await requireCompanyUser();
    expect(result.companyId).toBe(3);
  });
});
