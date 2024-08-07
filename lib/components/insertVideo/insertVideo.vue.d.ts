declare const _default: import('vue').DefineComponent<{
    color: {
        type: StringConstructor;
        default: string;
    };
    allowedFileType: {
        type: import('vue').PropType<string[]>;
        default: null;
    };
    multiple: {
        type: BooleanConstructor;
        default: boolean;
    };
    maxSize: {
        type: NumberConstructor;
        default: null;
    };
    minSize: {
        type: NumberConstructor;
        default: null;
    };
    customUpload: {
        type: import('vue').PropType<((files: File[]) => string[]) | ((files: File[]) => Promise<string[]>)>;
        default: null;
    };
    handleError: {
        type: import('vue').PropType<(error: import('./props').InsertVideoUploadErrorType, file: File) => void>;
        default: null;
    };
}, {}, unknown, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    insert: (...args: any[]) => void;
    change: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    color: {
        type: StringConstructor;
        default: string;
    };
    allowedFileType: {
        type: import('vue').PropType<string[]>;
        default: null;
    };
    multiple: {
        type: BooleanConstructor;
        default: boolean;
    };
    maxSize: {
        type: NumberConstructor;
        default: null;
    };
    minSize: {
        type: NumberConstructor;
        default: null;
    };
    customUpload: {
        type: import('vue').PropType<((files: File[]) => string[]) | ((files: File[]) => Promise<string[]>)>;
        default: null;
    };
    handleError: {
        type: import('vue').PropType<(error: import('./props').InsertVideoUploadErrorType, file: File) => void>;
        default: null;
    };
}>> & {
    onChange?: ((...args: any[]) => any) | undefined;
    onInsert?: ((...args: any[]) => any) | undefined;
}, {
    color: string;
    allowedFileType: string[];
    multiple: boolean;
    maxSize: number;
    minSize: number;
    customUpload: ((files: File[]) => string[]) | ((files: File[]) => Promise<string[]>);
    handleError: (error: import('./props').InsertVideoUploadErrorType, file: File) => void;
}, {}>;
export default _default;
