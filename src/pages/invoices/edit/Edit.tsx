/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useReactSettings } from '$app/common/hooks/useReactSettings';
import { InvoiceItemType } from '$app/common/interfaces/invoice-item';
import { Spinner } from '$app/components/Spinner';
import { TabGroup } from '$app/components/TabGroup';
import { useAtom } from 'jotai';
import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useNavigate,
  useOutletContext,
  useSearchParams,
} from 'react-router-dom';
import { invoiceSumAtom } from '../common/atoms';
import { ClientSelector } from '../common/components/ClientSelector';
import { InvoiceDetails } from '../common/components/InvoiceDetails';
import { InvoiceFooter } from '../common/components/InvoiceFooter';
import { InvoicePreview } from '../common/components/InvoicePreview';
import { InvoiceTotals } from '../common/components/InvoiceTotals';
import { ProductsTable } from '../common/components/ProductsTable';
import { useProductColumns } from '../common/hooks/useProductColumns';
import { useTaskColumns } from '../common/hooks/useTaskColumns';
import { useInvoiceUtilities } from '../create/hooks/useInvoiceUtilities';
import { Card } from '$app/components/cards';
import { InvoiceStatus as InvoiceStatusBadge } from '../common/components/InvoiceStatus';
// import { Alert } from '$app/components/Alert';
import { Badge } from '$app/components/Badge';
import { Icon } from '$app/components/icons/Icon';
import {
  ExternalLink as ExternalLinkIcon,
  FileText as FileTextIcon,
  Info as InfoIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
} from 'react-feather';
import { useDateTime } from '$app/common/hooks/useDateTime';
import {
  ChangeTemplateModal,
  useChangeTemplate,
} from '$app/pages/settings/invoice-design/pages/custom-designs/components/ChangeTemplate';
import { Invoice as IInvoice, Invoice } from '$app/common/interfaces/invoice';
import { InvoiceItem } from '$app/common/interfaces/invoice-item';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { Client } from '$app/common/interfaces/client';
import { Assigned } from '$app/components/Assigned';
import { route } from '$app/common/helpers/route';
import { Project } from '$app/common/interfaces/project';
import { InputLabel } from '$app/components/forms';
import { useColorScheme } from '$app/common/colors';
import { Banner } from '$app/components/Banner';
import InvoiceTab from './components/InvoiceTab';
import { ResubmitInvoiceButton } from './components/ResubmitInvoiceButton';
import { ResendApprovalButton } from './components/ResendApprovalButton';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { $refetch } from '$app/common/hooks/useRefetch';
import { isInternalInvoiceEditingLocked } from './utils/isInternalInvoiceEditingLocked';
import { defaultHeaders } from '$app/common/queries/common/headers';
import { toast } from '$app/common/helpers/toast/toast';
import { useQueryClient } from 'react-query';

export interface Context {
  invoice: Invoice | undefined;
  setInvoice: Dispatch<SetStateAction<Invoice | undefined>>;
  isDefaultTerms: boolean;
  setIsDefaultTerms: Dispatch<SetStateAction<boolean>>;
  isDefaultFooter: boolean;
  setIsDefaultFooter: Dispatch<SetStateAction<boolean>>;
  errors: ValidationBag | undefined;
  client: Client | undefined;
}

