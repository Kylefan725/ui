/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2025. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';

export function useSetSubmitToSzDate() {
  const [t] = useTranslation();
  const queryClient = useQueryClient();

  const setSubmitToSzDate = async (invoiceId: string, date: string) => {
    toast.processing();

    await request(
      'POST',
      endpoint('/api/v1/invoices/:id/set-submit-to-sz-date', {
        id: invoiceId,
      }),
      {
        submit_to_sz_date: date,
      }
    );

    // Invalidate invoice queries to refresh data
    await queryClient.invalidateQueries('/api/v1/invoices');

    toast.success(t('submit_to_sz_date_set_successfully') ?? undefined);
  };

  return { setSubmitToSzDate };
}
