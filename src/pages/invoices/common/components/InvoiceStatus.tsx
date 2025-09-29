/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Badge } from '$app/components/Badge';
import { useTranslation } from 'react-i18next';
import { Invoice } from '$app/common/interfaces/invoice';
import { InvoiceStatus as InvoiceStatusEnum } from '$app/common/enums/invoice-status';
import dayjs from 'dayjs';
import { useStatusThemeColorScheme } from '$app/pages/settings/user/components/StatusColorTheme';

interface Props {
  entity: Invoice;
}

export function InvoiceStatus(props: Props) {
  const [t] = useTranslation();

  const { status_id, due_date, partial_due_date, partial, balance } =
    props.entity;

  const statusThemeColors = useStatusThemeColorScheme();

  const checkInvoiceInvitationsViewedDate = () => {
    return props.entity.invitations.some(
      (invitation) => invitation.viewed_date
    );
  };

  const isSent = status_id !== InvoiceStatusEnum.Draft;
  const isPaid = status_id === InvoiceStatusEnum.Paid;
  const isUnpaid = !isPaid;
  const isViewed = checkInvoiceInvitationsViewedDate();
  const isPartial = status_id === InvoiceStatusEnum.Partial;
  const isReversed = status_id === InvoiceStatusEnum.Reversed;
  const isCancelled = status_id === InvoiceStatusEnum.Cancelled;
  const isCancelledOrReversed = isCancelled || isReversed;
  const isDeleted = Boolean(props.entity.is_deleted);

  const isPastDue = () => {
    const date =
      partial !== 0 && partial_due_date ? partial_due_date : due_date;

    if (!date || balance === 0) {
      return false;
    }

    const isLessForOneDay =
      dayjs(date).diff(dayjs().format('YYYY-MM-DD'), 'day') <= -1;

    return !isDeleted && isSent && isUnpaid && isLessForOneDay;
  };

  if (isDeleted) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge variant="red">{t('deleted')}</Badge>
      </div>
    );
  }

  if (props.entity.archived_at) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge variant="orange">{t('archived')}</Badge>
      </div>
    );
  }

  if (isPastDue() && !isCancelledOrReversed) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge variant="red" style={{ backgroundColor: statusThemeColors.$5 }}>
          {t('past_due')}
        </Badge>
      </div>
    );
  }

  if (isViewed && isUnpaid && !isPartial && !isCancelledOrReversed) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge
          variant="yellow"
          style={{ backgroundColor: statusThemeColors.$4 }}
        >
          {t('viewed')}
        </Badge>
      </div>
    );
  }

  if (status_id === InvoiceStatusEnum.Draft) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge variant="generic">{t('draft')}</Badge>
      </div>
    );
  }

  if (status_id === InvoiceStatusEnum.Sent) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge
          variant="light-blue"
          style={{ backgroundColor: statusThemeColors.$1 }}
        >
          {t('sent')}
        </Badge>
      </div>
    );
  }

  if (status_id === InvoiceStatusEnum.Partial) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge
          variant="dark-blue"
          style={{ backgroundColor: statusThemeColors.$2 }}
        >
          {t('partial')}
        </Badge>
      </div>
    );
  }

  if (status_id === InvoiceStatusEnum.Paid) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge
          variant="green"
          style={{ backgroundColor: statusThemeColors.$3 }}
        >
          {t('paid')}
        </Badge>
      </div>
    );
  }

  if (status_id === InvoiceStatusEnum.Cancelled) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge variant="black">{t('cancelled')}</Badge>
      </div>
    );
  }

  if (status_id === InvoiceStatusEnum.Reversed) {
    return (
      <div className="flex items-center gap-2">
        {props.entity.is_internal && (
          <Badge variant="purple">{t('internal')}</Badge>
        )}
        <Badge variant="purple">{t('reversed')}</Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {props.entity.is_internal && (
        <Badge variant="purple">{t('internal')}</Badge>
      )}
      <Badge variant="purple">{t('reversed')}</Badge>
    </div>
  );
}
