<template>
	<div class="editify" :class="{ fullscreen: isFullScreen, autoheight: !isFullScreen && autoheight }" ref="elRef">
		<!-- 菜单区域 -->
		<Menu v-if="menuConfig.use" :config="menuConfig" :color="color" ref="menuRef"></Menu>
		<!-- 编辑层，与编辑区域宽高相同必须适配 -->
		<div ref="bodyRef" class="editify-body" :class="{ border: showBorder, menu_inner: menuConfig.use && menuConfig.mode == 'inner' }" :data-editify-uid="instance.uid">
			<!-- 编辑器 -->
			<div ref="contentRef" class="editify-content" :class="{ placeholder: showPlaceholder, disabled: disabled }" @keydown="handleEditorKeydown" @click="handleEditorClick" @compositionstart="isInputChinese = true" @compositionend="isInputChinese = false" :data-editify-placeholder="placeholder"></div>
			<!-- 代码视图 -->
			<textarea v-if="isSourceView" :value="value" readonly class="editify-source" />
			<!-- 工具条 -->
			<Toolbar ref="toolbarRef" v-model="toolbarOptions.show" :node="toolbarOptions.node!" :type="toolbarOptions.type" :config="toolbarConfig" :color="color"></Toolbar>
		</div>
		<!-- 编辑器尾部 -->
		<div v-if="showWordLength" class="editify-footer" :class="{ fullscreen: isFullScreen && !isSourceView }" ref="footerRef">
			<!-- 字数统计 -->
			<div class="editify-footer-words">{{ $editTrans('totalWordCount') }}{{ textValue.length }}</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { AlexEditor, AlexElement, AlexElementRangeType, AlexElementsRangeType } from 'alex-editor'
import { element as DapElement, event as DapEvent, data as DapData, number as DapNumber, color as DapColor } from 'dap-util'
import { pasteKeepData, mergeObject, getToolbarConfig, getMenuConfig, MenuConfigType, ObjectType, ToolbarConfigType } from '../core/tool'
import { parseList, orderdListHandle, mediaHandle, tableHandle, preHandle, specialInblockHandle } from '../core/rule'
import { isTask, elementToParagraph, getCurrentParsedomElement, hasTableInRange, hasLinkInRange, hasPreInRange, hasImageInRange, hasVideoInRange, insertImage, insertVideo } from '../core/function'
import Toolbar from '../components/toolbar/toolbar.vue'
import Menu from '../components/menu/menu.vue'
import Layer from '../components/layer/layer.vue'
import { EditifyProps, EditifyTableColumnResizeParamsType, EditifyToolbarOptionsType } from './props'
import { trans } from '../locale'
import { LanguagesItemType } from '../hljs'

//定义组件名称
defineOptions({
	name: 'editify'
})
//获取实例
const instance = getCurrentInstance()!
//属性
const props = defineProps(EditifyProps)
//事件
const emits = defineEmits(['update:modelValue', 'focus', 'blur', 'change', 'keydown', 'insertparagraph', 'rangeupdate', 'updateview'])

//设置国际化方法
const $editTrans = trans(props.locale || 'zh_CN')
//对子孙后代组件提供国际化方法
provide('$editTrans', $editTrans)

//是否编辑器内部修改值
const isModelChange = ref<boolean>(false)
//是否正在输入中文
const isInputChinese = ref<boolean>(false)
//工具条和菜单栏判定延时器
const rangeUpdateTimer = ref<any>(null)
//表格列宽拖拽记录数据
const tableColumnResizeParams = ref<EditifyTableColumnResizeParamsType>({
	element: null, //被拖拽的td
	start: 0 //水平方向起点位置
})
//工具条参数配置
const toolbarOptions = ref<EditifyToolbarOptionsType>({
	//是否显示工具条
	show: false,
	//关联元素
	node: null,
	//类型
	type: 'text'
})

const menuRef = ref<InstanceType<typeof Menu> | null>(null)
const bodyRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const toolbarRef = ref<InstanceType<typeof Toolbar> | null>(null)
const footerRef = ref<HTMLElement | null>(null)
const elRef = ref<HTMLElement | null>(null)

//编辑器对象
const editor = ref<AlexEditor | null>(null)
//是否代码视图
const isSourceView = ref<boolean>(false)
//是否全屏
const isFullScreen = ref<boolean>(false)
//菜单栏是否可以使用标识
const canUseMenu = ref<boolean>(false)
//光标选取范围内的元素数组
const dataRangeCaches = ref<AlexElementsRangeType>({
	flatList: [],
	list: []
})

