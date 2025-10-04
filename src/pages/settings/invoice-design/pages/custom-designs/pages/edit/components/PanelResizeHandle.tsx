/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useColorScheme, useFullTheme } from '$app/common/colors';
import { PanelResizeHandle as PanelResizeHandleBase } from 'react-resizable-panels';
import { useMediaQuery } from 'react-responsive';
import styled from 'styled-components';

const PanelResizeHandleBaseStyled = styled(PanelResizeHandleBase)`
  background-color: ${(props) => props.theme.backgroundColor};
  &:hover {
    background-color: ${(props) => props.theme.hoverColor};
  }
`;
export function PanelResizeHandle() {
  const isLargeScreen = useMediaQuery({ query: '(min-width: 1024px)' });

  const colors = useColorScheme();
  const theme = useFullTheme();

  return isLargeScreen ? (
    <PanelResizeHandleBaseStyled
      theme={{
        ...theme,
        hoverColor: '#3366CC',
        backgroundColor: colors.$5,
      }}
      className="cursor-pointer"
      style={{ width: '0.125rem' }}
    />
  ) : (
    <></>
  );
}
