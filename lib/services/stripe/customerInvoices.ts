import Stripe from 'stripe';
import { Company, Reservation, Car } from '@/types/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

type CreateCustomerInvoiceInput = {
  company: Company;
  reservation: Reservation;
  car: Car;
  paymentIntentId: string;
  chargeId?: string | null;
  amountPaid: number;
  platformFee: number;
  companyEarnings: number;
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString('bg-BG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

async function getOrCreateStripeCustomer(email: string, name: string) {
  const existing = await stripe.customers.list({
    email,
    limit: 10,
  });

  const found = existing.data.find((c) => c.email === email);
  if (found) return found;

  return stripe.customers.create({
    email,
    name,
    metadata: {
      kind: 'reservation_customer',
    },
  });
}

export async function findExistingCustomerPaymentInvoice(
  reservationId: number,
  paymentIntentId: string,
) {
  const invoices = await stripe.invoices.search({
    query: `metadata["kind"]:"customer_card_payment_invoice" AND metadata["reservationId"]:"${reservationId}" AND metadata["paymentIntentId"]:"${paymentIntentId}"`,
    limit: 10,
  });

  return invoices.data[0] || null;
}

export async function createCustomerPaymentStripeInvoice(
  input: CreateCustomerInvoiceInput,
) {
  const existing = await findExistingCustomerPaymentInvoice(
    input.reservation.id,
    input.paymentIntentId,
  );

  if (existing) {
    return existing;
  }

  const customer = await getOrCreateStripeCustomer(
    input.reservation.email,
    `${input.reservation.firstName} ${input.reservation.lastName}`.trim(),
  );

  const amountCents = Math.round(Number(input.amountPaid || 0) * 100);
  console.log('amountPaid', input.amountPaid);
  console.log('amountCents', amountCents);
  // await stripe.invoiceItems.create({
  //   customer: customer.id,
  //   currency: 'eur',
  //   amount: amountCents,
  //   description: [
  //     `Резервация #${input.reservation.id}`,
  //     `${input.car.make} ${input.car.model} ${input.car.year}`,
  //     `${formatDate(input.reservation.startDate)} - ${formatDate(input.reservation.endDate)}`,
  //   ].join(' | '),
  //   metadata: {
  //     kind: 'customer_card_payment_invoice_item',
  //     companyId: String(input.company.id),
  //     reservationId: String(input.reservation.id),
  //     paymentIntentId: input.paymentIntentId,
  //     chargeId: input.chargeId || '',
  //     platformFee: Number(input.platformFee || 0).toFixed(2),
  //     companyEarnings: Number(input.companyEarnings || 0).toFixed(2),
  //   },
  // });

  // const draftInvoice = await stripe.invoices.create({
  //   customer: customer.id,
  //   collection_method: 'send_invoice',
  //   auto_advance: false,
  //   currency: 'eur',
  //   days_until_due: 0,
  //   description: `Фактура за платена резервация #${input.reservation.id}`,
  //   metadata: {
  //     kind: 'customer_card_payment_invoice',
  //     companyId: String(input.company.id),
  //     companyName: input.company.name || '',
  //     reservationId: String(input.reservation.id),
  //     paymentIntentId: input.paymentIntentId,
  //     chargeId: input.chargeId || '',
  //     carId: String(input.car.id),
  //     grossAmount: Number(input.amountPaid || 0).toFixed(2),
  //     platformFee: Number(input.platformFee || 0).toFixed(2),
  //     companyEarnings: Number(input.companyEarnings || 0).toFixed(2),
  //     customerEmail: input.reservation.email,
  //     customerName:
  //       `${input.reservation.firstName} ${input.reservation.lastName}`.trim(),
  //   },
  //   custom_fields: [
  //     {
  //       name: 'Резервация',
  //       value: `#${input.reservation.id}`,
  //     },
  //     {
  //       name: 'Автомобил',
  //       value: `${input.car.make} ${input.car.model} ${input.car.year}`,
  //     },
  //     {
  //       name: 'Период',
  //       value: `${formatDate(input.reservation.startDate)} - ${formatDate(input.reservation.endDate)}`,
  //     },
  //   ],
  // });

  const draftInvoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    auto_advance: false,
    currency: 'eur',
    days_until_due: 0,
    description: `Фактура за платена резервация #${input.reservation.id}`,
    metadata: {
      kind: 'customer_card_payment_invoice',
      companyId: String(input.company.id),
      companyName: input.company.name || '',
      reservationId: String(input.reservation.id),
      paymentIntentId: input.paymentIntentId,
      chargeId: input.chargeId || '',
      carId: String(input.car.id),
      grossAmount: Number(input.amountPaid || 0).toFixed(2),
      platformFee: Number(input.platformFee || 0).toFixed(2),
      companyEarnings: Number(input.companyEarnings || 0).toFixed(2),
      customerEmail: input.reservation.email,
      customerName:
        `${input.reservation.firstName} ${input.reservation.lastName}`.trim(),
    },
    custom_fields: [
      {
        name: 'Резервация',
        value: `#${input.reservation.id}`,
      },
      {
        name: 'Автомобил',
        value: `${input.car.make} ${input.car.model} ${input.car.year}`,
      },
      {
        name: 'Период',
        value: `${formatDate(input.reservation.startDate)} - ${formatDate(input.reservation.endDate)}`,
      },
    ],
  });

  await stripe.invoiceItems.create({
    customer: customer.id,
    invoice: draftInvoice.id,
    currency: 'eur',
    amount: amountCents,
    description: [
      `Резервация #${input.reservation.id}`,
      `${input.car.make} ${input.car.model} ${input.car.year}`,
      `${formatDate(input.reservation.startDate)} - ${formatDate(input.reservation.endDate)}`,
    ].join(' | '),
    metadata: {
      kind: 'customer_card_payment_invoice_item',
      companyId: String(input.company.id),
      reservationId: String(input.reservation.id),
      paymentIntentId: input.paymentIntentId,
      chargeId: input.chargeId || '',
      platformFee: Number(input.platformFee || 0).toFixed(2),
      companyEarnings: Number(input.companyEarnings || 0).toFixed(2),
    },
  });

  const previewInvoice = await stripe.invoices.retrieve(draftInvoice.id, {
    expand: ['lines'],
  });

  console.log(
    'invoice lines',
    previewInvoice.lines.data.map((line) => ({
      amount: line.amount,
      description: line.description,
    })),
  );

  console.log('invoice total before finalize', previewInvoice.total);

  const finalized = await stripe.invoices.finalizeInvoice(draftInvoice.id, {
    auto_advance: false,
  });

  console.log('finalized.total', finalized.total);
  console.log('finalized.amount_paid', finalized.amount_paid);
  console.log('finalized.amount_due', finalized.amount_due);

  if (finalized.status === 'paid') {
    return finalized;
  }

  if (finalized.status === 'open') {
    const paidInvoice = await stripe.invoices.pay(finalized.id, {
      paid_out_of_band: true,
    });

    console.log('paidInvoice.status', paidInvoice.status);
    console.log('paidInvoice.total', paidInvoice.total);
    console.log('paidInvoice.amount_paid', paidInvoice.amount_paid);
    console.log('paidInvoice.amount_due', paidInvoice.amount_due);
    console.log('paidInvoice.invoice_pdf', paidInvoice.invoice_pdf);
    console.log(
      'paidInvoice.hosted_invoice_url',
      paidInvoice.hosted_invoice_url,
    );

    return paidInvoice;
  }

  return finalized;
}

export async function listCompanyCustomerInvoices(companyId: number) {
  const invoices = await stripe.invoices.search({
    query: `metadata["kind"]:"customer_card_payment_invoice" AND metadata["companyId"]:"${companyId}"`,
    limit: 100,
  });

  return invoices.data
    .map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      currency: invoice.currency,
      total: invoice.total / 100,
      amount_due: invoice.amount_due / 100,
      amount_paid: invoice.amount_paid / 100,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf,
      created: invoice.created,
      due_date: invoice.due_date,
      reservationId: Number(invoice.metadata?.reservationId || 0),
      customerEmail: invoice.metadata?.customerEmail || '',
      customerName: invoice.metadata?.customerName || '',
      companyName: invoice.metadata?.companyName || '',
      grossAmount: Number(invoice.metadata?.grossAmount || 0),
      platformFee: Number(invoice.metadata?.platformFee || 0),
      companyEarnings: Number(invoice.metadata?.companyEarnings || 0),
    }))
    .sort((a, b) => b.created - a.created);
}
