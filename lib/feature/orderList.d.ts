import { MenuButtonType } from '../core/tool';

/**
 * 工具栏 - 有序列表
 */
export declare const OrderListToolbar: import('vue').DefineSetupFnComponent<{
    color: string;
    zIndex: number;
    tooltip: boolean;
}, {}, {}, {
    color: string;
    zIndex: number;
    tooltip: boolean;
} & {}, import('vue').PublicProps>;
/**
 * 菜单栏 - 有序列表
 */
export declare const OrderListMenuButton: import('vue').DefineSetupFnComponent<{
    color: string;
    zIndex: number;
    config: MenuButtonType;
    tooltip: boolean;
    disabled: boolean;
}, {}, {}, {
    color: string;
    zIndex: number;
    config: MenuButtonType;
    tooltip: boolean;
    disabled: boolean;
} & {}, import('vue').PublicProps>;