//编辑器的值
const value = computed<string>({
	set(val) {
		emits('update:modelValue', val)
	},
	get() {
		return props.modelValue || '<p><br></p>'
	}
})
//编辑器的纯文本值
const textValue = computed<string>(() => {
	return (<HTMLElement>DapElement.string2dom(`<div>${value.value}</div>`)).innerText
})
//是否显示占位符
const showPlaceholder = computed<boolean>(() => {
	if (editor.value) {
		if (value.value && editor.value.stack.length == 1 && editor.value.stack[0].type == 'block' && editor.value.stack[0].parsedom == AlexElement.BLOCK_NODE && editor.value.stack[0].isOnlyHasBreak() && !editor.value.stack[0].hasStyles() && !editor.value.stack[0].hasMarks()) {
			return !isInputChinese.value
		}
	}
	return false
})
//是否显示边框
const showBorder = computed<boolean>(() => {
	//全屏模式下不显示边框
	if (isFullScreen.value) {
		return false
	}
	return props.border
})
//最终生效的工具栏配置
const toolbarConfig = computed<ToolbarConfigType>(() => {
	return <ToolbarConfigType>mergeObject(getToolbarConfig($editTrans, props.locale), props.toolbar || {})
})
//最终生效的菜单栏配置
const menuConfig = computed<MenuConfigType>(() => {
	return <MenuConfigType>mergeObject(getMenuConfig($editTrans, props.locale), props.menu || {})
})

