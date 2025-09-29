/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useInjectCompanyChanges } from '$app/common/hooks/useInjectCompanyChanges';
import { useTitle } from '$app/common/hooks/useTitle';
import { useTranslation } from 'react-i18next';
import { useDiscardChanges } from '../common/hooks/useDiscardChanges';
import {
  isCompanySettingsFormBusy,
  useHandleCompanySave,
} from '../common/hooks/useHandleCompanySave';
import { useAtomValue } from 'jotai';
import { useDispatch } from 'react-redux';
import { updateChanges } from '$app/common/stores/slices/company-users';
import { Card, Element } from '$app/components/cards';
import { Settings as SettingsLayout } from '$app/components/layouts/Settings';
import { useColorScheme } from '$app/common/colors';
import { useCompanyChanges } from '$app/common/hooks/useCompanyChanges';
import Toggle from '$app/components/forms/Toggle';
import { PropertyCheckbox } from '$app/components/PropertyCheckbox';
import { SettingsLabel } from '$app/components/SettingsLabel';
import { InputField } from '$app/components/forms';
import { companySettingsErrorsAtom } from '../common/atoms';
import { useHandleCurrentCompanyChangeProperty } from '../common/hooks/useHandleCurrentCompanyChange';
import { Divider } from '$app/components/cards/Divider';

export function InternalInvoiceSettings() {
  useTitle('internal_invoicing');
  const [t] = useTranslation();

  useInjectCompanyChanges();

  const colors = useColorScheme();
  const dispatch = useDispatch();
  const onCancel = useDiscardChanges();
  const onSave = useHandleCompanySave();
  const isFormBusy = useAtomValue(isCompanySettingsFormBusy);

  const companyChanges = useCompanyChanges();
  const errors = useAtomValue(companySettingsErrorsAtom);
  const handleChange = useHandleCurrentCompanyChangeProperty();

  const pages = [
    { name: t('settings'), href: '/settings' },
    { name: t('internal_invoicing'), href: '/settings/internal_invoicing' },
  ];

  const handleToggleChange = (id: string, value: boolean) =>
    dispatch(
      updateChanges({
        object: 'company',
        property: id,
        value,
      })
    );

  const enabled = Boolean(companyChanges?.settings?.enable_internal_invoicing);

  return (
    <SettingsLayout
      onSaveClick={onSave}
      onCancelClick={onCancel}
      title={t('internal_invoicing')}
      breadcrumbs={pages}
      docsLink="en/basic-settings/#internal_invoicing"
      disableSaveButton={isFormBusy}
    >
      <Card
        title={t('internal_invoicing')}
        className="shadow-sm"
        style={{ borderColor: colors.$24 }}
        headerStyle={{ borderColor: colors.$20 }}
      >
        <Element
          leftSide={
            <PropertyCheckbox
              propertyKey="enable_internal_invoicing"
              labelElement={
                <SettingsLabel
                  label={t('enable_internal_invoicing')}
                  helpLabel={t('enable_internal_invoicing_help')}
                />
              }
              defaultValue={false}
            />
          }
        >
          <Toggle
            checked={enabled}
            onChange={(value: boolean) =>
              handleToggleChange('settings.enable_internal_invoicing', value)
            }
          />
        </Element>

        {enabled && (
          <>
            <div className="px-4 sm:px-6 py-4">
              <Divider
                className="border-dashed"
                withoutPadding
                style={{ borderColor: colors.$20 }}
              />
            </div>

            <Element
              leftSide={
                <PropertyCheckbox
                  propertyKey="internal_invoice_require_signature"
                  labelElement={
                    <SettingsLabel
                      label={t('internal_invoice_require_signature')}
                      helpLabel={t('internal_invoice_require_signature_help')}
                    />
                  }
                  defaultValue={false}
                />
              }
            >
              <Toggle
                checked={Boolean(
                  companyChanges?.settings?.internal_invoice_require_signature
                )}
                onChange={(value: boolean) =>
                  handleToggleChange(
                    'settings.internal_invoice_require_signature',
                    value
                  )
                }
              />
            </Element>

            <Element
              leftSide={
                <PropertyCheckbox
                  propertyKey="internal_invoice_number_pattern"
                  labelElement={
                    <SettingsLabel
                      label={t('internal_invoice_number_pattern')}
                    />
                  }
                />
              }
            >
              <InputField
                value={
                  companyChanges?.settings?.internal_invoice_number_pattern ||
                  ''
                }
                onValueChange={(value) =>
                  handleChange(
                    'settings.internal_invoice_number_pattern',
                    value
                  )
                }
                errorMessage={
                  errors?.errors['settings.internal_invoice_number_pattern']
                }
              />
            </Element>

            <Element
              leftSide={
                <PropertyCheckbox
                  propertyKey="include_internal_in_reports"
                  labelElement={
                    <SettingsLabel
                      label={t('include_internal_in_reports')}
                      helpLabel={t('include_internal_in_reports_help')}
                    />
                  }
                  defaultValue={false}
                />
              }
            >
              <Toggle
                checked={Boolean(
                  companyChanges?.settings?.include_internal_in_reports
                )}
                onChange={(value: boolean) =>
                  handleToggleChange(
                    'settings.include_internal_in_reports',
                    value
                  )
                }
              />
            </Element>
          </>
        )}
      </Card>
    </SettingsLayout>
  );
}
