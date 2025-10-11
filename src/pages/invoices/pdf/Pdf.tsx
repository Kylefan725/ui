/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Invoice } from '$app/common/interfaces/invoice';
import { useInvoiceQuery } from '$app/common/queries/invoices';
import { Default } from '$app/components/layouts/Default';
import { Spinner } from '$app/components/Spinner';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { InvoiceViewer } from '../common/components/InvoiceViewer';
import { useGeneratePdfUrl } from '../common/hooks/useGeneratePdfUrl';
import { endpoint } from '$app/common/helpers';
import { Actions } from './components/Actions';
import { Page } from '$app/components/Breadcrumbs';
import { route } from '$app/common/helpers/route';

export default function Pdf() {
  const { id } = useParams();
  const { data } = useInvoiceQuery({ id });

  const [t] = useTranslation();
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [requestMethod, setRequestMethod] = useState<'GET' | 'POST'>('GET');
  const [payload, setPayload] = useState<any>();
  const [blobUrl, setBlobUrl] = useState('');
  const [invoice, setInvoice] = useState<Invoice>();

  const [deliveryNote, setDeliveryNote] = useState<boolean>(false);

  const [searchParams] = useSearchParams();

  const url = useGeneratePdfUrl({ resourceType: 'invoice' });

  useEffect(() => {
    if (data) {
      setInvoice(data);

      if (searchParams.has('delivery_note')) {
        setDeliveryNote(true);
      }
    }
  }, [data]);

  useEffect(() => {
    if (invoice && !searchParams.has('delivery_note')) {
      if (invoice.is_internal) {
        // Use authenticated API to download PDF for internal invoices to avoid token issues
        setPdfUrl(endpoint('/api/v1/invoices/bulk'));
        setRequestMethod('POST');
        setPayload({ action: 'download', ids: [invoice.id] });
      } else {
        setRequestMethod('GET');
        setPayload(undefined);
        setPdfUrl(url(invoice));
      }
    }
  }, [invoice]);

  const onLink = (url: string) => setBlobUrl(url);

  const pages: Page[] = [
    { name: t('invoices'), href: '/invoices' },
    {
      name: t('edit_invoice'),
      href: route('/invoices/:id/edit', { id }),
    },
    {
      name: t('pdf'),
      href: route('/invoices/:id/pdf', { id }),
    },
  ];

  return (
    <Default
      breadcrumbs={pages}
      title={t('view_pdf')}
      navigationTopRight={
        invoice && (
          <Actions
            invoice={invoice}
            blobUrl={blobUrl}
            deliveryNote={deliveryNote}
            setDeliveryNote={setDeliveryNote}
            onHandleDeliveryNote={(value, isDeliveryNote = deliveryNote) =>
              isDeliveryNote
                ? setPdfUrl(value)
                : setPdfUrl(url(invoice as Invoice))
            }
          />
        )
      }
    >
      {pdfUrl ? (
        <InvoiceViewer
          onLink={onLink}
          link={pdfUrl}
          method={requestMethod}
          resource={payload}
        />
      ) : (
        <div
          className="flex justify-center items-center"
          style={{ height: 1500 }}
        >
          <Spinner />
        </div>
      )}
    </Default>
  );
}