//编辑器内部修改值的方法
const internalModify = (val: string) => {
	isModelChange.value = true
	value.value = val
	nextTick(() => {
		isModelChange.value = false
	})
}
//隐藏工具条
const hideToolbar = () => {
	toolbarOptions.value.show = false
	toolbarOptions.value.node = null
}
//监听滚动隐藏工具条
const handleScroll = () => {
	const setScroll = (el: HTMLElement) => {
		DapEvent.on(el, `scroll.editify_${instance.uid}`, () => {
			if (toolbarConfig.value.use && toolbarOptions.value.show) {
				hideToolbar()
			}
		})
		if (el.parentNode) {
			setScroll(<HTMLElement>el.parentNode)
		}
	}
	setScroll(contentRef.value!)
}
//移除上述滚动事件的监听
const removeScrollHandle = () => {
	const removeScroll = (el: HTMLElement) => {
		DapEvent.off(el, `scroll.editify_${instance.uid}`)
		if (el.parentNode) {
			removeScroll(<HTMLElement>el.parentNode)
		}
	}
	removeScroll(contentRef.value!)
}
//工具条显示判断
const handleToolbar = () => {
	if (props.disabled || isSourceView.value) {
		return
	}
	hideToolbar()
	nextTick(() => {
		const table = getCurrentParsedomElement(editor.value!, dataRangeCaches.value, 'table')
		const pre = getCurrentParsedomElement(editor.value!, dataRangeCaches.value, 'pre')
		const link = getCurrentParsedomElement(editor.value!, dataRangeCaches.value, 'a')
		const image = getCurrentParsedomElement(editor.value!, dataRangeCaches.value, 'img')
		const video = getCurrentParsedomElement(editor.value!, dataRangeCaches.value, 'video')
		if (link) {
			toolbarOptions.value.type = 'link'
			toolbarOptions.value.node = `[data-editify-uid="${instance.uid}"] [data-editify-element="${link.key}"]`
			if (toolbarOptions.value.show) {
				;(<InstanceType<typeof Layer>>toolbarRef.value!.$refs.layerRef).setPosition()
			} else {
				toolbarOptions.value.show = true
			}
		} else if (image) {
			toolbarOptions.value.type = 'image'
			toolbarOptions.value.node = `[data-editify-uid="${instance.uid}"] [data-editify-element="${image.key}"]`
			if (toolbarOptions.value.show) {
				;(<InstanceType<typeof Layer>>toolbarRef.value!.$refs.layerRef).setPosition()
			} else {
				toolbarOptions.value.show = true
			}
		} else if (video) {
			toolbarOptions.value.type = 'video'
			toolbarOptions.value.node = `[data-editify-uid="${instance.uid}"] [data-editify-element="${video.key}"]`
			if (toolbarOptions.value.show) {
				;(<InstanceType<typeof Layer>>toolbarRef.value!.$refs.layerRef).setPosition()
			} else {
				toolbarOptions.value.show = true
			}
		} else if (table) {
			toolbarOptions.value.type = 'table'
			toolbarOptions.value.node = `[data-editify-uid="${instance.uid}"] [data-editify-element="${table.key}"]`
			if (toolbarOptions.value.show) {
				;(<InstanceType<typeof Layer>>toolbarRef.value!.$refs.layerRef).setPosition()
			} else {
				toolbarOptions.value.show = true
			}
		} else if (pre) {
			toolbarOptions.value.type = 'codeBlock'
			toolbarOptions.value.node = `[data-editify-uid="${instance.uid}"] [data-editify-element="${pre.key}"]`
			if (toolbarOptions.value.show) {
				;(<InstanceType<typeof Layer>>toolbarRef.value!.$refs.layerRef).setPosition()
			} else {
				toolbarOptions.value.show = true
			}
		} else {
			const result = dataRangeCaches.value.flatList.filter((item: AlexElementRangeType) => {
				return item.element.isText()
			})
			if (result.length && !hasTableInRange(editor.value!, dataRangeCaches.value) && !hasPreInRange(editor.value!, dataRangeCaches.value) && !hasLinkInRange(editor.value!, dataRangeCaches.value) && !hasImageInRange(editor.value!, dataRangeCaches.value) && !hasVideoInRange(editor.value!, dataRangeCaches.value)) {
				toolbarOptions.value.type = 'text'
				if (toolbarOptions.value.show) {
					;(<InstanceType<typeof Layer>>toolbarRef.value!.$refs.layerRef).setPosition()
				} else {
					toolbarOptions.value.show = true
				}
			}
		}
	})
}
//初始创建编辑器
const createEditor = () => {
	//创建编辑器
	editor.value = new AlexEditor(contentRef.value!, {
		value: value.value,
		disabled: props.disabled,
		renderRules: [
			el => {
				parseList(editor.value!, el)
			},
			el => {
				orderdListHandle(editor.value!, el)
			},
			el => {
				mediaHandle(editor.value!, el)
			},
			el => {
				tableHandle(editor.value!, el)
			},
			el => {
				preHandle(editor.value!, el, !!(toolbarConfig.value?.use && toolbarConfig.value?.codeBlock?.languages?.show), <(string | LanguagesItemType)[]>toolbarConfig.value?.codeBlock?.languages?.options)
			},
			el => {
				specialInblockHandle(editor.value!, el)
			},
			...props.renderRules
		],
		allowCopy: props.allowCopy,
		allowPaste: props.allowPaste,
		allowCut: props.allowCut,
		allowPasteHtml: props.allowPasteHtml,
		customImagePaste: !!props.customImagePaste ? handleCustomImagePaste : null,
		customVideoPaste: !!props.customVideoPaste ? handleCustomVideoPaste : null,
		customMerge: handleCustomMerge,
		customParseNode: handleCustomParseNode
	})
	//编辑器渲染后会有一个渲染过程，会改变内容，因此重新获取内容的值来设置value
	internalModify(editor.value.value)
	//设置监听事件
	editor.value.on('change', handleEditorChange)
	editor.value.on('focus', handleEditorFocus)
	editor.value.on('blur', handleEditorBlur)
	editor.value.on('insertParagraph', handleInsertParagraph)
	editor.value.on('rangeUpdate', handleRangeUpdate)
	editor.value.on('pasteHtml', handlePasteHtml)
	editor.value.on('deleteInStart', handleDeleteInStart)
	editor.value.on('deleteComplete', handleDeleteComplete)
	editor.value.on('afterRender', handleAfterRender)
	//格式化和dom渲染
	editor.value.formatElementStack()
	editor.value.domRender()
	//自动获取焦点
	if (props.autofocus && !isSourceView.value && !props.disabled) {
		collapseToEnd()
	}
}
//设定编辑器内的视频高度
const setVideoHeight = () => {
	contentRef.value!.querySelectorAll('video').forEach(video => {
		video.style.height = video.offsetWidth / props.videoRatio + 'px'
	})
}
//鼠标在页面按下：处理表格拖拽改变列宽和菜单栏是否使用判断
const documentMouseDown = (e: Event) => {
	if (props.disabled) {
		return
	}
	//鼠标在编辑器内按下
	if (DapElement.isContains(contentRef.value!, <HTMLElement>e.target)) {
		const elm = <HTMLElement>e.target
		const key = DapData.get(elm, 'data-alex-editor-key')
		if (key) {
			const element = editor.value!.getElementByKey(key)
			if (element && element.parsedom == 'td') {
				const length = element.parent!.children!.length
				//最后一个td不设置
				if (element.parent!.children![length - 1].isEqual(element)) {
					return
				}
				const rect = DapElement.getElementBounding(elm)
				//在可拖拽范围内
				if ((<MouseEvent>e).pageX >= Math.abs(rect.left + elm.offsetWidth - 5) && (<MouseEvent>e).pageX <= Math.abs(rect.left + elm.offsetWidth + 5)) {
					tableColumnResizeParams.value.element = element
					tableColumnResizeParams.value.start = (<MouseEvent>e).pageX
				}
			}
		}
	}
	//如果点击了除编辑器外的地方，菜单栏不可使用
	if (!DapElement.isContains(elRef.value!, <HTMLElement>e.target) && !isSourceView.value) {
		canUseMenu.value = false
	}
}
//鼠标在页面移动：处理表格拖拽改变列宽
const documentMouseMove = (e: Event) => {
	if (props.disabled) {
		return
	}
	if (!tableColumnResizeParams.value.element) {
		return
	}
	const table = getCurrentParsedomElement(editor.value!, dataRangeCaches.value, 'table')
	if (!table) {
		return
	}
	const colgroup = table.children!.find(item => {
		return item.parsedom == 'colgroup'
	})!
	const index = tableColumnResizeParams.value.element.parent!.children!.findIndex(el => {
		return el.isEqual(tableColumnResizeParams.value.element!)
	})
	const width = `${tableColumnResizeParams.value.element.elm!.offsetWidth + (<MouseEvent>e).pageX - tableColumnResizeParams.value.start}`
	colgroup.children![index].marks!['width'] = width
	colgroup.children![index].elm!.setAttribute('width', width)
	tableColumnResizeParams.value.start = (<MouseEvent>e).pageX
}
//鼠标在页面松开：处理表格拖拽改变列宽
const documentMouseUp = () => {
	if (props.disabled) {
		return
	}
	if (!tableColumnResizeParams.value.element) {
		return
	}
	const table = getCurrentParsedomElement(editor.value!, dataRangeCaches.value, 'table')
	if (!table) {
		return
	}
	const colgroup = table.children!.find(item => {
		return item.parsedom == 'colgroup'
	})!
	const index = tableColumnResizeParams.value.element.parent!.children!.findIndex(el => {
		return el.isEqual(tableColumnResizeParams.value.element!)
	})
	const width = Number(colgroup.children![index].marks!['width'])
	if (!isNaN(width)) {
		colgroup.children![index].marks!['width'] = `${Number(((width / tableColumnResizeParams.value.element.parent!.elm!.offsetWidth) * 100).toFixed(2))}%`
		editor.value!.formatElementStack()
		editor.value!.domRender()
		editor.value!.rangeRender()
	}
	tableColumnResizeParams.value.element = null
	tableColumnResizeParams.value.start = 0
}
//鼠标点击页面：处理任务列表复选框勾选
const documentClick = (e: Event) => {
	if (props.disabled) {
		return
	}
	//鼠标在编辑器内点击
	if (DapElement.isContains(contentRef.value!, <HTMLElement>e.target)) {
		const elm = <HTMLElement>e.target
		const key = DapData.get(elm, 'data-alex-editor-key')
		if (key) {
			const element = editor.value!.getElementByKey(key)!
			//如果是任务列表元素
			if (isTask(element)) {
				const rect = DapElement.getElementBounding(elm)
				//在复选框范围内
				if ((<MouseEvent>e).pageX >= Math.abs(rect.left) && (<MouseEvent>e).pageX <= Math.abs(rect.left + 16) && (<MouseEvent>e).pageY >= Math.abs(rect.top + 2) && (<MouseEvent>e).pageY <= Math.abs(rect.top + 18)) {
					//取消勾选
					if (element.marks!['data-editify-task'] == 'checked') {
						element.marks!['data-editify-task'] = 'uncheck'
					}
					//勾选
					else {
						element.marks!['data-editify-task'] = 'checked'
					}
					if (!editor.value!.range) {
						editor.value!.initRange()
					}
					editor.value!.range!.anchor.moveToEnd(element)
					editor.value!.range!.focus.moveToEnd(element)
					editor.value!.formatElementStack()
					editor.value!.domRender()
					editor.value!.rangeRender()
				}
			}
		}
	}
}
//自定义图片粘贴
const handleCustomImagePaste = async (url: string) => {
	const newUrl = await props.customImagePaste.apply(instance.proxy, [url])
	if (newUrl) {
		insertImage(editor.value!, newUrl)
	}
}
//自定义视频粘贴
const handleCustomVideoPaste = async (url: string) => {
	const newUrl = await props.customVideoPaste.apply(instance.proxy, [url])
	if (newUrl) {
		insertVideo(editor.value!, newUrl)
	}
}
//重新定义编辑器合并元素的逻辑
const handleCustomMerge = (ele: AlexElement, preEle: AlexElement) => {
	const uneditable = preEle.getUneditableElement()
	if (uneditable) {
		uneditable.toEmpty()
	} else {
		preEle.children!.push(...ele.children!)
		preEle.children!.forEach(item => {
			item.parent = preEle
		})
		ele.children = null
	}
}
//针对node转为元素进行额外的处理
const handleCustomParseNode = (ele: AlexElement) => {
	if (ele.parsedom == 'code') {
		ele.parsedom = 'span'
		const marks = {
			'data-editify-code': true
		}
		if (ele.hasMarks()) {
			Object.assign(ele.marks!, marks)
		} else {
			ele.marks = marks
		}
	}
	if (typeof props.customParseNode == 'function') {
		ele = props.customParseNode.apply(instance.proxy, [ele])
	}
	return ele
}
//编辑区域键盘按下：设置缩进快捷键
const handleEditorKeydown = (e: Event) => {
	if (props.disabled) {
		return
	}
	//单独按下tab键
	if ((<KeyboardEvent>e).key.toLocaleLowerCase() == 'tab' && !(<KeyboardEvent>e).metaKey && !(<KeyboardEvent>e).shiftKey && !(<KeyboardEvent>e).ctrlKey && !(<KeyboardEvent>e).altKey && props.tab) {
		e.preventDefault()
		editor.value!.insertText('    ')
		editor.value!.formatElementStack()
		editor.value!.domRender()
		editor.value!.rangeRender()
	}
	//自定义键盘按下操作
	emits('keydown', e)
}
//点击编辑器：处理图片和视频的光标聚集
const handleEditorClick = (e: Event) => {
	if (props.disabled || isSourceView.value) {
		return
	}
	const node = <HTMLElement>e.target
	//点击的是图片或者视频
	if (node.nodeName.toLocaleLowerCase() == 'img' || node.nodeName.toLocaleLowerCase() == 'video') {
		const key = Number(node.getAttribute('data-editify-element'))
		if (DapNumber.isNumber(key)) {
			const element = editor.value!.getElementByKey(key)!
			if (!editor.value!.range) {
				editor.value!.initRange()
			}
			editor.value!.range!.anchor.moveToStart(element)
			editor.value!.range!.focus.moveToEnd(element)
			editor.value!.rangeRender()
		}
	}
}
//编辑器的值更新
const handleEditorChange = (newVal: string, oldVal: string) => {
	if (props.disabled) {
		return
	}
	//内部修改
	internalModify(newVal)
	//触发change事件
	emits('change', newVal, oldVal)
}
//编辑器失去焦点
const handleEditorBlur = (val: string) => {
	if (props.disabled) {
		return
	}
	if (props.border && props.color && !isFullScreen.value) {
		//恢复编辑区域边框颜色
		bodyRef.value!.style.borderColor = ''
		//恢复编辑区域阴影颜色
		bodyRef.value!.style.boxShadow = ''
		//使用菜单栏的情况下恢复菜单栏的样式
		if (menuConfig.value.use) {
			menuRef.value!.$el.style.borderColor = ''
			menuRef.value!.$el.style.boxShadow = ''
		}
	}
	emits('blur', val)
}
//编辑器获取焦点
const handleEditorFocus = (val: string) => {
	if (props.disabled) {
		return
	}
	if (props.border && props.color && !isFullScreen.value) {
		//编辑区域边框颜色
		bodyRef.value!.style.borderColor = props.color
		//转换颜色值
		const rgb = DapColor.hex2rgb(props.color)
		//菜单栏模式为inner
		if (menuConfig.value.use && menuConfig.value.mode == 'inner') {
			//编辑区域除顶部边框的阴影
			bodyRef.value!.style.boxShadow = `0 8px 8px -8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5),8px 0 8px -8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5), -8px 0 8px -8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`
			//菜单栏的边框颜色
			menuRef.value!.$el.style.borderColor = props.color
			//菜单栏除底部边框的阴影
			menuRef.value!.$el.style.boxShadow = `0 -8px 8px -8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5),8px 0 8px -8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5), -8px 0 8px -8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`
		}
		//其他菜单栏模式
		else if (menuConfig.value.use) {
			//编辑区域四边阴影
			bodyRef.value!.style.boxShadow = `0 0 8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`
		}
		//不使用菜单栏
		else {
			//编辑区域四边阴影
			bodyRef.value!.style.boxShadow = `0 0 8px rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`
		}
	}
	//获取焦点时可以使用菜单栏
	setTimeout(() => {
		canUseMenu.value = true
		emits('focus', val)
	}, 0)
}
//编辑器换行
const handleInsertParagraph = (element: AlexElement, previousElement: AlexElement) => {
	//前一个块元素如果是只包含换行符的元素，并且当前块元素也是包含换行符的元素，则当前块元素转为段落
	if (previousElement.isOnlyHasBreak() && element.isOnlyHasBreak()) {
		if (previousElement.parsedom != AlexElement.BLOCK_NODE) {
			elementToParagraph(previousElement)
			editor.value!.range!.anchor.moveToStart(previousElement)
			editor.value!.range!.focus.moveToStart(previousElement)
			element.toEmpty()
		}
	}
	emits('insertparagraph', value.value)
}
//编辑器焦点更新
const handleRangeUpdate = () => {
	if (props.disabled) {
		return
	}
	//如果没有range禁用菜单栏
	canUseMenu.value = !!editor.value!.range
	//没有range直接返回
	if (!editor.value!.range) {
		return
	}
	//获取光标选取范围内的元素数据，并且进行缓存
	dataRangeCaches.value = editor.value!.getElementsByRange()

	//节流写法
	if (rangeUpdateTimer.value) {
		clearTimeout(rangeUpdateTimer.value)
		rangeUpdateTimer.value = null
	}
	//延时200ms进行判断
	rangeUpdateTimer.value = setTimeout(() => {
		//如果使用工具条或者菜单栏
		if (toolbarConfig.value.use || menuConfig.value.use) {
			//如果使用工具条
			if (toolbarConfig.value.use) {
				handleToolbar()
			}
			//如果使用菜单栏
			if (menuConfig.value.use) {
				menuRef.value!.handleRangeUpdate()
			}
		}
	}, 200)
	emits('rangeupdate')
}
//编辑器粘贴html
const handlePasteHtml = (elements: AlexElement[]) => {
	const keepStyles = Object.assign(pasteKeepData.styles, props.pasteKeepStyles || {})
	const keepMarks = Object.assign(pasteKeepData.marks, props.pasteKeepMarks || {})
	//粘贴html时过滤元素的样式和属性
	AlexElement.flatElements(elements).forEach(el => {
		let marks: ObjectType = {}
		let styles: ObjectType = {}
		if (el.hasMarks()) {
			for (let key in keepMarks) {
				if (el.marks!.hasOwnProperty(key) && ((Array.isArray(keepMarks[key]) && keepMarks[key].includes(el.parsedom)) || keepMarks[key] == '*')) {
					marks[key] = el.marks![key]
				}
			}
			el.marks = marks
		}
		if (el.hasStyles() && !el.isText()) {
			for (let key in keepStyles) {
				if (el.styles!.hasOwnProperty(key) && ((Array.isArray(keepStyles[key]) && keepStyles[key].includes(el.parsedom)) || keepStyles[key] == '*')) {
					styles[key] = el.styles![key]
				}
			}
			el.styles = styles
		}
	})
}
//编辑器部分删除情景(在编辑器起始处)
const handleDeleteInStart = (element: AlexElement) => {
	if (element.isBlock()) {
		elementToParagraph(element)
	}
}
//编辑器删除完成后事件
const handleDeleteComplete = () => {
	const uneditable = editor.value!.range!.anchor.element.getUneditableElement()
	if (uneditable) {
		uneditable.toEmpty()
	}
}
//编辑器dom渲染
const handleAfterRender = () => {
	//设定视频高度
	setVideoHeight()
	emits('updateview')
}
//api：光标设置到文档底部
const collapseToEnd = () => {
	if (props.disabled) {
		return
	}
	editor.value!.collapseToEnd()
	editor.value!.rangeRender()
	DapElement.setScrollTop({
		el: contentRef.value!,
		number: 1000000,
		time: 0
	})
}
//api：光标设置到文档头部
const collapseToStart = () => {
	if (props.disabled) {
		return
	}
	editor.value!.collapseToStart()
	editor.value!.rangeRender()
	nextTick(() => {
		DapElement.setScrollTop({
			el: contentRef.value!,
			number: 0,
			time: 0
		})
	})
}
//api：撤销
const undo = () => {
	if (props.disabled) {
		return
	}
	const historyRecord = editor.value!.history.get(-1)
	if (historyRecord) {
		editor.value!.history.current = historyRecord.current
		editor.value!.stack = historyRecord.stack
		editor.value!.range = historyRecord.range
		editor.value!.formatElementStack()
		editor.value!.domRender(true)
		editor.value!.rangeRender()
	}
}
//api：重做
const redo = () => {
	if (props.disabled) {
		return
	}
	const historyRecord = editor.value!.history.get(1)
	if (historyRecord) {
		editor.value!.history.current = historyRecord.current
		editor.value!.stack = historyRecord.stack
		editor.value!.range = historyRecord.range
		editor.value!.formatElementStack()
		editor.value!.domRender(true)
		editor.value!.rangeRender()
	}
}

