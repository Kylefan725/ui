import React, { ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useFullTheme } from '../common/colors';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useFullTheme();
  return <StyledThemeProvider theme={theme}>{children}</StyledThemeProvider>;
}
