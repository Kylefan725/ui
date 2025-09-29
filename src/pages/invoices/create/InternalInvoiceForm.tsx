/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2025. Invoice Ninja LLC
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Card } from '$app/components/cards';
import { useTranslation } from 'react-i18next';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { CreateInvoiceContext } from './Create';
import { useInvoiceUtilities } from './hooks/useInvoiceUtilities';
import { ClientSelector } from '../common/components/ClientSelector';
import { InvoiceDetails } from '../common/components/InvoiceDetails';
import { ProductsTable } from '../common/components/ProductsTable';
import { InvoiceTotals } from '../common/components/InvoiceTotals';
import { TabGroup } from '$app/components/TabGroup';
import { Spinner } from '$app/components/Spinner';
import { useProductColumns } from '../common/hooks/useProductColumns';
import { useTaskColumns } from '../common/hooks/useTaskColumns';
import { InvoiceItemType } from '$app/common/interfaces/invoice-item';
import { Banner } from '$app/components/Banner';

export default function InternalInvoiceForm() {
  const [t] = useTranslation();

  const {
    invoice,
    setInvoice,
    errors,
    isDefaultFooter,
    isDefaultTerms,
    setIsDefaultFooter,
    setIsDefaultTerms,
    client,
    invoiceSum,
  } = useOutletContext<CreateInvoiceContext>();

  const [searchParams] = useSearchParams();

  const productColumns = useProductColumns();
  const taskColumns = useTaskColumns();

  const {
    handleChange,
    handleInvitationChange,
    handleLineItemChange,
    handleLineItemPropertyChange,
    handleCreateLineItem,
    handleDeleteLineItem,
  } = useInvoiceUtilities({ client });

  const resetInvoiceForm = () => {
    handleChange('client_id', '');
    handleChange('location_id', '');
    return true;
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12">
        <Banner variant="orange" id="internal-invoice-banner">
          {t('internal_invoice')}:{' '}
          {t('select_an_internal_client_and_contact_to_proceed')}
        </Banner>
      </div>
      <Card className="col-span-12 xl:col-span-4 h-max shadow-sm" withContainer>
        <ClientSelector
          resource={invoice}
          onChange={(id) => handleChange('client_id', id)}
          onLocationChange={(id) => handleChange('location_id', id)}
          onClearButtonClick={resetInvoiceForm}
          onContactCheckboxChange={handleInvitationChange}
          errorMessage={errors?.errors.client_id}
          disableWithSpinner={searchParams.get('action') === 'create'}
          internalOnly
        />
        <div className="text-sm mt-2" data-cy="internalClientHint">
          {t('hint')}:{' '}
          {t('at_least_one_contact_is_required_for_internal_invoices')}
        </div>
      </Card>

      <InvoiceDetails
        invoice={invoice}
        handleChange={handleChange}
        errors={errors}
      />

      <div className="col-span-12">
        <TabGroup
          tabs={[t('products'), t('tasks')]}
          defaultTabIndex={searchParams.get('table') === 'tasks' ? 1 : 0}
        >
          <div>
            {invoice ? (
              <ProductsTable
                type="product"
                resource={invoice}
                shouldCreateInitialLineItem={
                  searchParams.get('table') !== 'tasks'
                }
                items={invoice.line_items.filter((item) =>
                  [
                    InvoiceItemType.Product,
                    InvoiceItemType.UnpaidFee,
                    InvoiceItemType.PaidFee,
                    InvoiceItemType.LateFee,
                  ].includes(item.type_id)
                )}
                columns={productColumns}
                relationType="client_id"
                onLineItemChange={handleLineItemChange}
                onSort={(lineItems) => handleChange('line_items', lineItems)}
                onLineItemPropertyChange={handleLineItemPropertyChange}
                onCreateItemClick={() =>
                  handleCreateLineItem(InvoiceItemType.Product)
                }
                onDeleteRowClick={handleDeleteLineItem}
              />
            ) : (
              <Spinner />
            )}
          </div>

          <div>
            {invoice ? (
              <ProductsTable
                type="task"
                resource={invoice}
                shouldCreateInitialLineItem={
                  searchParams.get('table') === 'tasks'
                }
                items={invoice.line_items.filter(
                  (item) => item.type_id === InvoiceItemType.Task
                )}
                columns={taskColumns}
                relationType="client_id"
                onLineItemChange={handleLineItemChange}
                onSort={(lineItems) => handleChange('line_items', lineItems)}
                onLineItemPropertyChange={handleLineItemPropertyChange}
                onCreateItemClick={() =>
                  handleCreateLineItem(InvoiceItemType.Task)
                }
                onDeleteRowClick={handleDeleteLineItem}
              />
            ) : (
              <Spinner />
            )}
          </div>
        </TabGroup>
      </div>

      {invoice && (
        <InvoiceTotals
          relationType="client_id"
          resource={invoice}
          invoiceSum={invoiceSum}
          onChange={(property, value) =>
            handleChange(property, value as string)
          }
        />
      )}
    </div>
  );
}