//监听编辑的值变更
watch(
	() => value.value,
	newVal => {
		//内部修改不处理
		if (isModelChange.value) {
			return
		}
		//如果是外部修改，需要重新渲染编辑器
		editor.value!.stack = editor.value!.parseHtml(newVal)
		editor.value!.range = null
		editor.value!.formatElementStack()
		editor.value!.domRender()
		editor.value!.rangeRender()
		contentRef.value!.blur()
	}
)
//代码视图切换
watch(
	() => isSourceView.value,
	newVal => {
		if (toolbarConfig.value.use) {
			if (newVal) {
				hideToolbar()
			} else {
				handleToolbar()
			}
		}
	}
)
//监听disabled
watch(
	() => props.disabled,
	newVal => {
		if (newVal) {
			editor.value!.setDisabled()
		} else {
			editor.value!.setEnabled()
		}
	}
)

onMounted(() => {
	//创建编辑器
	createEditor()
	//监听滚动隐藏工具条
	handleScroll()
	//鼠标按下监听
	DapEvent.on(document.documentElement, `mousedown.editify_${instance.uid}`, documentMouseDown)
	//鼠标移动监听
	DapEvent.on(document.documentElement, `mousemove.editify_${instance.uid}`, documentMouseMove)
	//鼠标松开监听
	DapEvent.on(document.documentElement, `mouseup.editify_${instance.uid}`, documentMouseUp)
	//鼠标点击箭头
	DapEvent.on(document.documentElement, `click.editify_${instance.uid}`, documentClick)
	//监听窗口改变
	DapEvent.on(window, `resize.editify_${instance.uid}`, setVideoHeight)
})

onBeforeUnmount(() => {
	//卸载绑定在滚动元素上的事件
	removeScrollHandle()
	//卸载绑定在document.documentElement上的事件
	DapEvent.off(document.documentElement, `mousedown.editify_${instance.uid} mousemove.editify_${instance.uid} mouseup.editify_${instance.uid} click.editify_${instance.uid}`)
	//卸载绑定在window上的事件
	DapEvent.off(window, `resize.editify_${instance.uid}`)
	//销毁编辑器
	editor.value!.destroy()
})

provide('editify', instance)
provide('isSourceView', isSourceView)
provide('isFullScreen', isFullScreen)
provide('canUseMenu', canUseMenu)
provide('editor', editor)
provide('dataRangeCaches', dataRangeCaches)
provide('showBorder', showBorder)

defineExpose({
	editor,
	isSourceView,
	isFullScreen,
	canUseMenu,
	dataRangeCaches,
	textValue,
	collapseToEnd,
	collapseToStart,
	undo,
	redo
})
</script>
<style scoped src="./editify.less"></style>