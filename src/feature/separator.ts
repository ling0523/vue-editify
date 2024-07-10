import { defineComponent, h, inject, PropType, Ref } from 'vue'
import { AlexEditor, AlexElementsRangeType } from 'alex-editor'
import { Button } from '@/components/button'
import { MenuSelectButtonType } from '@/core/tool'
import { Icon } from '@/components/icon'
import { hasPreInRange, insertSeparator, isRangeInQuote } from '@/core/function'

/**
 * feature名称
 */
const FEATURE_NAME = 'separator'

/**
 * 菜单栏 - 分隔线
 */
export const SeparatorMenuButton = defineComponent(
	props => {
		const editor = inject<Ref<AlexEditor>>('editor')!
		const dataRangeCaches = inject<Ref<AlexElementsRangeType>>('dataRangeCaches')!
		const $editTrans = inject<(key: string) => any>('$editTrans')!
		const isSourceView = inject<Ref<boolean>>('isSourceView')!

		return () => {
			return props.config.show
				? h(
						Button,
						{
							name: FEATURE_NAME,
							tooltip: props.tooltip,
							color: props.color,
							zIndex: props.zIndex,
							title: $editTrans('separator'),
							leftBorder: props.config.leftBorder,
							rightBorder: props.config.rightBorder,
							active: isRangeInQuote(editor.value, dataRangeCaches.value),
							disabled: props.disabled || isSourceView.value || hasPreInRange(editor.value, dataRangeCaches.value) || props.config.disabled,

							onOperate: () => {
								insertSeparator(editor.value)
								editor.value.formatElementStack()
								editor.value.domRender()
								editor.value.rangeRender()
							}
						},
						{
							default: () => h(Icon, { value: 'separator' })
						}
				  )
				: null
		}
	},
	{
		name: `_${FEATURE_NAME}`,
		props: {
			color: String as PropType<string | null>,
			zIndex: Number,
			config: Object as PropType<MenuSelectButtonType>,
			tooltip: Boolean,
			disabled: Boolean
		}
	}
)