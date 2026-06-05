import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  createCompanyStripeAccount,
  rollbackStripeAccount,
} from '@/lib/services/stripe/companyStripe';

export async function POST(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = await req.json();
    const { name, email, password, maintenancePercent } = body;

    if (!name || !email || !password || maintenancePercent === undefined) {
      return NextResponse.json(
        {
          error:
            'Missing fields (name, email, password, maintenancePercent required)',
        },
        { status: 400 },
      );
    }

    const maintenance = Number(maintenancePercent);
    if (!Number.isFinite(maintenance) || maintenance < 0 || maintenance > 100) {
      return NextResponse.json(
        { error: 'Invalid maintenancePercent (0-100)' },
        { status: 400 },
      );
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      email,
      password: hashed,
      name,
      role: 'COMPANY',
      emailVerified: true,
      mustChangePassword: false,
    });

    let company;
    let stripeAccountId: string | null = null;

    try {
      stripeAccountId = await createCompanyStripeAccount({
        email,
        companyName: name,
      });

      company = await CompanyRepository.create({
        ownerId: user.id,
        name,
        email,
        maintenancePercent: maintenance,
        stripeAccountId,
      });

      // Update user with companyId
      await UserRepository.update(user.id, {
        companyId: company.id,
      });
    } catch (e) {
      if (company?.id) {
        try {
          await CompanyRepository.delete(company.id);
        } catch (companyDeleteErr) {
          console.error(
            'Failed to rollback company after company create error:',
            companyDeleteErr,
          );
        }
      }

      try {
        await UserRepository.delete(user.id);
      } catch (delErr) {
        console.error(
          'Failed to rollback user after company create error:',
          delErr,
        );
      }

      if (stripeAccountId) {
        await rollbackStripeAccount(stripeAccountId);
      }

      console.warn('Create company failed:', e);

      return NextResponse.json(
        { error: 'Failed creating company. Check uniqueness and schema.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, userId: user.id, companyId: company.id });
  } catch (err) {
    console.error('/api/admin/company POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
