import { Client } from '$app/common/interfaces/client';
import { Invoice } from '$app/common/interfaces/invoice';

interface Params {
    invoice?: Invoice;
    client?: Client;
}

export function isInternalInvoiceEditingLocked({
    invoice,
    client,
}: Params): boolean {
    const isInternal = Boolean(invoice?.is_internal ?? client?.is_internal);

    if (!isInternal) {
        return false;
    }

    return invoice?.approval_status === 'approved';
}

