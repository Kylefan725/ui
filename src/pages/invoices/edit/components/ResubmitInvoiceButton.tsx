/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '$app/components/forms';
import { Modal } from '$app/components/Modal';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { AxiosError } from 'axios';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { Invoice } from '$app/common/interfaces/invoice';
import { Upload } from '$app/pages/settings/company/documents/components/Upload';
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

  const openModal = () => {
    setSubmittedDocumentId(null);
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setSubmittedDocumentId(null);
    setIsModalVisible(false);
  };

  const handleResubmit = () => {
    if (!invoice?.id) {
      return;
    }

    setIsSubmitting(true);
    toast.processing();

    request(
      'POST',
      endpoint('/api/v1/invoices/:id/resubmit', { id: invoice.id }),
      {}
    )
      .then(() => {
        toast.success('resubmitted_internal_invoice');
        setIsModalVisible(false);
        onSuccess();
      })
      .catch((error: AxiosError<ValidationBag>) => {
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
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDocumentUpload = async (file: File) => {
    if (!invoice) {
      return;
    }

    try {
      const document = await uploadInvoiceDocument(invoice.id, file, false);
      setSubmittedDocumentId(document.id);
    } catch (error) {
      handleError(error);
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

          <Upload
            onSuccess={(file) => handleDocumentUpload(file.file)}
            onError={handleError}
            label={t('upload_submitted_invoice_optional')}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="minimal"
              behavior="button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>

            <Button
              behavior="button"
              onClick={() => resendInvoice('resubmit_internal_invoice')}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('processing') : t('resubmit_invoice')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
