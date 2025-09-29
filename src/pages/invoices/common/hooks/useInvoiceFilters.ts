/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { SelectOption } from '$app/components/datatables/Actions';
import { useStatusThemeColorScheme } from '$app/pages/settings/user/components/StatusColorTheme';
import { useTranslation } from 'react-i18next';

export function useInvoiceFilters() {
  const [t] = useTranslation();

  const statusThemeColors = useStatusThemeColorScheme();

  const filters: SelectOption[] = [
    {
      label: t('draft'),
      value: 'draft',
      color: 'white',
      backgroundColor: '#6B7280',
      queryKey: 'client_status',
      dropdownKey: '0',
      placeHolder: 'status',
    },
    {
      label: t('paid'),
      value: 'paid',
      color: 'white',
      backgroundColor: statusThemeColors.$3 || '#22C55E',
      queryKey: 'client_status',
      dropdownKey: '0',
      placeHolder: 'status',
    },
    {
      label: t('unpaid'),
      value: 'unpaid',
      color: 'white',
      backgroundColor: '#F97316',
      queryKey: 'client_status',
      dropdownKey: '0',
      placeHolder: 'status',
    },
    {
      label: t('past_due'),
      value: 'overdue',
      color: 'white',
      backgroundColor: statusThemeColors.$5 || '#CA8A04',
      queryKey: 'client_status',
      dropdownKey: '0',
      placeHolder: 'status',
    },
    {
      label: t('cancelled'),
      value: 'cancelled',
      color: 'white',
      backgroundColor: '#000000',
      queryKey: 'client_status',
      dropdownKey: '0',
      placeHolder: 'status',
    },
    // Internal/External type filters (separate dropdown)
    {
      label: t('internal'),
      value: 'true',
      color: 'white',
      backgroundColor: '#6366F1',
      queryKey: 'is_internal',
      dropdownKey: '1',
      placeHolder: 'type',
    },
    {
      label: t('external'),
      value: 'false',
      color: 'white',
      backgroundColor: '#6B7280',
      queryKey: 'is_internal',
      dropdownKey: '1',
      placeHolder: 'type',
    },
    // Internal invoice approval status filters (separate dropdown)
    {
      label: t('pending'),
      value: 'pending',
      color: 'white',
      backgroundColor: statusThemeColors.$4 || '#F59E0B',
      queryKey: 'approval_status',
      dropdownKey: '2',
      placeHolder: 'approval',
    },
    {
      label: t('approved'),
      value: 'approved',
      color: 'white',
      backgroundColor: statusThemeColors.$3 || '#22C55E',
      queryKey: 'approval_status',
      dropdownKey: '2',
      placeHolder: 'approval',
    },
    {
      label: t('rejected'),
      value: 'rejected',
      color: 'white',
      backgroundColor: '#EF4444',
      queryKey: 'approval_status',
      dropdownKey: '2',
      placeHolder: 'approval',
    },
  ];

  return filters;
}
