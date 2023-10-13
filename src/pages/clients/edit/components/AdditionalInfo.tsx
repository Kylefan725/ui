/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { Card, Element } from '$app/components/cards';
import { InputField, Link } from '$app/components/forms';
import { endpoint } from '$app/common/helpers';
import { route } from '$app/common/helpers/route';
import { useCurrencies } from '$app/common/hooks/useCurrencies';
import { useLanguages } from '$app/common/hooks/useLanguages';
import { useQuery } from '$app/common/hooks/useQuery';
import { Client } from '$app/common/interfaces/client';
import { PaymentTerm } from '$app/common/interfaces/payment-term';
import { useStaticsQuery } from '$app/common/queries/statics';
import { DocumentsTable } from '$app/components/DocumentsTable';
import { TabGroup } from '$app/components/TabGroup';
import { Upload } from '$app/pages/settings/company/documents/components';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { MarkdownEditor } from '$app/components/forms/MarkdownEditor';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { cloneDeep, set } from 'lodash';
import { SearchableSelect } from '$app/components/SearchableSelect';

interface Props {
  client: Client | undefined;
  setClient: React.Dispatch<React.SetStateAction<Client | undefined>>;
  setErrors: Dispatch<SetStateAction<ValidationBag | undefined>>;
  errors: ValidationBag | undefined;
}

