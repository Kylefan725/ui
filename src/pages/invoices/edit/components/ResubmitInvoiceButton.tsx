/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '$app/components/forms';
import { Modal } from '$app/components/Modal';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { Invoice } from '$app/common/interfaces/invoice';
import { uploadInvoiceDocument } from '$app/common/queries/invoices';

interface Props {
  invoice: Invoice;
  onSuccess: () => void;
}

export function ResubmitInvoiceButton(props: Props) {
  const [t] = useTranslation();
  const { invoice, onSuccess } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDocumentId, setSubmittedDocumentId] = useState<string | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setSubmittedDocumentId(null);
    setUploadedFileName(null);
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setSubmittedDocumentId(null);
    setUploadedFileName(null);
    setIsModalVisible(false);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !invoice) {
      return;
    }

    setIsUploading(true);
    toast.processing();

    try {
      const response = await uploadInvoiceDocument(invoice.id, file, false);
      setSubmittedDocumentId(response.data.id);
      setUploadedFileName(file.name);
      toast.success('uploaded_document');
    } catch (error) {
      handleError(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleError = (error: any) => {
    if (error.response?.status === 422) {
      const errorMessages = error.response.data;
      if (errorMessages.message) {
        toast.error(errorMessages.message);
      } else {
        toast.error('error_title');
      }
    } else {
      toast.error('error_title');
    }
  };

  const resendInvoice = async (message: string) => {
    if (!invoice?.id) {
      return;
    }

    setIsSubmitting(true);
    toast.processing();

    try {
      await request(
        'POST',
        endpoint('/api/v1/invoices/:id/resubmit', { id: invoice.id }),
        {
          submitted_document_id: submittedDocumentId,
        }
      );
      toast.success(message);
      setIsModalVisible(false);
      onSuccess();
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        type="minimal"
        behavior="button"
        onClick={openModal}
        disabled={isSubmitting}
      >
        {t('resubmit_internal_invoice')}
      </Button>

      <Modal
        visible={isModalVisible}
        onClose={handleClose}
        title={t('resubmit_internal_invoice')}
        size="small"
      >
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('resubmit_internal_invoice_confirmation')}
          </p>

          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>{t('resubmit_will_reset_status')}</li>
            <li>{t('resubmit_will_send_email')}</li>
            <li>{t('resubmit_contact_can_review_again')}</li>
          </ul>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('upload_submitted_invoice_optional')}
            </label>
            <div className="flex items-center space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                disabled={isUploading || isSubmitting}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-gray-700 dark:file:text-gray-300
                  dark:hover:file:bg-gray-600"
              />
            </div>
            {uploadedFileName && (
              <p className="text-xs text-green-600 dark:text-green-400">
                {t('uploaded')}: {uploadedFileName}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="minimal"
              behavior="button"
              onClick={handleClose}
              disabled={isSubmitting || isUploading}
            >
              {t('cancel')}
            </Button>

            <Button
              behavior="button"
              onClick={() => resendInvoice('resubmit_internal_invoice')}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? t('processing') : t('resubmit_invoice')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
