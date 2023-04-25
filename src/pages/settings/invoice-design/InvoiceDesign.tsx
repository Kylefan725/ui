/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { route } from '$app/common/helpers/route';
import { useTitle } from '$app/common/hooks/useTitle';
import { Tab, Tabs } from '$app/components/Tabs';
import { Default } from '$app/components/layouts/Default';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

export default function InvoiceDesign() {
  const { documentTitle } = useTitle('invoice_design');
  const { t } = useTranslation();

  const tabs: Tab[] = [
    { name: t('general_settings'), href: '/settings/invoice_design' },
    {
      name: t('custom_designs'),
      href: '/settings/invoice_design/custom_designs',
      matcher: [
        () => '/settings/invoice_design/custom_designs/create',
        (params) =>
          route('/settings/invoice_design/custom_designs/:id/edit', params),
      ],
    },
  ];

  return (
    <Default title={documentTitle}>
      <Tabs tabs={tabs} />

      <div className="my-4">
        <Outlet />
      </div>
    </Default>
  );
}
