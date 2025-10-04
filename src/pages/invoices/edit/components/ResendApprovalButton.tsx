/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useEffect, useRef, useState } from 'react';
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

export function ResendApprovalButton(props: Props) {
  const [t] = useTranslation();
  const { invoice, onSuccess } = props;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const timerRef = useRef<number | undefined>();

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds);
    window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      window.clearInterval(timerRef.current);
    };
  }, []);

  const handleResend = () => {
    if (!invoice?.id) {
      return;
    }

    setIsSubmitting(true);
    toast.processing();

    request(
      'POST',
      endpoint('/api/v1/invoices/:id/resend-approval', { id: invoice.id }),
      {}
    )
      .then(() => {
        toast.success('resent_approval_email');
        setIsModalVisible(false);
        onSuccess();
        // Prevent rapid resends (spam/abuse)
        startCooldown(60);
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

  const disabled = isSubmitting || cooldownSeconds > 0;

  return (
    <>
      <Button
        type="minimal"
        behavior="button"
        onClick={() => setIsModalVisible(true)}
        disabled={disabled}
      >
        {cooldownSeconds > 0
          ? t('resend_approval_email_with_timer', {
              seconds: cooldownSeconds,
            })
          : t('resend_approval_email')}
      </Button>

      <Modal
        visible={isModalVisible}
        onClose={setIsModalVisible}
        title={t('resend_approval_email')}
        size="small"
      >
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('resend_approval_email_confirmation')}
          </p>

          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>{t('resend_will_notify_contact')}</li>
            <li>{t('resend_has_cooldown')}</li>
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
              onClick={handleResend}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('processing') : t('resend_now')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default ResendApprovalButton;