export default function Edit() {
  const [t] = useTranslation();

  const colors = useColorScheme();
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const context: Context = useOutletContext();
  const {
    invoice,
    setInvoice,
    isDefaultTerms,
    setIsDefaultTerms,
    isDefaultFooter,
    setIsDefaultFooter,
    errors,
    client,
  } = context;

  const taskColumns = useTaskColumns();
  const reactSettings = useReactSettings();
  const productColumns = useProductColumns();

  const [invoiceSum] = useAtom(invoiceSumAtom);

  const {
    handleChange,
    handleInvitationChange,
    handleLineItemChange,
    handleLineItemPropertyChange,
    handleCreateLineItem,
    handleDeleteLineItem,
  } = useInvoiceUtilities({ client });

  const { changeTemplateVisible, setChangeTemplateVisible } =
    useChangeTemplate();

  const queryClient = useQueryClient();

  const isInternalInvoice = Boolean(client?.is_internal);
  const hasUploadedDocument = invoice?.uploaded_document_id;
  const hasNoLineItems = (invoice?.line_items?.length ?? 0) === 0;
  const dateTime = useDateTime({ withTimezone: true, formatOnlyDate: true });

  const approvalStatus = invoice?.approval_status;
  const approverName = invoice?.approver_name;
  const approvedAt = invoice?.approved_at;
  const rejectedAt = invoice?.rejected_at;
  const rejectionReason = invoice?.rejection_reason;
  const approvalRecord = invoice?.approval_record;

  const downloadApprovalDocument = (hash: string | null | undefined) => {
    if (!hash) {
      return;
    }

    toast.processing();

    queryClient
      .fetchQuery(
        ['/api/v1/documents', hash],
        () =>
          request(
            'GET',
            endpoint('/documents/:hash', { hash }),
            { headers: defaultHeaders() },
            { responseType: 'arraybuffer' }
          ),
        { staleTime: Infinity }
      )
      .then((response) => {
        const blob = new Blob([response.data], {
          type: response.headers['content-type'],
        });
        const url = URL.createObjectURL(blob);

        window.open(url, '_blank');
        toast.dismiss();
      })
      .catch(() => {
        toast.error('error_downloading_document');
      });
  };

  const approvalStatusCopy = (() => {
    if (!approvalStatus) {
      return undefined;
    }

    if (approvalStatus === 'approved') {
      return {
        title: t('approval_approved_callout'),
        icon: CheckCircleIcon,
        iconColor: 'text-green-500',
        badgeVariant: 'green' as const,
        description: t('approval_status_approved_help'),
      };
    }

    if (approvalStatus === 'rejected') {
      return {
        title: t('approval_rejected_callout'),
        icon: XCircleIcon,
        iconColor: 'text-red-500',
        badgeVariant: 'red' as const,
        description: t('approval_status_rejected_help'),
      };
    }

    return {
      title: t('approval_pending_callout'),
      icon: ClockIcon,
      iconColor: 'text-yellow-500',
      badgeVariant: 'yellow' as const,
      description: t('approval_status_pending_help'),
    };
  })();

  const refreshInvoice = () => {
    if (!invoice?.id) {
      return;
    }

    request('GET', endpoint('/api/v1/invoices/:id', { id: invoice.id })).then(
      (response) => {
        if (response.data?.data) {
          setInvoice(response.data.data as Invoice);
          $refetch(['invoices']);
        }
      }
    );
  };

  const renderApprovalTimeline = () => {
    if (!isInternalInvoice || !approvalStatusCopy) {
      return null;
    }

    return (
      <Card
        className="col-span-12 lg:col-span-8 px-6 py-5 shadow-sm"
        style={{ borderColor: colors.$24 }}
        title={t('approval_details')}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Icon
                  element={approvalStatusCopy.icon}
                  className={approvalStatusCopy.iconColor}
                  size={24}
                />

                <div className="flex flex-col gap-1">
                  <span className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t('approval_status')}
                  </span>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant={approvalStatusCopy.badgeVariant}>
                      {t(approvalStatus ?? 'pending')}
                    </Badge>

                    {approvalStatus === 'pending' &&
                      invoice?.requires_approval && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                          <Icon element={InfoIcon} size={16} />
                          {t('approval_status_pending_help')}
                        </span>
                      )}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                {approvalStatusCopy.description}
              </p>
            </div>

            {approvalRecord?.approved_document_hash && (
              <button
                type="button"
                onClick={() =>
                  downloadApprovalDocument(
                    approvalRecord?.approved_document_hash
                  )
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-500"
                aria-label={String(t('view_signed_document'))}
              >
                <Icon element={FileTextIcon} size={18} />
                {t('view_signed_document')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              withoutBodyPadding
              className="border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {approvalStatus === 'rejected'
                    ? t('rejected_on')
                    : t('approved_on')}
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {approvalStatus === 'rejected'
                    ? rejectedAt
                      ? dateTime(rejectedAt)
                      : t('approval_timestamps_missing')
                    : approvedAt
                    ? dateTime(approvedAt)
                    : t('approval_timestamps_missing')}
                </span>
              </div>
            </Card>

            <Card
              withoutBodyPadding
              className="border border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {approvalStatus === 'rejected'
                    ? t('rejected_by')
                    : t('approved_by')}
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {approverName || t('not_available')}
                </span>
              </div>
            </Card>
          </div>

          {approvalStatus === 'rejected' && rejectionReason && (
            <>
              <Card
                withoutBodyPadding
                className="border border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-900/20"
              >
                <div className="p-4 flex items-start gap-3">
                  <Icon
                    element={InfoIcon}
                    size={18}
                    className="text-red-600 dark:text-red-300"
                  />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                      {t('rejection_reason')}
                    </span>
                    <span className="text-sm leading-relaxed text-red-800 dark:text-red-200">
                      {rejectionReason}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <ResubmitInvoiceButton
                  invoice={invoice}
                  onSuccess={refreshInvoice}
                />
              </div>
            </>
          )}

          {approvalStatus === 'pending' && hasUploadedDocument && invoice && (
            <div className="flex justify-end">
              <ResendApprovalButton
                invoice={invoice}
                onSuccess={refreshInvoice}
              />
            </div>
          )}

          {approvalStatus === 'approved' &&
            !approvalRecord?.approved_document_hash && (
              <Card
                withoutBodyPadding
                className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50/70 dark:bg-yellow-900/20"
              >
                <div className="p-4 flex items-center gap-3 text-sm text-yellow-800 dark:text-yellow-200">
                  <Icon element={InfoIcon} size={18} />
                  {t('approval_document_missing')}
                </div>
              </Card>
            )}
        </div>
      </Card>
    );
  };

  const tableParam = searchParams.get('table');

  const isEditingLocked = isInternalInvoiceEditingLocked({ invoice, client });

  const tabDefinitions = isInternalInvoice
    ? [
        { key: 'invoice', label: t('invoice') },
        { key: 'products', label: t('products') },
        { key: 'tasks', label: t('tasks') },
      ]
    : [
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

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        {isInternalInvoice && (
          <div className="col-span-12">
            <Banner variant="orange" id="internal-invoice-edit-info">
              {t('internal_invoice')}:{' '}
              {hasUploadedDocument
                ? t('internal_invoice_uploaded_doc_hint')
                : t('internal_invoice_generated_hint')}
            </Banner>
          </div>
        )}

        {isInternalInvoice && renderApprovalTimeline()}

        {isInternalInvoice && hasUploadedDocument && hasNoLineItems && (
          <div className="col-span-12">
            <Banner
              variant="orange"
              id="internal-invoice-no-lines-edit-warning"
            >
              {t('internal_invoice_summary_required_with_upload')}{' '}
              {t('add_line_items_using_products_or_tasks_tabs_below')}
            </Banner>
          </div>
        )}

        <Card
          className="col-span-12 xl:col-span-4 h-max px-6 py-2 shadow-sm"
          style={{ borderColor: colors.$24 }}
        >
          <div className="flex flex-col space-y-4">
            {invoice && (
              <>
                <div className="flex items-center space-x-9">
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.$22 }}
                  >
                    {t('status')}
                  </span>

                  <div>
                    <InvoiceStatusBadge entity={invoice} />
                  </div>
                </div>

                {isInternalInvoice && (
                  <div className="flex items-center space-x-9">
                    <span
                      className="text-sm font-medium"
                      style={{ color: colors.$22 }}
                    >
                      {t('type')}
                    </span>

                    <div className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {t('internal_invoice')}
                    </div>
                  </div>
                )}
              </>
            )}

            <Assigned
              entityId={invoice?.project_id}
              cacheEndpoint="/api/v1/projects"
              apiEndpoint="/api/v1/projects/:id?include=client"
              componentCallbackFn={(resource: Project) => (
                <div className="flex space-x-4">
                  <span
                    className="text-sm font-medium"
                    style={{ color: colors.$22 }}
                  >
                    {t('project')}:
                  </span>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{resource.name}</span>

                    <div
                      className="cursor-pointer"
                      onClick={() =>
                        navigate(
                          route('/projects/:id', { id: invoice?.project_id })
                        )
                      }
                    >
                      <Icon
                        element={ExternalLinkIcon}
                        style={{ width: '1.17rem', height: '1.17rem' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            />

            <ClientSelector
              resource={invoice}
              onChange={(id) => handleChange('client_id', id)}
              onClearButtonClick={() => handleChange('client_id', '')}
              onLocationChange={(locationId) =>
                handleChange('location_id', locationId)
              }
              onContactCheckboxChange={handleInvitationChange}
              errorMessage={errors?.errors.client_id}
              textOnly
              readonly
            />
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
                        handleLineItemPropertyChange={(key, value, index) =>
                          handleLineItemPropertyChange(
                            key as keyof InvoiceItem,
                            value,
                            index
                          )
                        }
                        handleCreateLineItem={handleCreateLineItem}
                        handleDeleteLineItem={handleDeleteLineItem}
                        isEditLocked={isEditingLocked}
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
                        items={invoice.line_items.filter((lineItem) =>
                          [
                            InvoiceItemType.Product,
                            InvoiceItemType.UnpaidFee,
                            InvoiceItemType.PaidFee,
                            InvoiceItemType.LateFee,
                          ].includes(lineItem.type_id)
                        )}
                        columns={productColumns}
                        relationType="client_id"
                        onLineItemChange={handleLineItemChange}
                        onSort={(lineItems) =>
                          handleChange('line_items', lineItems)
                        }
                        onLineItemPropertyChange={(
                          key: string | number | symbol,
                          value,
                          index
                        ) =>
                          handleLineItemPropertyChange(
                            key as keyof InvoiceItem,
                            value,
                            index
                          )
                        }
                        onCreateItemClick={() =>
                          handleCreateLineItem(InvoiceItemType.Product)
                        }
                        onDeleteRowClick={handleDeleteLineItem}
                        isLocked={isEditingLocked}
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
                        (lineItem) => lineItem.type_id === InvoiceItemType.Task
                      )}
                      columns={taskColumns}
                      relationType="client_id"
                      onLineItemChange={handleLineItemChange}
                      onSort={(lineItems) =>
                        handleChange('line_items', lineItems)
                      }
                      onLineItemPropertyChange={(
                        key: string | number | symbol,
                        value,
                        index
                      ) =>
                        handleLineItemPropertyChange(
                          key as keyof InvoiceItem,
                          value,
                          index
                        )
                      }
                      onCreateItemClick={() =>
                        handleCreateLineItem(InvoiceItemType.Task)
                      }
                      onDeleteRowClick={handleDeleteLineItem}
                      isLocked={isEditingLocked}
                    />
                  ) : (
                    <Spinner />
                  )}
                </div>
              );
            })}
          </TabGroup>
        </div>

        <InvoiceFooter
          invoice={invoice}
          handleChange={handleChange}
          errors={errors}
          isDefaultFooter={isDefaultFooter}
          isDefaultTerms={isDefaultTerms}
          setIsDefaultFooter={setIsDefaultFooter}
          setIsDefaultTerms={setIsDefaultTerms}
        />

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

      {reactSettings?.show_pdf_preview && (
        <div className="my-4">
          {invoice && (
            <InvoicePreview
              for="invoice"
              resource={invoice}
              entity="invoice"
              relationType="client_id"
              endpoint="/api/v1/live_preview?entity=:entity"
              observable={true}
              initiallyVisible={false}
              withRemoveLogoCTA
            />
          )}
        </div>
      )}

      {invoice ? (
        <ChangeTemplateModal<IInvoice>
          entity="invoice"
          entities={[invoice]}
          visible={changeTemplateVisible}
          setVisible={setChangeTemplateVisible}
          labelFn={(invoice) => (
            <div className="flex flex-col space-y-1">
              <InputLabel>{t('number')}</InputLabel>

              <span>{invoice.number}</span>
            </div>
          )}
          bulkUrl="/api/v1/invoices/bulk"
        />
      ) : null}
    </>
  );
}
