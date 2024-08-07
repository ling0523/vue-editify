import { MenuSelectButtonType } from '../core/tool';

/**
 * 工具栏 - 编辑链接
 */
export declare const linkToolbar: import('vue').DefineSetupFnComponent<{
    color: string;
}, {}, {}, {
    color: string;
} & {}, import('vue').PublicProps>;
/**
 * 菜单栏 - 插入链接
 */
export declare const LinkMenuButton: import('vue').DefineSetupFnComponent<{
    color: string;
    zIndex: number;
    config: MenuSelectButtonType;
    tooltip: boolean;
    disabled: boolean;
}, {}, {}, {
    color: string;
    zIndex: number;
    config: MenuSelectButtonType;
    tooltip: boolean;
    disabled: boolean;
} & {}, import('vue').PublicProps>;
