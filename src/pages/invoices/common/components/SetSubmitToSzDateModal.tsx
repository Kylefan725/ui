/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2025. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '$app/components/Modal';
import { Button } from '$app/components/forms';
import { DatePicker } from '$app/components/forms';
import { Invoice } from '$app/common/interfaces/invoice';
import dayjs from 'dayjs';

interface Props {
  invoice: Invoice;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (date: string) => Promise<void>;
}

export function SetSubmitToSzDateModal(props: Props) {
  const [t] = useTranslation();
  const { invoice, visible, onClose, onSuccess, onSubmit } = props;

  const initialDate = invoice.approval_record?.submit_to_sz_date
    ? dayjs(invoice.approval_record.submit_to_sz_date).format('YYYY-MM-DD')
    : '';

  const [date, setDate] = useState<string>(initialDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!date) {
      setError(t('please_select_a_date') ?? '');
      return;
    }

    const selectedDate = dayjs(date);
    if (selectedDate.isAfter(dayjs(), 'day')) {
      setError(t('date_cannot_be_in_future') ?? '');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(date);
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errorMessage =
          err.response.data?.message || t('error_title') || '';
        setError(errorMessage);
      } else {
        setError(t('error_title') ?? '');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setDate(initialDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      disableClosing
      overflowVisible
      title={t('set_submit_to_sz_date')}
      size="small"
    >
      <div className="flex flex-col space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('set_submit_to_sz_date_help')}
        </p>

        <DatePicker
          id="submit_to_sz_date"
          required={false}
          value={date}
          onValueChange={(value) => setDate(value)}
          disabled={isSubmitting}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            behavior="button"
            type="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            behavior="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('processing') : t('save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
