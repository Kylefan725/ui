import 'styled-components';

declare module 'styled-components' {
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
}
