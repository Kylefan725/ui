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

interface Props {
  invoice: Invoice;
  onSuccess: () => void;
}

export function ResubmitInvoiceButton(props: Props) {
  const [t] = useTranslation();
  const { invoice, onSuccess } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <>
      <Button
        type="minimal"
        behavior="button"
        onClick={() => setIsModalVisible(true)}
        disabled={isSubmitting}
      >
        {t('resubmit_internal_invoice')}
      </Button>

      <Modal
        visible={isModalVisible}
        onClose={setIsModalVisible}
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="minimal"
              behavior="button"
              onClick={() => setIsModalVisible(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>

            <Button
              behavior="button"
              onClick={handleResubmit}
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
