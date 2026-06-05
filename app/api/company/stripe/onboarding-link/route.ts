import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireAuthUserFromRequest } from '@/lib/auth';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import {
  createCompanyStripeAccount,
  createCompanyStripeOnboardingLink,
} from '@/lib/services/stripe/companyStripe';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUserFromRequest(req);

    const role =
      typeof user?.role === 'string' ? user.role.toLowerCase().trim() : null;

    if (role !== 'company') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden' },
        { status: 403 },
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { ok: false, error: 'No company attached to this account' },
        { status: 400 },
      );
    }

    const company = await CompanyRepository.findById(Number(user.companyId));

    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 },
      );
    }

    let stripeAccountId = company.stripeAccountId;

    if (!stripeAccountId) {
      stripeAccountId = await createCompanyStripeAccount({
        email: company.email,
        companyName: company.name || company.email,
      });

      await CompanyRepository.update(company.id, {
        stripeAccountId,
      });
    }

    const onboardingUrl = await createCompanyStripeOnboardingLink(
      stripeAccountId,
    );

    return NextResponse.json({
      ok: true,
      url: onboardingUrl,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: err.message },
        { status: err.status },
      );
    }

    console.error('Company Stripe onboarding-link error:', err);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create onboarding link',
      },
      { status: 500 },
    );
  }
}
