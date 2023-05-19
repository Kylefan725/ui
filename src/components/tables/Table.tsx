/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import classNames from 'classnames';
import { useEffect, useState } from 'react';
import CommonProps from '../../common/interfaces/common-props.interface';

interface Props extends CommonProps {
  withoutPadding?: boolean;
  withoutBottomBorder?: boolean;
  withoutTopBorder?: boolean;
  withoutLeftBorder?: boolean;
  withoutRightBorder?: boolean;
  onVerticalOverflowChange?: (overflow: boolean) => void;
  isDataLoading?: boolean;
}

export function Table(props: Props) {
  const { onVerticalOverflowChange } = props;

  const [tableParentHeight, setTableParentHeight] = useState<number>();
  const [tableHeight, setTableHeight] = useState<number>();
  const [manualTableHeight, setManualTableHeight] = useState<
    number | string | undefined
  >(props.style?.height);
  const [isVerticallyOverflow, setIsVerticallyOverflow] =
    useState<boolean>(true);

  const handleTableParentHeight = (element: HTMLDivElement | null) => {
    if (element && onVerticalOverflowChange) {
      setTableParentHeight(element.clientHeight);
    }
  };

  const handleTableHeight = (element: HTMLTableElement | null) => {
    if (element && onVerticalOverflowChange) {
      setTableHeight(element.clientHeight);
    }
  };

  useEffect(() => {
    if (
      typeof tableHeight === 'number' &&
      typeof tableParentHeight === 'number' &&
      !props.isDataLoading &&
      onVerticalOverflowChange
    ) {
      if (tableHeight > tableParentHeight) {
        onVerticalOverflowChange(true);
        setIsVerticallyOverflow(true);
      } else {
        onVerticalOverflowChange(false);
        setIsVerticallyOverflow(false);
      }
    }
  }, [props.isDataLoading, tableHeight, tableParentHeight]);

  useEffect(() => {
    if (props.style?.height) {
      setManualTableHeight(props.style.height);
    }
  }, [props.style?.height]);

  useEffect(() => {
    if (!isVerticallyOverflow && onVerticalOverflowChange) {
      setManualTableHeight('auto');
    }
  }, [isVerticallyOverflow]);

  return (
    <div
      className={classNames('flex flex-col', {
        'mt-2': !props.withoutPadding,
      })}
    >
      <div
        className={classNames('align-middle inline-block min-w-full', {
          'py-1.5': !props.withoutPadding,
        })}
      >
        <div
          className={classNames(
            'overflow-hidden border border-gray-200 dark:border-transparent rounded border-b border-t',
            {
              'border-b-0': props.withoutBottomBorder,
              'border-t-0': props.withoutTopBorder,
              'border-l-0': props.withoutLeftBorder,
              'border-r-0': props.withoutRightBorder,
            }
          )}
        >
          <div
            ref={handleTableParentHeight}
            className={`overflow-y-auto ${props.className}`}
            style={{
              ...props.style,
              height: manualTableHeight,
            }}
          >
            <table
              ref={handleTableHeight}
              className="min-w-full table-auto divide-y divide-gray-200"
            >
              {props.children}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
