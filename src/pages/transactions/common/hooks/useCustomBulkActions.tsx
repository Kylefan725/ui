/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { TransactionStatus } from '$app/common/enums/transactions';
import { Transaction } from '$app/common/interfaces/transactions';
import { useBulk } from '$app/common/queries/transactions';
import { CustomBulkAction } from '$app/components/DataTable';
import { DropdownElement } from '$app/components/dropdown/DropdownElement';
import { Icon } from '$app/components/icons/Icon';
import { useTranslation } from 'react-i18next';
import { MdOutlineContentCopy } from 'react-icons/md';

export const useCustomBulkActions = () => {
  const [t] = useTranslation();

  const bulk = useBulk();

  const showConvertAction = (selectedTransactions: Transaction[]) => {
    return selectedTransactions.every(
      ({ status_id }) => TransactionStatus.Matched === status_id
    );
  };

  const customBulkActions: CustomBulkAction<Transaction>[] = [
    ({ selectedIds, selectedResources, setSelected }) =>
      selectedResources &&
      showConvertAction(selectedResources) && (
        <DropdownElement
          onClick={() => {
            bulk(selectedIds, 'convert_matched');
            setSelected([]);
          }}
          icon={<Icon element={MdOutlineContentCopy} />}
        >
          {t('convert')}
        </DropdownElement>
      ),
  ];

  return customBulkActions;
};