export function AdditionalInfo({ client, errors, setClient }: Props) {
  const [t] = useTranslation();

  const currencies = useCurrencies();
  const languages = useLanguages();
  const queryClient = useQueryClient();

  const { data: paymentTerms } = useQuery('/api/v1/payment_terms');
  const { data: statics } = useStaticsQuery();
  const { id } = useParams();

  const handleChange = <T extends keyof Client>(
    property: T,
    value: Client[typeof property]
  ) => {
    setClient((client) => client && { ...client, [property]: value });
  };

  const handleSettingsChange = <T extends keyof Client['settings']>(
    property: T,
    value: Client['settings'][typeof property]
  ) => {
    const $client = cloneDeep(client)!;

    if (property !== 'currency_id' && value === '') {
      delete $client.settings?.[property];
    } else {
      set($client, `settings.${property}`, value);
    }

    // if (property === 'send_reminders' && value === '') {
    //   delete $client.settings?.send_reminders;
    // } else {
    //   set($client, `settings.${property}`, value);
    // }

    setClient($client);
  };

  const [tabs, setTabs] = useState([
    t('settings'),
    t('notes'),
    t('classify'),
    t('client_fields'),
    t('contact_fields'),
    t('documents'),
  ]);

  useEffect(() => {
    if (!id) {
      setTabs((current) => current.filter((tab) => tab !== t('documents')));
    }
  }, []);

  const onSuccess = () => {
    queryClient.invalidateQueries(route('/api/v1/clients/:id', { id }));
  };

  return (
    <Card title={t('additional_info')}>
      <TabGroup className="px-5" tabs={tabs}>
        <div className="-mx-5">
          {currencies.length > 1 && (
            <Element leftSide={t('currency')}>
              <SearchableSelect
                value={client?.settings?.currency_id || ''}
                onValueChange={(value) =>
                  handleSettingsChange('currency_id', value)
                }
                errorMessage={errors?.errors['settings.currency_id']}
              >
                <option value=""></option>
                {currencies.map((currency, index) => (
                  <option key={index} value={currency.id}>
                    {currency.name}
                  </option>
                ))}
              </SearchableSelect>
            </Element>
          )}

          {languages.length > 1 && (
            <Element leftSide={t('language')}>
              <SearchableSelect
                value={client?.settings?.language_id || ''}
                onValueChange={(value) =>
                  handleSettingsChange('language_id', value)
                }
                errorMessage={errors?.errors['settings.language_id']}
              >
                <option value=""></option>
                {languages.map((language, index) => (
                  <option key={index} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </SearchableSelect>
            </Element>
          )}

          {paymentTerms && (
            <Element leftSide={t('payment_terms')}>
              <SearchableSelect
                value={client?.settings?.payment_terms || ''}
                errorMessage={errors?.errors['settings.payment_terms']}
                onValueChange={(value) =>
                  handleSettingsChange('payment_terms', value)
                }
              >
                <option value=""></option>
                {paymentTerms.data.data.map(
                  (paymentTerm: PaymentTerm, index: number) => (
                    <option key={index} value={paymentTerm.num_days}>
                      {paymentTerm.name}
                    </option>
                  )
                )}
              </SearchableSelect>
            </Element>
          )}

          {paymentTerms && (
            <Element leftSide={t('quote_valid_until')}>
              <SearchableSelect
                value={client?.settings?.valid_until || ''}
                onValueChange={(value) =>
                  handleSettingsChange('valid_until', value)
                }
                errorMessage={errors?.errors['settings.valid_until']}
              >
                <option value=""></option>
                {paymentTerms.data.data.map(
                  (paymentTerm: PaymentTerm, index: number) => (
                    <option key={index} value={paymentTerm.num_days}>
                      {paymentTerm.name}
                    </option>
                  )
                )}
              </SearchableSelect>
            </Element>
          )}

          <Element leftSide={t('task_rate')}>
            <InputField
              id="settings.default_task_rate"
              type="number"
              value={client?.settings?.default_task_rate}
              onValueChange={(value) =>
                handleSettingsChange('default_task_rate', value)
              }
              errorMessage={errors?.errors['settings.default_task_rate']}
            />
          </Element>

          <Element leftSide={t('send_reminders')}>
            <SearchableSelect
              value={
                client?.settings?.send_reminders === true
                  ? 'enabled'
                  : client?.settings?.send_reminders === false
                  ? 'disabled'
                  : ''
              }
              className={
                'appearance-none block px-3 py-1.5 text-base font-normal  text-gray-700 bg-white bg-clip-padding bg-no-repeat border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
              }
              onValueChange={(value) =>
                handleSettingsChange(
                  'send_reminders',
                  value === 'enabled' ? true : value === '' ? '' : false
                )
              }
              errorMessage={errors?.errors['settings.send_reminders']}
            >
              <option value=""></option>
              <option value="enabled">{t('enabled')}</option>
              <option value="disabled">{t('disabled')}</option>
            </SearchableSelect>
          </Element>
        </div>

        <div className="-mx-5">
          <Element leftSide={t('public_notes')}>
            <MarkdownEditor
              value={client?.public_notes}
              onChange={(value) => handleChange('public_notes', value)}
            />
          </Element>

          <Element leftSide={t('private_notes')}>
            <MarkdownEditor
              value={client?.private_notes}
              onChange={(value) => handleChange('private_notes', value)}
            />
          </Element>
        </div>

        <div className="-mx-5">
          {statics && (
            <Element leftSide={t('size_id')}>
              <SearchableSelect
                value={client?.size_id || ''}
                onValueChange={(value) => handleChange('size_id', value)}
                errorMessage={errors?.errors.size_id}
              >
                <option value=""></option>
                {statics?.sizes.map(
                  (size: { id: string; name: string }, index: number) => (
                    <option key={index} value={size.id}>
                      {size.name}
                    </option>
                  )
                )}
              </SearchableSelect>
            </Element>
          )}

          {statics && (
            <Element leftSide={t('industry')}>
              <SearchableSelect
                value={client?.industry_id || ''}
                errorMessage={errors?.errors.industry_id}
                onValueChange={(value) => handleChange('industry_id', value)}
              >
                <option value=""></option>
                {statics?.industries.map(
                  (size: { id: string; name: string }, index: number) => (
                    <option key={index} value={size.id}>
                      {size.name}
                    </option>
                  )
                )}
              </SearchableSelect>
            </Element>
          )}
        </div>

        <div>
          <span className="text-sm">{t('custom_fields')} &nbsp;</span>
          <Link to="/settings/custom_fields/clients" className="capitalize">
            {t('click_here')}
          </Link>
        </div>

        <div>
          <span className="text-sm">{t('custom_fields')} &nbsp;</span>
          <Link to="/settings/custom_fields/clients" className="capitalize">
            {t('click_here')}
          </Link>
        </div>

        {id ? (
          <div>
            <div className="px-6">
              <Upload
                widgetOnly
                endpoint={endpoint('/api/v1/clients/:id/upload', { id })}
                onSuccess={onSuccess}
              />

              <DocumentsTable
                documents={client?.documents || []}
                onDocumentDelete={onSuccess}
              />
            </div>
          </div>
        ) : (
          <></>
        )}
      </TabGroup>
    </Card>
  );
}
