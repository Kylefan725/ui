/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { AvailableTypes } from '$app/pages/settings/custom-fields/components';
import { useEffect, useState } from 'react';
import { InputField } from '.';
import Toggle from './Toggle';
import { SearchableSelect } from '../SearchableSelect';

export interface Props {
  defaultValue: any;
  field: string;
  value: string;
  onValueChange: (value: string | number | boolean) => unknown;
}

export function InputCustomField(props: Props) {
  const [type, setType] = useState('single_line_text');

  useEffect(() => {
    const [, fieldType] = props.value.includes('|')
      ? props.value.split('|')
      : [props.value, 'multi_line_text'];

    setType(fieldType);
  }, []);

  return (
    <>
      {type === AvailableTypes.SingleLineText && (
        <InputField
          type="text"
          id={props.field}
          onValueChange={props.onValueChange}
          value={props.defaultValue || ''}
        />
      )}

      {type === AvailableTypes.MultiLineText && (
        <InputField
          element="textarea"
          id={props.field}
          onValueChange={props.onValueChange}
          value={props.defaultValue || ''}
        />
      )}

      {type === AvailableTypes.Switch && (
        <Toggle
          onChange={props.onValueChange}
          checked={
            typeof props.defaultValue === 'string'
              ? props.defaultValue === 'true'
              : props.defaultValue
          }
        />
      )}

      {type === AvailableTypes.Date && (
        <InputField
          type="date"
          id={props.field}
          onValueChange={props.onValueChange}
          value={props.defaultValue || ''}
        />
      )}

      {!Object.values(AvailableTypes).includes(type as AvailableTypes) && (
        <SearchableSelect
          value={props.defaultValue || ''}
          onValueChange={(v) => props.onValueChange(v)}
        >
          <option value=""></option>
          {type.split(',').map((option, index) => (
            <option key={index} value={option}>
              {option}
            </option>
          ))}
        </SearchableSelect>
      )}
    </>
  );
}
