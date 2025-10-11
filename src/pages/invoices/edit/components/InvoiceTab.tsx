import {
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { Invoice } from '$app/common/interfaces/invoice';
import {
  InvoiceItem,
  InvoiceItemType,
} from '$app/common/interfaces/invoice-item';
import { Inline } from '$app/components/Inline';
import { Button } from '$app/components/forms';
import { InputField } from '$app/components/forms/InputField';
import { NumberInputField } from '$app/components/forms/NumberInputField';
import { Card } from '$app/components/cards';
import { Alert } from '$app/components/Alert';
import { useColorScheme } from '$app/common/colors';
import InternalCustomDocumentUpload from './InternalCustomDocumentUpload';
import { Icon } from '$app/components/icons/Icon';
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  List,
  Info,
} from 'react-feather';
import { Client } from '$app/common/interfaces/client';

interface Props {
  invoice: Invoice;
  client?: Client;
  errors?: ValidationBag;
  setInvoice: Dispatch<SetStateAction<Invoice | undefined>>;
  handleChange: (
    property: keyof Invoice,
    value: string | number | boolean
  ) => void;
  handleLineItemPropertyChange: (
    key: keyof InvoiceItem,
    value: unknown,
    index: number
  ) => unknown;
  handleCreateLineItem: (typeId: InvoiceItem['type_id']) => unknown;
  handleDeleteLineItem: (index: number) => unknown;
  isEditLocked: boolean;
}

type SummaryItemErrorState = { description?: string; amount?: string };

