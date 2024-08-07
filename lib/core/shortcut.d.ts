import { ShortcutType } from './tool';

export type ShortcutConfigType = {
    heading: ShortcutType;
    indent: ShortcutType;
    quote: ShortcutType;
    separator: ShortcutType;
    align: ShortcutType;
    orderList: ShortcutType;
    unorderList: ShortcutType;
    task: ShortcutType;
    bold: ShortcutType;
    underline: ShortcutType;
    italic: ShortcutType;
    strikethrough: ShortcutType;
    code: ShortcutType;
    super: ShortcutType;
    sub: ShortcutType;
    formatClear: ShortcutType;
    fontSize: ShortcutType;
    fontFamily: ShortcutType;
    lineHeight: ShortcutType;
    foreColor: ShortcutType;
    backColor: ShortcutType;
    link: ShortcutType;
    image: ShortcutType;
    video: ShortcutType;
    table: ShortcutType;
    codeBlock: ShortcutType;
    sourceView: ShortcutType;
    fullScreen: ShortcutType;
    attachment: ShortcutType;
    mathformula: ShortcutType;
    infoBlock: ShortcutType;
};
export declare const config: ShortcutConfigType;
