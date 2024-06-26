import { ExtractPublicPropTypes, PropType } from 'vue';
import { ObjectType } from '../../core/tool';

export declare const CheckboxProps: {
    disabled: {
        type: BooleanConstructor;
        default: boolean;
    };
    modelValue: {
        type: PropType<boolean | any[]>;
        default: boolean;
    };
    label: {
        type: StringConstructor;
        default: null;
    };
    value: {
        type: PropType<string | number | any[] | ObjectType>;
        default: string;
    };
    round: {
        type: BooleanConstructor;
        default: boolean;
    };
    placement: {
        type: PropType<"left" | "right">;
        default: string;
        validator(value: any): boolean;
    };
    color: {
        type: PropType<string | null>;
        default: string;
        validator(value: any): boolean;
    };
};
export type CheckboxPropsType = ExtractPublicPropTypes<typeof CheckboxProps>;
