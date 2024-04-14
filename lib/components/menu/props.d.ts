import { MenuConfigType } from '../../core/tool';
import { ExtractPublicPropTypes, PropType } from 'vue';

export declare const MenuProps: {
    config: {
        type: PropType<MenuConfigType>;
        default: null;
    };
    color: {
        type: StringConstructor;
        default: string;
    };
};
export type MenuPropsType = ExtractPublicPropTypes<typeof MenuProps>;