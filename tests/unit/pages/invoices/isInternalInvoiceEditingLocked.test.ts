import { isInternalInvoiceEditingLocked } from '../../../../src/pages/invoices/edit/utils/isInternalInvoiceEditingLocked';

describe('isInternalInvoiceEditingLocked', () => {
  it('returns false when invoice is not internal', () => {
    expect(
      isInternalInvoiceEditingLocked({
        invoice: { is_internal: false, approval_status: 'approved' } as any,
      })
    ).toBe(false);
  });

  it('returns false when internal invoice is not approved', () => {
    expect(
      isInternalInvoiceEditingLocked({
        invoice: { is_internal: true, approval_status: 'pending' } as any,
      })
    ).toBe(false);
  });

  it('returns true when internal invoice has approved status', () => {
    expect(
      isInternalInvoiceEditingLocked({
        invoice: { is_internal: true, approval_status: 'approved' } as any,
      })
    ).toBe(true);
  });

  it('falls back to client when invoice flag missing', () => {
    expect(
      isInternalInvoiceEditingLocked({
        client: { is_internal: true } as any,
        invoice: { approval_status: 'approved' } as any,
      })
    ).toBe(true);
  });
});



