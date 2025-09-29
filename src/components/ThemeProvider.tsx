/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import React, { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useColorScheme } from '$app/common/colors';

export interface DefaultTheme {
  backgroundColor: string;
  borderColor: string;
  hoverColor: string;
  checkedBorderColor: string;
  hoverBackgroundColor: string;
  ringColor: string;
  color: string;
  hoverBorderColor: string;
  hoverBgColor: string;
  textColor: string;
  hoverTextColor: string;
  minWidth: number;
  colorScheme: string;
}

interface Props {
  children: ReactNode;
}

export function ThemeProvider(props: Props) {
  const colors = useColorScheme();

  const theme: DefaultTheme = {
    backgroundColor: colors.$1 || '#ffffff', // Primary background
    borderColor: colors.$24 || '#09090B26', // Border color
    hoverColor: colors.$25 || '#09090B0D', // Hover element background (used as hoverColor in some places)
    checkedBorderColor: colors.$5 || '#d1d5db', // Secondary border for checked states
    hoverBackgroundColor: colors.$20 || '#09090B13', // Dropdown hover background
    ringColor: colors.$21 || '#09090B1A', // Divider/focus ring
    color: colors.$3 || '#2a303d', // Primary text color
    hoverBorderColor: colors.$24 || '#09090B26', // Hover border (same as border)
    hoverBgColor: colors.$8 || '#363D47', // Secondary hover bg
    textColor: colors.$22 || '#717179', // Label text color
    hoverTextColor: colors.$3 || '#2a303d', // Hover text (primary text)
    minWidth: 300, // Default min width for kanban etc.
    colorScheme: colors.$0 || 'light', // light/dark
  };

  return (
    <StyledThemeProvider theme={theme}>{props.children}</StyledThemeProvider>
  );
}
