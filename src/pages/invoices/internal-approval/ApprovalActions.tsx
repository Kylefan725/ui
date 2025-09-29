/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2025. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { route } from '$app/common/helpers/route';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { Button } from '$app/components/forms';
import { Textarea } from '$app/components/forms/Textarea';
import { Badge } from '$app/components/Badge';
import { ErrorMessage } from '$app/components/ErrorMessage';

interface Props {
  invoiceId: string;
  isInternal: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | null;
}

export function ApprovalActions(props: Props) {
  const [t] = useTranslation();
  const { invoiceId, isInternal, approvalStatus } = props;

  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isInternal) {
    return null;
  }

  const approve = () => {
    setApproveError(null);
    setRejectError(null);

    if (!file) {
      setApproveError(String(t('select_file')));
      toast.error('select_file');
      return;
    }

    const form = new FormData();
    form.append('document', file);

    setBusy(true);
    toast.processing();

    request(
      'POST',
      route('/client/invoices/:id/approve', { id: invoiceId }),
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
      .then(() => toast.success('approved'))
      .finally(() => setBusy(false));
  };

  const reject = () => {
    setApproveError(null);
    setRejectError(null);

    if (!reason.trim()) {
      setRejectError(String(t('please_enter_a_value')));
      toast.error('please_enter_a_value');
      return;
    }

    setBusy(true);
    toast.processing();

    request('POST', route('/client/invoices/:id/reject', { id: invoiceId }), {
      reason,
    })
      .then(() => toast.success('rejected'))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Badge
          variant={
            approvalStatus === 'approved'
              ? 'green'
              : approvalStatus === 'rejected'
              ? 'red'
              : 'yellow'
          }
        >
          {approvalStatus === 'approved'
            ? t('approved')
            : approvalStatus === 'rejected'
            ? t('rejected')
            : t('pending')}
        </Badge>
      </div>

      {approvalStatus !== 'approved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy={busy}>
          <div>
            <input
              id="approval-file"
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFile(e.target.files?.[0] || null)
              }
              aria-describedby={
                approveError ? 'approval-file-error' : undefined
              }
            />

            <Button
              behavior="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              aria-disabled={busy}
              className="bg-primary"
            >
              {t('upload_document')}
            </Button>

            {file && (
              <span
                id="approval-file-name"
                aria-live="polite"
                className="ml-2 text-sm"
              >
                {file.name}
              </span>
            )}

            {approveError && (
              <ErrorMessage className="mt-2">
                <span id="approval-file-error">{approveError}</span>
              </ErrorMessage>
            )}

            <div className="mt-3">
              <Button
                behavior="button"
                onClick={approve}
                disabled={busy}
                aria-disabled={busy}
                className="bg-primary"
              >
                {t('approve')}
              </Button>
            </div>
          </div>

          <div>
            <Textarea
              id="reject-reason"
              label={String(t('reason'))}
              placeholder={String(t('enter_a_reason'))}
              rows={4}
              value={reason}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setReason(e.target.value)
              }
              className={rejectError ? 'border-red-500' : ''}
            />

            {rejectError && (
              <ErrorMessage className="mt-2">
                <span id="reject-reason-error">{rejectError}</span>
              </ErrorMessage>
            )}

            <div className="mt-3">
              <Button
                behavior="button"
                onClick={reject}
                disabled={busy}
                aria-disabled={busy}
                className="bg-red-500"
              >
                {t('reject')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
