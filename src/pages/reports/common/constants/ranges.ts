/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

export interface Range {
    identifier: string;
    label: string;
    scheduleIdentifier: string;
}

export const ranges: Range[] = [
    { identifier: 'all', label: 'all', scheduleIdentifier: 'all' },
    {
        identifier: 'last7',
        label: 'last_7_days',
        scheduleIdentifier: 'last7_days',
    },
    {
        identifier: 'last30',
        label: 'last_30_days',
        scheduleIdentifier: 'last30_days',
    },
    {
        identifier: 'this_month',
        label: 'this_month',
        scheduleIdentifier: 'this_month',
    },
    {
        identifier: 'last_month',
        label: 'last_month',
        scheduleIdentifier: 'last_month',
    },
    {
        identifier: 'this_quarter',
        label: 'this_quarter',
        scheduleIdentifier: 'this_quarter',
    },
    {
        identifier: 'last_quarter',
        label: 'last_quarter',
        scheduleIdentifier: 'last_quarter',
    },
    {
        identifier: 'this_year',
        label: 'this_year',
        scheduleIdentifier: 'this_year',
    },
    {
        identifier: 'last_year',
        label: 'last_year',
        scheduleIdentifier: 'last_year',
    },
    { identifier: 'custom', label: 'custom', scheduleIdentifier: 'custom' },
];
