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
import { DataTable } from '$app/components/DataTable';
import { useParams } from 'react-router-dom';
import {
  defaultColumns,
  useAllInvoiceColumns,
  useInvoiceColumns,
} from '$app/pages/invoices/common/hooks/useInvoiceColumns';
import { useActions } from '$app/pages/invoices/edit/components/Actions';
import { useCustomBulkActions } from '$app/pages/invoices/common/hooks/useCustomBulkActions';
import { useHasPermission } from '$app/common/hooks/permissions/useHasPermission';
import { permission } from '$app/common/guards/guards/permission';
import { useFooterColumns } from '$app/pages/invoices/common/hooks/useFooterColumns';
import { useSetAtom } from 'jotai';
import { confirmActionModalAtom } from '$app/pages/recurring-invoices/common/components/ConfirmActionModal';
import { useState } from 'react';
import { DeleteInvoicesConfirmationModal } from '$app/pages/invoices/common/components/DeleteInvoicesConfirmationModal';
import { useClientQuery } from '$app/common/queries/clients';
import { DataTableColumnsPicker } from '$app/components/DataTableColumnsPicker';
import { DataTableFooterColumnsPicker } from '$app/components/DataTableFooterColumnsPicker';
import { useReactSettings } from '$app/common/hooks/useReactSettings';
import { Button } from '$app/components/forms';
import { MdDownload } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

export default function Invoices() {
  const [t] = useTranslation();
  const { id } = useParams();

  const hasPermission = useHasPermission();
  const { data: client } = useClientQuery({ id, enabled: !!id });

  const actions = useActions();
  const columns = useInvoiceColumns();
  const invoiceColumns = useAllInvoiceColumns();
  const { footerColumns, allFooterColumns } = useFooterColumns();
  const customBulkActions = useCustomBulkActions();
  const reactSettings = useReactSettings();

  const setIsConfirmActionModalOpen = useSetAtom(confirmActionModalAtom);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const createInvoiceLink = client?.is_internal
    ? route('/invoices/create?internal=true&client=:id', { id })
    : route('/invoices/create?client=:id', { id });

  const escapeCsvValue = (value: string): string => {
    if (value == null) return '';
    const needsQuotes = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const handleExportToCsv = () => {
    try {
      const table = document.querySelector('[data-cy="dataTable"]');
      if (!table) return;

      const rows = Array.from(
        table.querySelectorAll('tbody tr.table-row')
      ) as HTMLTableRowElement[];

      // Build headers from currently visible columns (matches DataTable rendering order), excluding Status
      const exportColumns = columns.filter((c) => c.id !== 'status_id');
      const headers = exportColumns.map((c) =>
        typeof c.label === 'string' ? c.label : ''
      );

      const hasEdit = hasPermission('edit_invoice');
      const hasActionsCell = hasEdit;
      const statusIndex = columns.findIndex((c) => c.id === 'status_id');

      const dataRows = rows.map((row) => {
        const tds = Array.from(
          row.querySelectorAll('td')
        ) as HTMLTableCellElement[];

        // Remove checkbox cell at start if edit options are visible
        if (hasEdit && tds.length) {
          tds.shift();
        }

        // Remove actions cell at end if actions are rendered
        if (hasActionsCell && tds.length) {
          tds.pop();
        }

        // Exclude Status column value by aligning with original columns order
        return tds
          .filter((_, idx) => idx !== statusIndex)
          .map((td) => td.innerText.trim());
      });

      const csvLines: string[] = [];
      csvLines.push(headers.map(escapeCsvValue).join(','));
      dataRows.forEach((row) => {
        csvLines.push(row.map(escapeCsvValue).join(','));
      });

      const blob = new Blob([csvLines.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `invoices-client-${id || 'unknown'}-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, '-')}.csv`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      // no-op; optional: could show a toast
    }
  };

  return (
    <>
      <DataTable
        resource="invoice"
        endpoint={route(
          '/api/v1/invoices?include=client.group_settings&client_id=:id&sort=id|desc',
          { id }
        )}
        columns={columns}
        footerColumns={footerColumns}
        customActions={actions}
        customBulkActions={customBulkActions}
        withResourcefulActions
        bulkRoute="/api/v1/invoices/bulk"
        linkToCreate={createInvoiceLink}
        linkToEdit="/invoices/:id/edit"
        excludeColumns={['client_id']}
        linkToCreateGuards={[permission('create_invoice')]}
        hideEditableOptions={!hasPermission('edit_invoice')}
        onDeleteBulkAction={(selected) => {
          setSelectedInvoiceIds(selected);
          setIsConfirmActionModalOpen(true);
        }}
        withoutPerPageAsPreference
        withoutPageAsPreference
        rightSide={
          <div className="flex items-center space-x-2">
            <Button
              behavior="button"
              onClick={handleExportToCsv}
              disableWithoutIcon
            >
              <div className="flex items-center space-x-2">
                <MdDownload size={20} />
                <span>{t('export')}</span>
              </div>
            </Button>

            {Boolean(reactSettings.show_table_footer) && (
              <DataTableFooterColumnsPicker
                table="invoice"
                columns={allFooterColumns}
              />
            )}

            <DataTableColumnsPicker
              table="invoice"
              columns={invoiceColumns as unknown as string[]}
              defaultColumns={defaultColumns}
            />
          </div>
        }
      />

      <DeleteInvoicesConfirmationModal
        selectedInvoiceIds={selectedInvoiceIds}
        setSelectedInvoiceIds={setSelectedInvoiceIds}
      />
    </>
  );
}
