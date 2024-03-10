/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useTitle } from '$app/common/hooks/useTitle';
import { DataTable } from '$app/components/DataTable';
import { Default } from '$app/components/layouts/Default';
import { useTranslation } from 'react-i18next';
import { useActions } from '../edit/components/Actions';
import {
  defaultColumns,
  useAllInvoiceColumns,
  useInvoiceColumns,
} from '../common/hooks/useInvoiceColumns';
import { DataTableColumnsPicker } from '$app/components/DataTableColumnsPicker';
import { useInvoiceFilters } from '../common/hooks/useInvoiceFilters';
import { ImportButton } from '$app/components/import/ImportButton';
import { Guard } from '$app/common/guards/Guard';
import { permission } from '$app/common/guards/guards/permission';
import { or } from '$app/common/guards/guards/or';
import { useCustomBulkActions } from '../common/hooks/useCustomBulkActions';
import {
  InvoiceSlider,
  invoiceSliderAtom,
  invoiceSliderVisibilityAtom,
} from '../common/components/InvoiceSlider';
import { useAtom } from 'jotai';
import { useInvoiceQuery } from '$app/common/queries/invoices';
import { useEffect, useState } from 'react';
import { useHasPermission } from '$app/common/hooks/permissions/useHasPermission';
import { useDisableNavigation } from '$app/common/hooks/useDisableNavigation';
import { useDateRangeColumns } from '../common/hooks/useDateRangeColumns';

export default function Invoices() {
  const { documentTitle } = useTitle('invoices');

  const [t] = useTranslation();

  const pages = [{ name: t('invoices'), href: '/invoices' }];

  const hasPermission = useHasPermission();
  const disableNavigation = useDisableNavigation();

  const [sliderInvoiceId, setSliderInvoiceId] = useState<string>('');
  const [invoiceSlider, setInvoiceSlider] = useAtom(invoiceSliderAtom);
  const [invoiceSliderVisibility, setInvoiceSliderVisibility] = useAtom(
    invoiceSliderVisibilityAtom
  );

  const { data: invoiceResponse } = useInvoiceQuery({ id: sliderInvoiceId });

  const actions = useActions();
  const filters = useInvoiceFilters();
  const columns = useInvoiceColumns();
  const invoiceColumns = useAllInvoiceColumns();
  const dateRangeColumns = useDateRangeColumns();
  const customBulkActions = useCustomBulkActions();

  useEffect(() => {
    if (invoiceResponse && invoiceSliderVisibility) {
      setInvoiceSlider(invoiceResponse);
    }
  }, [invoiceResponse, invoiceSliderVisibility]);

  useEffect(() => {
    return () => setInvoiceSliderVisibility(false);
  }, []);

  return (
    <Default
      title={documentTitle}
      breadcrumbs={pages}
      docsLink="en/invoices"
      withoutBackButton
    >
      <DataTable
        resource="invoice"
        endpoint="/api/v1/invoices?include=client.group_settings&without_deleted_clients=true&sort=id|desc"
        columns={columns}
        bulkRoute="/api/v1/invoices/bulk"
        linkToCreate="/invoices/create"
        linkToEdit="/invoices/:id/edit"
        withResourcefulActions
        customActions={actions}
        customBulkActions={customBulkActions}
        customFilters={filters}
        customFilterPlaceholder="status"
        rightSide={
          <Guard
            type="component"
            component={<ImportButton route="/invoices/import" />}
            guards={[
              or(permission('create_invoice'), permission('edit_invoice')),
            ]}
          />
        }
        leftSideChevrons={
          <DataTableColumnsPicker
            table="invoice"
            columns={invoiceColumns as unknown as string[]}
            defaultColumns={defaultColumns}
          />
        }
        linkToCreateGuards={[permission('create_invoice')]}
        hideEditableOptions={!hasPermission('edit_invoice')}
        onTableRowClick={(invoice) => {
          setSliderInvoiceId(invoice.id);
          setInvoiceSliderVisibility(true);
        }}
        dateRangeColumns={dateRangeColumns}
      />

      {!disableNavigation('invoice', invoiceSlider) && <InvoiceSlider />}
    </Default>
  );
}
