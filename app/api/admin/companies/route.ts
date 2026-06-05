import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { CompanyRepository } from '@/lib/repository/CompanyRepository';
import { UserRepository } from '@/lib/repository/UserRepository';
import { ZodError } from 'zod';
import { onboardCompany } from '@/lib/services/company/onBoardCompany';
import {
  adminCompanyPayloadSchema,
  adminCompanyUpdateSchema,
  adminIdSchema,
  getZodErrorCode,
} from '@/lib/validators/schemas';

export async function GET(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const companies = await CompanyRepository.findMany();
    return NextResponse.json({ ok: true, companies });
  } catch (err) {
    console.error('GET /api/admin/companies error:', err);
    return NextResponse.json({ ok: false, error: 'db_error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const body = adminCompanyUpdateSchema.parse(await req.json());
    const { id, name, email, maintenancePercent } = body;

    const existing = await CompanyRepository.findById(id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      );
    }

    const updated = await CompanyRepository.update(id, {
      name,
      email,
      maintenancePercent,
    });

    return NextResponse.json({ ok: true, company: updated });
  } catch (err) {
    console.error('PATCH /api/admin/companies error:', err);

    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: getZodErrorCode(err) },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'update_error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const rawBody = await req.json();
    const body = adminCompanyPayloadSchema.parse(rawBody);
    const localeCookie = req.headers
      .get('cookie')
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith('locale='))
      ?.split('=')[1];
    const localeHeader = req.headers.get('x-locale');
    const locale =
      body.locale === 'en'
        ? 'en'
        : localeHeader === 'en'
          ? 'en'
          : localeCookie === 'en'
            ? 'en'
            : 'bg';
    const { name, email, maintenancePercent } = body;

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: 'email_in_use' },
        { status: 409 },
      );
    }

    const { company, mailInfo } = await onboardCompany({
      name,
      email,
      maintenancePercent,
      locale,
    });

    return NextResponse.json({ ok: true, company, mailInfo });
  } catch (err) {
    console.error('POST /api/admin/companies error:', err);

    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: getZodErrorCode(err) },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'create_error' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.resp;

  try {
    const { id } = adminIdSchema.parse(await req.json());

    const company = await CompanyRepository.findById(id);
    if (!company) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404 },
      );
    }

    const ownerId = company.ownerId;

    await CompanyRepository.delete(id);

    if (ownerId) {
      await UserRepository.delete(ownerId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/companies error:', err);

    if (err instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: getZodErrorCode(err) },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, error: 'delete_error' },
      { status: 500 },
    );
  }
}
