/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useLogo } from '$app/common/hooks/useLogo';
import { RootState } from '$app/common/stores/store';
import { CompanySwitcher } from '$app/components/CompanySwitcher';
import { HelpSidebarIcons } from '$app/components/HelpSidebarIcons';
import { Icon } from 'react-feather';
import { useSelector } from 'react-redux';
import { SidebarItem } from './SidebarItem';
import { useColorScheme } from '$app/common/colors';

export interface NavigationItem {
  name: string;
  href: string;
  icon: Icon;
  current: boolean;
  visible: boolean;
  rightButton?: {
    icon: Icon;
    to: string;
    label: string;
    visible: boolean;
  };
}

interface Props {
  navigation: NavigationItem[];
  docsLink?: string;
}

export function DesktopSidebar(props: Props) {
  const isMiniSidebar = useSelector(
    (state: RootState) => state.settings.isMiniSidebar
  );

  const logo = useLogo();
  const colors = useColorScheme();

  return (
    <div
      className={`hidden md:flex z-10 ${
        isMiniSidebar ? 'md:w-16' : 'md:w-64'
      } md:flex-col md:fixed md:inset-y-0`}
    >
      <div
        style={{ backgroundColor: colors.$6, borderColor: colors.$4 }}
        className="flex flex-col flex-grow overflow-y-auto border-r"
      >
        <div
          style={{ borderColor: colors.$5 }}
          className="flex items-center flex-shrink-0 pl-3 pr-6 h-16 border-b"
        >
          {isMiniSidebar ? (
            <img className="w-8" src={logo} alt="Company logo" />
          ) : (
            <CompanySwitcher />
          )}
        </div>

        <div className="flex-grow flex flex-col mt-4">
          <nav className="flex-1 pb-4 space-y-1" data-cy="navigationBar">
            {props.navigation.map((item, index) => (
              <SidebarItem key={index} item={item} colors={colors} />
            ))}
          </nav>

          <HelpSidebarIcons docsLink={props.docsLink} />
        </div>
      </div>
    </div>
  );
}
