import { computed, defineComponent, h, inject, PropType, ref, Ref } from 'vue'
import { AlexEditor, AlexElement, AlexElementsRangeType } from 'alex-editor'
import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { getMatchElementByRange } from '@/core/function'
import { MenuDisplayButtonType } from '@/core/tool'

/**
 * feature名称
 */
const FEATURE_NAME = 'codeBlock'

/**
 * 工具栏 - 代码块操作
 */
export const CodeBlockToolbar = defineComponent(
	(props, { expose }) => {
		const editor = inject<Ref<AlexEditor>>('editor')!
		const dataRangeCaches = inject<Ref<AlexElementsRangeType>>('dataRangeCaches')!
		const $editTrans = inject<(key: string) => any>('$editTrans')!

		const btnRef = ref<InstanceType<typeof Button> | null>(null)

		const selectVal = computed<string>(() => {
			const pre = getMatchElementByRange(editor.value, dataRangeCaches.value, {
				parsedom: 'pre'
			})
			if (pre) {
				return pre.marks!['data-editify-hljs'] || ''
			}
			return ''
		})

		//代码块前后插入段落
		const insertParagraphWithPre = (type: 'up' | 'down' | undefined = 'up') => {
			if (!editor.value.range!.anchor.isEqual(editor.value.range!.focus)) {
				editor.value.range!.anchor.element = editor.value.range!.focus.element
				editor.value.range!.anchor.offset = editor.value.range!.focus.offset
			}
			const pre = getMatchElementByRange(editor.value, dataRangeCaches.value, { parsedom: 'pre' })
			if (pre) {
				const paragraph = AlexElement.create({
					type: 'block',
					parsedom: AlexElement.BLOCK_NODE,
					children: [
						{
							type: 'closed',
							parsedom: 'br'
						}
					]
				})
				if (type == 'up') {
					editor.value.addElementBefore(paragraph, pre)
				} else {
					editor.value.addElementAfter(paragraph, pre)
				}
				editor.value.range!.anchor.moveToEnd(paragraph)
				editor.value.range!.focus.moveToEnd(paragraph)
				editor.value.formatElementStack()
				editor.value.domRender()
				editor.value.rangeRender()
			}
		}
		//选择代码语言
		const selectLanguage = (value: string) => {
			const pre = getMatchElementByRange(editor.value, dataRangeCaches.value, { parsedom: 'pre' })
			if (pre) {
				Object.assign(pre.marks!, {
					'data-editify-hljs': value
				})
				editor.value.formatElementStack()
				editor.value.domRender()
				editor.value.rangeRender()
			}
		}

		expose({
			btnRef
		})

		return () => {
			return [
				//代码块前插入段落
				h(
					Button,
					{
						name: 'textWrapUp',
						title: $editTrans('textWrapUp'),
						tooltip: props.tooltip,
						color: props.color,
						zIndex: props.zIndex,
						onOperate: () => insertParagraphWithPre('up')
					},
					{
						default: () => h(Icon, { value: 'text-wrap', class: 'editify-icon-rotate' })
					}
				),
				//代码块后插入段落
				h(
					Button,
					{
						name: 'textWrapDown',
						title: $editTrans('textWrapDown'),
						tooltip: props.tooltip,
						color: props.color,
						zIndex: props.zIndex,
						onOperate: () => insertParagraphWithPre('down')
					},
					{
						default: () => h(Icon, { value: 'text-wrap' })
					}
				),
				//代码块语言选择
				props.language.show
					? h(
							Button,
							{
								ref: btnRef,
								name: 'languages',
								type: 'display',
								title: $editTrans('selectLanguages'),
								leftBorder: props.language.leftBorder,
								rightBorder: props.language.rightBorder,
								displayConfig: {
									options: props.language.options,
									value: selectVal.value,
									width: props.language.width,
									maxHeight: props.language.maxHeight
								},
								active: false,
								disabled: false,
								tooltip: props.tooltip,
								color: props.color,
								zIndex: props.zIndex,
								onOperate: (_name, value) => selectLanguage(value)
							},
							{
								default: () => h(Icon, { value: 'text-wrap' })
							}
					  )
					: null
			]
		}
	},
	{
		name: `_${FEATURE_NAME}`,
		props: {
			color: String as PropType<string | null>,
			zIndex: Number,
			tooltip: Boolean,
			language: Object as PropType<MenuDisplayButtonType>
		}
	}
)