export default function InvoiceTab(props: Props) {
  const [t] = useTranslation();
  const colors = useColorScheme();

  const {
    invoice,
    client,
    errors,
    setInvoice,
    handleChange,
    handleLineItemPropertyChange,
    handleCreateLineItem,
    handleDeleteLineItem,
    isEditLocked,
  } = props;

  const [validationErrors, setValidationErrors] = useState<
    Record<number, SummaryItemErrorState>
  >({});

  const initialSummaryState = useRef<{
    invoiceKey: string;
    created: boolean;
  }>({
    invoiceKey: '',
    created: false,
  });

  const invoiceKey = invoice.id ?? '__new__';

  const ensureSummaryLineDefaults = (lineItem: InvoiceItem): InvoiceItem => ({
    ...lineItem,
    product_key: '__summary__',
    quantity: 1,
    cost: Number(lineItem.cost) || 0,
    notes: lineItem.notes?.trim() ? lineItem.notes : t('total'),
    tax_name1: '',
    tax_rate1: 0,
    tax_name2: '',
    tax_rate2: 0,
    tax_name3: '',
    tax_rate3: 0,
    is_amount_discount: false,
    type_id: InvoiceItemType.Product,
  });

  const isSummaryLine = (item: InvoiceItem) =>
    item.type_id === InvoiceItemType.Product &&
    item.product_key === '__summary__';

  const summaryItems = useMemo(() => {
    return invoice.line_items.filter(isSummaryLine);
  }, [invoice.line_items]);

  const validateSummaryItem = useMemo(
    () =>
      (item: InvoiceItem): SummaryItemErrorState => {
        const errors: SummaryItemErrorState = {};

        if (!item.notes?.trim()) {
          errors.description = String(
            t('internal_invoice_summary_invalid_description')
          );
        }

        if (!item.cost || Number.isNaN(item.cost) || Number(item.cost) <= 0) {
          errors.amount = String(t('internal_invoice_summary_invalid_amount'));
        }

        return errors;
      },
    [t]
  );

  useEffect(() => {
    const nextErrors: Record<number, SummaryItemErrorState> = {};

    summaryItems.forEach((item, index) => {
      const itemErrors = validateSummaryItem(item);
      if (itemErrors.description || itemErrors.amount) {
        nextErrors[index] = itemErrors;
      }
    });

    setValidationErrors(nextErrors);
  }, [summaryItems, validateSummaryItem]);

  const handleAddSummaryItem = useCallback(() => {
    if (isEditLocked) {
      return;
    }

    setValidationErrors({});

    handleCreateLineItem(InvoiceItemType.Product);
    setInvoice((current) =>
      current
        ? ({
            ...current,
            line_items: current.line_items.map((item, index, array) =>
              index === array.length - 1
                ? ensureSummaryLineDefaults(item)
                : item
            ),
          } as Invoice)
        : current
    );
  }, [isEditLocked, setValidationErrors, handleCreateLineItem, setInvoice]);

  // Auto-create one summary line item if none exist
  useEffect(() => {
    if (initialSummaryState.current.invoiceKey !== invoiceKey) {
      initialSummaryState.current = {
        invoiceKey,
        created: false,
      };
    }

    if (
      summaryItems.length === 0 &&
      !isEditLocked &&
      !initialSummaryState.current.created
    ) {
      initialSummaryState.current.created = true;
      handleAddSummaryItem();
    }
  }, [invoiceKey, summaryItems.length, isEditLocked, handleAddSummaryItem]);

  const resolveServiceEndpoint = () =>
    invoice.id
      ? endpoint('/api/v1/invoices/:id/upload_custom_document', {
          id: invoice.id,
        })
      : '';

  const refreshInvoice = () => {
    if (!invoice.id) {
      return;
    }

    request('GET', endpoint('/api/v1/invoices/:id', { id: invoice.id })).then(
      (response) => {
        if (response.data?.data) {
          setInvoice(response.data.data as Invoice);
        }
      }
    );
  };

  const handleDeleteSummaryItem = (summaryIndex: number) => {
    if (isEditLocked) {
      return;
    }

    const summaryLineItem = summaryItems[summaryIndex];
    const invoiceIndex = invoice.line_items.indexOf(summaryLineItem);

    if (invoiceIndex > -1) {
      handleDeleteLineItem(invoiceIndex);
    }
  };

  const handleSummaryDescriptionChange = (index: number, value: string) => {
    if (isEditLocked) {
      return;
    }

    const summaryLineItem = summaryItems[index];
    const invoiceIndex = invoice.line_items.indexOf(summaryLineItem);
    const trimmedValue = value ?? '';

    if (invoiceIndex > -1) {
      handleLineItemPropertyChange('notes', trimmedValue, invoiceIndex);
      const updatedItem = ensureSummaryLineDefaults({
        ...summaryLineItem,
        notes: trimmedValue,
      });
      const itemErrors = validateSummaryItem(updatedItem);

      setValidationErrors((errors) => ({
        ...errors,
        [index]: { ...errors[index], description: itemErrors.description },
      }));
    }
  };

  const handleSummaryAmountChange = (index: number, value: string) => {
    if (isEditLocked) {
      return;
    }

    const summaryLineItem = summaryItems[index];
    const invoiceIndex = invoice.line_items.indexOf(summaryLineItem);
    const amount = Number(value || 0);

    if (Number.isNaN(amount)) {
      setValidationErrors((errors) => ({
        ...errors,
        [index]: {
          ...errors[index],
          amount: String(t('internal_invoice_summary_invalid_amount')),
        },
      }));
      return;
    }

    if (invoiceIndex > -1) {
      handleLineItemPropertyChange('cost', amount, invoiceIndex);

      const updatedItem = ensureSummaryLineDefaults({
        ...summaryLineItem,
        cost: amount,
      });
      const itemErrors = validateSummaryItem(updatedItem);

      setValidationErrors((errors) => ({
        ...errors,
        [index]: { ...errors[index], amount: itemErrors.amount },
      }));
    }
  };

  const documentStatus = invoice.uploaded_document_id
    ? t('internal_invoice_document_attached')
    : t('internal_invoice_document_missing');

  const hasUploadedDocument = Boolean(invoice.uploaded_document_id);
  const requiresSummary = hasUploadedDocument;

  const summaryStatus = summaryItems.length
    ? t('internal_invoice_summary_count', { count: summaryItems.length })
    : t('internal_invoice_summary_missing');

  const summaryValidationError =
    requiresSummary && !summaryItems.length
      ? t('internal_invoice_summary_required_with_upload')
      : undefined;

  const lineItemValidationMessage = errors?.errors?.line_items as
    | string
    | undefined;
  const canUploadDocument = Boolean(invoice.id);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Guidance Card - Moved to top for better UX flow */}
      <Card
        className="shadow-sm border-l-4 border-l-blue-500 dark:border-l-blue-400"
        style={{ borderColor: colors.$24 }}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Icon
                element={Info}
                className="text-blue-600 dark:text-blue-400"
                size={20}
              />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {t('internal_invoice_guidance_title')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('internal_invoice_guidance_help')}
              </p>
            </div>
          </div>

          <div className="ml-8 space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  1
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">
                {t('internal_invoice_guidance_summary_step')}
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  2
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">
                {t('internal_invoice_guidance_upload_step')}
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  3
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 flex-1">
                {t('internal_invoice_guidance_review_step')}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Card */}
      <Card className="shadow-sm" style={{ borderColor: colors.$24 }}>
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* Document Upload Section */}
          <div className="flex-1 space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Icon
                  element={Upload}
                  className="text-gray-600 dark:text-gray-400"
                  size={20}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {t('internal_invoice_tab_header')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('internal_invoice_tab_description')}
                </p>
              </div>
            </div>

            {!canUploadDocument || isEditLocked ? (
              <Alert type="warning" className="flex items-start gap-2">
                <Icon
                  element={AlertCircle}
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                />
                <span>{t('internal_invoice_document_upload_disabled')}</span>
              </Alert>
            ) : (
              <>
                <InternalCustomDocumentUpload
                  endpoint={resolveServiceEndpoint()}
                  onSuccess={refreshInvoice}
                  hasExisting={Boolean(invoice.uploaded_document_id)}
                  disabled={!canUploadDocument || isEditLocked}
                  isApproved={invoice.approval_status === 'approved'}
                />

                <div
                  className={`p-4 rounded-lg border-2 ${
                    hasUploadedDocument
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      element={hasUploadedDocument ? CheckCircle : FileText}
                      className={
                        hasUploadedDocument
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                      size={20}
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium text-sm ${
                          hasUploadedDocument
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-amber-900 dark:text-amber-100'
                        }`}
                      >
                        {t('internal_invoice_document_status_label')}
                      </div>
                      <div
                        className={`text-sm mt-1 ${
                          hasUploadedDocument
                            ? 'text-green-700 dark:text-green-200'
                            : 'text-amber-700 dark:text-amber-200'
                        }`}
                      >
                        {documentStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Summary Items Section */}
          <div className="flex-1 space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Icon
                  element={List}
                  className="text-gray-600 dark:text-gray-400"
                  size={20}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {t('summary_line_items_title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('summary_line_items_help')}
                </p>
              </div>
            </div>

            {/* Summary Items List */}
            <div className="space-y-3">
              {summaryItems.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Icon
                    element={List}
                    className="mx-auto text-gray-400 dark:text-gray-500 mb-3"
                    size={32}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">
                    {t('no_summary_items')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {t('click_button_below_to_add')}
                  </p>
                </div>
              ) : (
                summaryItems.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4 transition-all hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {t('item')} #{index + 1}
                      </span>
                      {Object.keys(validationErrors[index] || {}).length >
                        0 && (
                        <Icon
                          element={AlertCircle}
                          className="text-red-500"
                          size={16}
                        />
                      )}
                    </div>
                    <Inline>
                      <InputField
                        label={t('description')}
                        value={item.notes}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) =>
                          handleSummaryDescriptionChange(
                            index,
                            event.target.value
                          )
                        }
                        errorMessage={validationErrors[index]?.description}
                        disabled={isEditLocked}
                      />

                      <div className="flex items-end gap-2">
                        <NumberInputField
                          label={t('amount')}
                          value={Number(item.cost || 0).toString()}
                          onValueChange={(value) =>
                            handleSummaryAmountChange(index, value)
                          }
                          errorMessage={validationErrors[index]?.amount}
                          disabled={isEditLocked}
                        />

                        <Button
                          type="secondary"
                          behavior="button"
                          className="mb-0 !bg-red-600 dark:!bg-red-700 !text-white hover:!bg-red-700 dark:hover:!bg-red-800 !border-red-600 dark:!border-red-700"
                          onClick={() => handleDeleteSummaryItem(index)}
                          disabled={isEditLocked}
                          disableWithoutIcon
                        >
                          <Icon element={Trash2} size={18} />
                        </Button>
                      </div>
                    </Inline>
                  </div>
                ))
              )}
            </div>

            {/* Add Button */}
            <Button
              type="secondary"
              behavior="button"
              onClick={handleAddSummaryItem}
              className="w-full transition-all hover:shadow-sm flex items-center justify-center gap-2"
              disabled={isEditLocked}
              disableWithoutIcon
            >
              <Icon element={Plus} size={18} />
              <span>{t('add_summary_line_item')}</span>
            </Button>

            {/* Status and Validation Messages */}
            <div
              className={`p-4 rounded-lg border-2 ${
                summaryItems.length > 0
                  ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                  : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  element={summaryItems.length > 0 ? CheckCircle : AlertCircle}
                  className={
                    summaryItems.length > 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }
                  size={20}
                />
                <div className="flex-1">
                  <div
                    className={`font-medium text-sm ${
                      summaryItems.length > 0
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-amber-900 dark:text-amber-100'
                    }`}
                  >
                    {t('internal_invoice_summary_status_label')}
                  </div>
                  <div
                    className={`text-sm mt-1 ${
                      summaryItems.length > 0
                        ? 'text-blue-700 dark:text-blue-200'
                        : 'text-amber-700 dark:text-amber-200'
                    }`}
                  >
                    {summaryStatus}
                  </div>
                </div>
              </div>
            </div>

            {summaryValidationError && (
              <Alert type="error" className="flex items-start gap-2">
                <Icon
                  element={AlertCircle}
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                />
                <span>{summaryValidationError}</span>
              </Alert>
            )}

            {lineItemValidationMessage && (
              <Alert type="error" className="flex items-start gap-2">
                <Icon
                  element={AlertCircle}
                  size={18}
                  className="flex-shrink-0 mt-0.5"
                />
                <span>{lineItemValidationMessage}</span>
              </Alert>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
