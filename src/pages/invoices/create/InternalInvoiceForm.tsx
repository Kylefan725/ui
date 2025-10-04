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
import InvoiceTab from '../edit/components/InvoiceTab';
import { Banner } from '$app/components/Banner';
import { isInternalInvoiceEditingLocked } from '../edit/utils/isInternalInvoiceEditingLocked';

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
  const tableParam = searchParams.get('table');

  const tabDefinitions = [
    { key: 'invoice', label: t('invoice') },
    { key: 'products', label: t('products') },
    { key: 'tasks', label: t('tasks') },
  ];

  const tabLabels = tabDefinitions.map((definition) => definition.label);

  const defaultTabIndex = (() => {
    if (!tableParam) {
      return 0;
    }

    const matchedIndex = tabDefinitions.findIndex(
      (definition) => definition.key === tableParam
    );

    if (matchedIndex >= 0) {
      return matchedIndex;
    }

    return 0;
  })();

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
      {invoice &&
        (invoice.uploaded_document_id ? (
          <div className="col-span-12">
            <Banner variant="orange" id="internal-invoice-summary-hint">
              {t('internal_invoice_uploaded_doc_hint')}
            </Banner>
          </div>
        ) : (
          <div className="col-span-12">
            <Banner variant="orange" id="internal-invoice-generated-hint">
              {t('internal_invoice_generated_hint')}
            </Banner>
          </div>
        ))}
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
        <TabGroup tabs={tabLabels} defaultTabIndex={defaultTabIndex}>
          {tabDefinitions.map((definition) => {
            if (definition.key === 'invoice') {
              return (
                <div key={definition.key}>
                  {invoice ? (
                    <InvoiceTab
                      invoice={invoice}
                      setInvoice={setInvoice}
                      client={client}
                      errors={errors}
                      handleChange={handleChange}
                      handleLineItemPropertyChange={
                        handleLineItemPropertyChange
                      }
                      handleCreateLineItem={handleCreateLineItem}
                      handleDeleteLineItem={handleDeleteLineItem}
                      isEditLocked={isInternalInvoiceEditingLocked({ invoice, client })}
                    />
                  ) : (
                    <Spinner />
                  )}
                </div>
              );
            }

            if (definition.key === 'products') {
              return (
                <div key={definition.key}>
                  {invoice ? (
                    <ProductsTable
                      type="product"
                      resource={invoice}
                      shouldCreateInitialLineItem={tableParam !== 'tasks'}
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
                      onSort={(lineItems) =>
                        handleChange('line_items', lineItems)
                      }
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
              );
            }

            return (
              <div key={definition.key}>
                {invoice ? (
                  <ProductsTable
                    type="task"
                    resource={invoice}
                    shouldCreateInitialLineItem={tableParam === 'tasks'}
                    items={invoice.line_items.filter(
                      (item) => item.type_id === InvoiceItemType.Task
                    )}
                    columns={taskColumns}
                    relationType="client_id"
                    onLineItemChange={handleLineItemChange}
                    onSort={(lineItems) =>
                      handleChange('line_items', lineItems)
                    }
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
            );
          })}
        </TabGroup>
      </div>

      {invoice &&
        invoice.uploaded_document_id &&
        (invoice.line_items?.length ?? 0) === 0 && (
          <div className="col-span-12">
            <Banner variant="red" id="internal-invoice-no-lines-warning">
              {t('internal_invoice_summary_required_with_upload')}
            </Banner>
          </div>
        )}

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
