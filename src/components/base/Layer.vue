<template>
	<Transition :name="animation ? 'editify-layer-' + animation : 'editify-layer'" @enter="handleEnter" @after-enter="handleAfterEnter" @after-leave="handleAfterLeave">
		<div v-if="modelValue" class="editify-layer" :data-editify-placement="realPlacement || null" :style="{ zIndex: zIndex }">
			<Triangle v-if="showTriangle" :color="border && borderColor ? borderColor : background" :background="background" :placement="triPlacement" ref="triangle" />
			<div ref="wrap" class="editify-layer-wrap" :class="{ border: border }" :style="wrapStyle">
				<slot></slot>
			</div>
		</div>
	</Transition>
</template>
<script>
import { getCurrentInstance } from 'vue'
import { element as DapElement, event as DapEvent } from 'dap-util'
import Triangle from './Triangle'
export default {
	name: 'Layer',
	emits: ['update:modelValue', 'show', 'shown', 'hidden'],
	props: {
		//是否显示
		modelValue: {
			type: Boolean,
			default: false
		},
		//关联元素
		node: {
			type: [String, Node],
			default: null
		},
		//是否显示边框
		border: {
			type: Boolean,
			default: false
		},
		//边框颜色
		borderColor: {
			type: String,
			default: null
		},
		//背景色
		background: {
			type: String,
			default: null
		},
		//字体颜色
		color: {
			type: String,
			default: null
		},
		//位置
		placement: {
			type: String,
			default: 'bottom',
			validator(value) {
				return ['top', 'bottom', 'top-start', 'top-end', 'bottom-start', 'bottom-end'].includes(value)
			}
		},
		//是否显示三角形
		showTriangle: {
			type: Boolean,
			default: false
		},
		//层级
		zIndex: {
			type: Number,
			default: 10
		},
		//动画
		animation: {
			type: String,
			default: null,
			validator(value) {
				return ['translate', 'fade', null].includes(value)
			}
		},
		//是否根据range对象来定位，此时不需要传入node
		useRange: {
			type: Boolean,
			default: false
		}
	},
	setup() {
		const uid = getCurrentInstance().uid
		return {
			uid
		}
	},
	data() {
		return {
			realPlacement: null,
			//三角图标大小
			triangleSize: 6
		}
	},
	components: {
		Triangle
	},
	computed: {
		//三角形位置
		triPlacement() {
			if (this.realPlacement == 'bottom-start' || this.realPlacement == 'bottom' || this.realPlacement == 'bottom-end') {
				return 'top'
			}
			if (this.realPlacement == 'top-start' || this.realPlacement == 'top' || this.realPlacement == 'top-end') {
				return 'bottom'
			}
			if (this.realPlacement == 'left-start' || this.realPlacement == 'left' || this.realPlacement == 'left-end') {
				return 'right'
			}
			if (this.realPlacement == 'right-start' || this.realPlacement == 'right' || this.realPlacement == 'right-end') {
				return 'left'
			}
			return 'top'
		},
		wrapStyle() {
			return {
				borderColor: this.border ? this.borderColor || '' : '',
				background: this.background || '',
				color: this.color || ''
			}
		}
	},
	mounted() {
		if (this.modelValue) {
			this.setPosition()
		}
		DapEvent.on(window, `click.editify_layer_${this.uid}`, this.handleClick)
		DapEvent.on(window, `resize.editify_layer_${this.uid}`, this.handleResize)
	},
	methods: {
		//显示时
		handleEnter(el) {
			this.setPosition()
			this.$emit('show', el)
		},
		//完全显示后
		handleAfterEnter(el) {
			this.$emit('shown', el)
		},
		//完全隐藏后
		handleAfterLeave(el) {
			this.$emit('hidden', el)
		},
		//窗口尺寸改动
		handleResize() {
			if (this.modelValue) {
				this.$emit('update:modelValue', false)
			}
		},
		//点击定位父元素外的元素关闭浮层
		handleClick(e) {
			if (!DapElement.isElement(this.$el)) {
				return
			}
			if (DapElement.isContains(this.$el.offsetParent, e.target)) {
				return
			}
			if (this.modelValue) {
				this.$emit('update:modelValue', false)
			}
		},
		//根据range设置三角形位置
		setTrianglePositionByRange() {
			const selection = window.getSelection()
			if (selection.rangeCount) {
				const range = selection.getRangeAt(0)
				const rects = range.getClientRects()
				if (rects.length) {
					//range的第一个位置
					const firstRect = rects[0]
					//range的最后一个位置
					const lastRect = rects[rects.length - 1]
					if (this.realPlacement == 'top') {
						this.$refs.triangle.$el.style.left = this.$refs.wrap.offsetWidth / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
						this.$refs.triangle.$el.style.right = 'auto'
						this.$refs.triangle.$el.style.top = this.$refs.wrap.offsetHeight - 1 + 'px'
						this.$refs.triangle.$el.style.bottom = 'auto'
					} else if (this.realPlacement == 'top-start') {
						this.$refs.triangle.$el.style.left = (this.$refs.wrap.offsetWidth > firstRect.width ? firstRect.width : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
						this.$refs.triangle.$el.style.right = 'auto'
						this.$refs.triangle.$el.style.top = this.$refs.wrap.offsetHeight - 1 + 'px'
						this.$refs.triangle.$el.style.bottom = 'auto'
					} else if (this.realPlacement == 'top-end') {
						this.$refs.triangle.$el.style.left = 'auto'
						this.$refs.triangle.$el.style.right = (this.$refs.wrap.offsetWidth > firstRect.width ? firstRect.width : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
						this.$refs.triangle.$el.style.top = this.$refs.wrap.offsetHeight - 1 + 'px'
						this.$refs.triangle.$el.style.bottom = 'auto'
					} else if (this.realPlacement == 'bottom') {
						this.$refs.triangle.$el.style.left = this.$refs.wrap.offsetWidth / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
						this.$refs.triangle.$el.style.right = 'auto'
						this.$refs.triangle.$el.style.top = 'auto'
						this.$refs.triangle.$el.style.bottom = this.$refs.wrap.offsetHeight - 1 + 'px'
					} else if (this.realPlacement == 'bottom-start') {
						this.$refs.triangle.$el.style.left = (this.$refs.wrap.offsetWidth > lastRect.width ? lastRect.width : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
						this.$refs.triangle.$el.style.right = 'auto'
						this.$refs.triangle.$el.style.top = 'auto'
						this.$refs.triangle.$el.style.bottom = this.$refs.wrap.offsetHeight - 1 + 'px'
					} else if (this.realPlacement == 'bottom-end') {
						this.$refs.triangle.$el.style.left = 'auto'
						this.$refs.triangle.$el.style.right = (this.$refs.wrap.offsetWidth > lastRect.width ? lastRect.width : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
						this.$refs.triangle.$el.style.top = 'auto'
						this.$refs.triangle.$el.style.bottom = this.$refs.wrap.offsetHeight - 1 + 'px'
					} else {
						this.$refs.triangle.$el.style.left = this.$refs.wrap.offsetWidth / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
						this.$refs.triangle.$el.style.right = 'auto'
						this.$refs.triangle.$el.style.top = -this.$refs.triangle.$el.offsetHeight + 1 + 'px'
						this.$refs.triangle.$el.style.bottom = 'auto'
					}
				}
			}
		},
		//根据node设置三角形位置
		setTrianglePositionByNode() {
			const node = this.getNode()
			if (!DapElement.isElement(node)) {
				return
			}
			if (this.realPlacement == 'top') {
				this.$refs.triangle.$el.style.left = this.$refs.wrap.offsetWidth / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
				this.$refs.triangle.$el.style.right = 'auto'
				this.$refs.triangle.$el.style.top = this.$refs.wrap.offsetHeight - 1 + 'px'
				this.$refs.triangle.$el.style.bottom = 'auto'
			} else if (this.realPlacement == 'top-start') {
				this.$refs.triangle.$el.style.left = (this.$refs.wrap.offsetWidth > node.offsetWidth ? node.offsetWidth : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
				this.$refs.triangle.$el.style.right = 'auto'
				this.$refs.triangle.$el.style.top = this.$refs.wrap.offsetHeight - 1 + 'px'
				this.$refs.triangle.$el.style.bottom = 'auto'
			} else if (this.realPlacement == 'top-end') {
				this.$refs.triangle.$el.style.left = 'auto'
				this.$refs.triangle.$el.style.right = (this.$refs.wrap.offsetWidth > node.offsetWidth ? node.offsetWidth : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
				this.$refs.triangle.$el.style.top = this.$refs.wrap.offsetHeight - 1 + 'px'
				this.$refs.triangle.$el.style.bottom = 'auto'
			} else if (this.realPlacement == 'bottom') {
				this.$refs.triangle.$el.style.left = this.$refs.wrap.offsetWidth / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
				this.$refs.triangle.$el.style.right = 'auto'
				this.$refs.triangle.$el.style.top = 'auto'
				this.$refs.triangle.$el.style.bottom = this.$refs.wrap.offsetHeight - 1 + 'px'
			} else if (this.realPlacement == 'bottom-start') {
				this.$refs.triangle.$el.style.left = (this.$refs.wrap.offsetWidth > node.offsetWidth ? node.offsetWidth : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
				this.$refs.triangle.$el.style.right = 'auto'
				this.$refs.triangle.$el.style.top = 'auto'
				this.$refs.triangle.$el.style.bottom = this.$refs.wrap.offsetHeight - 1 + 'px'
			} else if (this.realPlacement == 'bottom-end') {
				this.$refs.triangle.$el.style.left = 'auto'
				this.$refs.triangle.$el.style.right = (this.$refs.wrap.offsetWidth > node.offsetWidth ? node.offsetWidth : this.$refs.wrap.offsetWidth) / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
				this.$refs.triangle.$el.style.top = 'auto'
				this.$refs.triangle.$el.style.bottom = this.$refs.wrap.offsetHeight - 1 + 'px'
			} else {
				this.$refs.triangle.$el.style.left = this.$refs.wrap.offsetWidth / 2 - this.$refs.triangle.$el.offsetWidth / 2 + 'px'
				this.$refs.triangle.$el.style.right = 'auto'
				this.$refs.triangle.$el.style.top = -this.$refs.triangle.$el.offsetHeight + 1 + 'px'
				this.$refs.triangle.$el.style.bottom = 'auto'
			}
		},
		//根据range设置位置
		setPositionByRange() {
			//重置
			this.realPlacement = null
			const selection = window.getSelection()
			if (selection.rangeCount) {
				const range = selection.getRangeAt(0)
				const rects = range.getClientRects()
				if (rects.length) {
					//range的第一个位置
					const firstRect = rects[0]
					//range的最后一个位置
					const lastRect = rects[rects.length - 1]
					//定位父元素的位置
					const parentRect = DapElement.getElementBounding(this.$el.offsetParent)
					//可视窗口高度
					const documentHeight = document.documentElement.clientHeight || window.innerHeight
					//可视窗口宽度
					const documentWidth = document.documentElement.clientWidth || window.innerWidth

					if (this.placement == 'top' || this.placement == 'top-start' || this.placement == 'top-end') {
						if (firstRect.top >= 0 && firstRect.top >= parentRect.top && firstRect.top >= this.$el.offsetHeight) {
							this.realPlacement = this.placement
						} else if (documentHeight - lastRect.bottom >= 0 && documentHeight - lastRect.bottom >= parentRect.bottom && documentHeight - lastRect.bottom >= this.$el.offsetHeight) {
							this.realPlacement = this.placement == 'top' ? 'bottom' : this.placement == 'top-start' ? 'bottom-start' : 'bottom-end'
						}
					} else if (this.placement == 'bottom' || this.placement == 'bottom-start' || this.placement == 'bottom-end') {
						if (documentHeight - lastRect.bottom >= 0 && documentHeight - lastRect.bottom >= parentRect.bottom && documentHeight - lastRect.bottom >= this.$el.offsetHeight) {
							this.realPlacement = this.placement
						} else if (firstRect.top >= 0 && firstRect.top >= parentRect.top && firstRect.top >= this.$el.offsetHeight) {
							this.realPlacement = this.placement == 'bottom' ? 'top' : this.placement == 'bottom-start' ? 'top-start' : 'top-end'
						}
					}

					//判断左右是否足够空间显示
					if (this.realPlacement == 'top') {
						if (documentWidth - firstRect.right + firstRect.width / 2 < this.$el.offsetWidth / 2) {
							this.realPlacement = 'top-end'
						} else if (firstRect.left + firstRect.width / 2 < this.$el.offsetWidth / 2) {
							this.realPlacement = 'top-start'
						}
					} else if (this.realPlacement == 'bottom') {
						if (documentWidth - lastRect.right + lastRect.width / 2 < this.$el.offsetWidth / 2) {
							this.realPlacement = 'bottom-end'
						} else if (lastRect.left + lastRect.width / 2 < this.$el.offsetWidth / 2) {
							this.realPlacement = 'bottom-start'
						}
					} else if (this.realPlacement == 'top-start') {
						if (documentWidth - firstRect.right + firstRect.width < this.$el.offsetWidth) {
							if (documentWidth - firstRect.right + firstRect.width / 2 >= this.$el.offsetWidth / 2) {
								this.realPlacement = 'top'
							} else {
								this.realPlacement = 'top-end'
							}
						}
					} else if (this.realPlacement == 'bottom-start') {
						if (documentWidth - lastRect.right + lastRect.width < this.$el.offsetWidth) {
							if (documentWidth - lastRect.right + lastRect.width / 2 >= this.$el.offsetWidth / 2) {
								this.realPlacement = 'bottom'
							} else {
								this.realPlacement = 'bottom-end'
							}
						}
					} else if (this.realPlacement == 'top-end') {
						if (firstRect.left + firstRect.width < this.$el.offsetWidth) {
							if (firstRect.left + firstRect.width / 2 >= this.$el.offsetWidth / 2) {
								this.realPlacement = 'top'
							} else {
								this.realPlacement = 'top-start'
							}
						}
					} else if (this.realPlacement == 'bottom-end') {
						if (lastRect.left + lastRect.width < this.$el.offsetWidth) {
							if (lastRect.left + lastRect.width / 2 >= this.$el.offsetWidth / 2) {
								this.realPlacement = 'bottom'
							} else {
								this.realPlacement = 'bottom-start'
							}
						}
					}
					this.$nextTick(() => {
						//设置位置对应的样式
						if (this.realPlacement == 'top') {
							this.$el.style.left = firstRect.left - parentRect.left + firstRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
							this.$el.style.right = 'auto'
							this.$el.style.top = firstRect.top - parentRect.top - this.$el.offsetHeight + 'px'
							this.$el.style.bottom = 'auto'
						} else if (this.realPlacement == 'top-start') {
							this.$el.style.left = firstRect.left - parentRect.left + 'px'
							this.$el.style.right = 'auto'
							this.$el.style.top = firstRect.top - parentRect.top - this.$el.offsetHeight + 'px'
							this.$el.style.bottom = 'auto'
						} else if (this.realPlacement == 'top-end') {
							this.$el.style.left = 'auto'
							this.$el.style.right = documentWidth - firstRect.right - parentRect.right + 'px'
							this.$el.style.top = firstRect.top - parentRect.top - this.$el.offsetHeight + 'px'
							this.$el.style.bottom = 'auto'
						} else if (this.realPlacement == 'bottom') {
							this.$el.style.left = lastRect.left - parentRect.left + lastRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
							this.$el.style.right = 'auto'
							this.$el.style.top = 'auto'
							this.$el.style.bottom = documentHeight - lastRect.bottom - parentRect.bottom - this.$el.offsetHeight + 'px'
						} else if (this.realPlacement == 'bottom-start') {
							this.$el.style.left = lastRect.left - parentRect.left + 'px'
							this.$el.style.right = 'auto'
							this.$el.style.top = 'auto'
							this.$el.style.bottom = documentHeight - lastRect.bottom - parentRect.bottom - this.$el.offsetHeight + 'px'
						} else if (this.realPlacement == 'bottom-end') {
							this.$el.style.left = 'auto'
							this.$el.style.right = documentWidth - lastRect.right - parentRect.right + 'px'
							this.$el.style.top = 'auto'
							this.$el.style.bottom = documentHeight - lastRect.bottom - parentRect.bottom - this.$el.offsetHeight + 'px'
						} else {
							this.$el.style.top = 'auto'
							this.$el.style.bottom = (parentRect.bottom < 0 ? -parentRect.bottom : 0) + 'px'
							if (this.placement == 'top') {
								//top-end
								if (documentWidth - firstRect.right + firstRect.width / 2 < this.$el.offsetWidth / 2) {
									this.$el.style.left = 'auto'
									this.$el.style.right = documentWidth - firstRect.right - parentRect.right + 'px'
								}
								//top-start
								else if (firstRect.left + firstRect.width / 2 < this.$el.offsetWidth / 2) {
									this.$el.style.left = firstRect.left - parentRect.left + 'px'
									this.$el.style.right = 'auto'
								}
								//top
								else {
									this.$el.style.left = firstRect.left - parentRect.left + firstRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
									this.$el.style.right = 'auto'
								}
							} else if (this.placement == 'bottom') {
								//bottom-end
								if (documentWidth - lastRect.right + lastRect.width / 2 < this.$el.offsetWidth / 2) {
									this.$el.style.left = 'auto'
									this.$el.style.right = documentWidth - lastRect.right - parentRect.right + 'px'
								}
								//bottom-start
								else if (lastRect.left + lastRect.width / 2 < this.$el.offsetWidth / 2) {
									this.$el.style.left = lastRect.left - parentRect.left + 'px'
									this.$el.style.right = 'auto'
								}
								//bottom
								else {
									this.$el.style.left = lastRect.left - parentRect.left + lastRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
									this.$el.style.right = 'auto'
								}
							} else if (this.placement == 'top-start') {
								if (documentWidth - firstRect.right + firstRect.width < this.$el.offsetWidth) {
									//top
									if (documentWidth - firstRect.right + firstRect.width / 2 >= this.$el.offsetWidth / 2) {
										this.$el.style.left = firstRect.left - parentRect.left + firstRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
										this.$el.style.right = 'auto'
									}
									//top-end
									else {
										this.$el.style.left = 'auto'
										this.$el.style.right = documentWidth - firstRect.right - parentRect.right + 'px'
									}
								}
								//top-start
								else {
									this.$el.style.left = firstRect.left - parentRect.left + 'px'
									this.$el.style.right = 'auto'
								}
							} else if (this.placement == 'bottom-start') {
								if (documentWidth - lastRect.right + lastRect.width < this.$el.offsetWidth) {
									//bottom
									if (documentWidth - lastRect.right + lastRect.width / 2 >= this.$el.offsetWidth / 2) {
										this.$el.style.left = lastRect.left - parentRect.left + lastRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
										this.$el.style.right = 'auto'
									}
									//bottom-end
									else {
										this.$el.style.left = 'auto'
										this.$el.style.right = documentWidth - lastRect.right - parentRect.right + 'px'
									}
								}
								//bottom-start
								else {
									this.$el.style.left = lastRect.left - parentRect.left + 'px'
									this.$el.style.right = 'auto'
								}
							} else if (this.placement == 'top-end') {
								if (firstRect.left + firstRect.width < this.$el.offsetWidth) {
									//top
									if (firstRect.left + firstRect.width / 2 >= this.$el.offsetWidth / 2) {
										this.$el.style.left = firstRect.left - parentRect.left + firstRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
										this.$el.style.right = 'auto'
									}
									//top-start
									else {
										this.$el.style.left = firstRect.left - parentRect.left + 'px'
										this.$el.style.right = 'auto'
									}
								}
								//top-end
								else {
									this.$el.style.left = 'auto'
									this.$el.style.right = documentWidth - firstRect.right - parentRect.right + 'px'
								}
							} else if (this.placement == 'bottom-end') {
								if (lastRect.left + lastRect.width < this.$el.offsetWidth) {
									//bottom
									if (lastRect.left + lastRect.width / 2 >= this.$el.offsetWidth / 2) {
										this.$el.style.left = lastRect.left - parentRect.left + lastRect.width / 2 - this.$el.offsetWidth / 2 + 'px'
										this.$el.style.right = 'auto'
									}
									//bottom-start
									else {
										this.$el.style.left = lastRect.left - parentRect.left + 'px'
										this.$el.style.right = 'auto'
									}
								}
								//bottom-end
								else {
									this.$el.style.left = 'auto'
									this.$el.style.right = documentWidth - lastRect.right - parentRect.right + 'px'
								}
							}
						}
						//三角形位置
						if (this.showTriangle) {
							this.setTrianglePositionByRange()
						}
					})
				}
			}
		},
		//根据node设置位置
		setPositionByNode() {
			const node = this.getNode()
			if (!DapElement.isElement(node)) {
				return
			}
			//重置
			this.realPlacement = null
			//关联元素位置
			const nodeRect = DapElement.getElementBounding(node)
			//定位父元素位置
			const parentRect = DapElement.getElementBounding(this.$el.offsetParent)
			//设置真实的位置
			if (this.placement == 'top' || this.placement == 'top-start' || this.placement == 'top-end') {
				if (nodeRect.top >= 0 && nodeRect.top >= parentRect.top && nodeRect.top >= this.$el.offsetHeight) {
					this.realPlacement = this.placement
				} else if (nodeRect.bottom >= 0 && nodeRect.bottom >= parentRect.bottom && nodeRect.bottom >= this.$el.offsetHeight) {
					this.realPlacement = this.placement == 'top' ? 'bottom' : this.placement == 'top-start' ? 'bottom-start' : 'bottom-end'
				}
			} else if (this.placement == 'bottom' || this.placement == 'bottom-start' || this.placement == 'bottom-end') {
				if (nodeRect.bottom >= 0 && nodeRect.bottom >= parentRect.bottom && nodeRect.bottom >= this.$el.offsetHeight) {
					this.realPlacement = this.placement
				} else if (nodeRect.top >= 0 && nodeRect.top >= parentRect.top && nodeRect.top >= this.$el.offsetHeight) {
					this.realPlacement = this.placement == 'bottom' ? 'top' : this.placement == 'bottom-start' ? 'top-start' : 'top-end'
				}
			}
			//判断左右是否足够空间显示
			if (this.realPlacement == 'top') {
				if (nodeRect.right + node.offsetWidth / 2 < this.$el.offsetWidth / 2) {
					this.realPlacement = 'top-end'
				} else if (nodeRect.left + node.offsetWidth / 2 < this.$el.offsetWidth / 2) {
					this.realPlacement = 'top-start'
				}
			} else if (this.realPlacement == 'top-start') {
				if (nodeRect.right + node.offsetWidth < this.$el.offsetWidth) {
					if (nodeRect.right + node.offsetWidth / 2 >= this.$el.offsetWidth / 2) {
						this.realPlacement = 'top'
					} else {
						this.realPlacement = 'top-end'
					}
				}
			} else if (this.realPlacement == 'top-end') {
				if (nodeRect.left + node.offsetWidth < this.$el.offsetWidth) {
					if (nodeRect.left + node.offsetWidth / 2 >= this.$el.offsetWidth / 2) {
						this.realPlacement = 'top'
					} else {
						this.realPlacement = 'top-start'
					}
				}
			} else if (this.realPlacement == 'bottom') {
				if (nodeRect.right + node.offsetWidth / 2 < this.$el.offsetWidth / 2) {
					this.realPlacement = 'bottom-end'
				} else if (nodeRect.left + node.offsetWidth / 2 < this.$el.offsetWidth / 2) {
					this.realPlacement = 'bottom-start'
				}
			} else if (this.realPlacement == 'bottom-start') {
				if (nodeRect.right + node.offsetWidth < this.$el.offsetWidth) {
					if (nodeRect.right + node.offsetWidth / 2 >= this.$el.offsetWidth / 2) {
						this.realPlacement = 'bottom'
					} else {
						this.realPlacement = 'bottom-end'
					}
				}
			} else if (this.realPlacement == 'bottom-end') {
				if (nodeRect.left + node.offsetWidth < this.$el.offsetWidth) {
					if (nodeRect.left + node.offsetWidth / 2 >= this.$el.offsetWidth / 2) {
						this.realPlacement = 'bottom'
					} else {
						this.realPlacement = 'bottom-start'
					}
				}
			}

			this.$nextTick(() => {
				//设置位置对应的样式
				if (this.realPlacement == 'top') {
					this.$el.style.left = nodeRect.left - parentRect.left + node.offsetWidth / 2 - this.$el.offsetWidth / 2 + 'px'
					this.$el.style.right = 'auto'
					this.$el.style.top = nodeRect.top - parentRect.top - this.$el.offsetHeight + 'px'
					this.$el.style.bottom = 'auto'
				} else if (this.realPlacement == 'top-start') {
					this.$el.style.left = nodeRect.left - parentRect.left + 'px'
					this.$el.style.right = 'auto'
					this.$el.style.top = nodeRect.top - parentRect.top - this.$el.offsetHeight + 'px'
					this.$el.style.bottom = 'auto'
				} else if (this.realPlacement == 'top-end') {
					this.$el.style.left = 'auto'
					this.$el.style.right = nodeRect.right - parentRect.right + 'px'
					this.$el.style.top = nodeRect.top - parentRect.top - this.$el.offsetHeight + 'px'
					this.$el.style.bottom = 'auto'
				} else if (this.realPlacement == 'bottom') {
					this.$el.style.left = nodeRect.left - parentRect.left + node.offsetWidth / 2 - this.$el.offsetWidth / 2 + 'px'
					this.$el.style.right = 'auto'
					this.$el.style.top = 'auto'
					this.$el.style.bottom = nodeRect.bottom - parentRect.bottom - this.$el.offsetHeight + 'px'
				} else if (this.realPlacement == 'bottom-start') {
					this.$el.style.left = nodeRect.left - parentRect.left + 'px'
					this.$el.style.right = 'auto'
					this.$el.style.top = 'auto'
					this.$el.style.bottom = nodeRect.bottom - parentRect.bottom - this.$el.offsetHeight + 'px'
				} else if (this.realPlacement == 'bottom-end') {
					this.$el.style.left = 'auto'
					this.$el.style.right = nodeRect.right - parentRect.right + 'px'
					this.$el.style.top = 'auto'
					this.$el.style.bottom = nodeRect.bottom - parentRect.bottom - this.$el.offsetHeight + 'px'
				} else {
					this.$el.style.top = 'auto'
					this.$el.style.bottom = (parentRect.bottom < 0 ? -parentRect.bottom : 0) + 'px'
					if (this.placement == 'top' || this.placement == 'bottom') {
						if (nodeRect.right + node.offsetWidth / 2 < this.$el.offsetWidth / 2) {
							this.$el.style.left = 'auto'
							this.$el.style.right = nodeRect.right - parentRect.right + 'px'
						} else if (nodeRect.left + node.offsetWidth / 2 < this.$el.offsetWidth / 2) {
							this.$el.style.left = nodeRect.left - parentRect.left + 'px'
							this.$el.style.right = 'auto'
						} else {
							this.$el.style.left = nodeRect.left - parentRect.left + node.offsetWidth / 2 - this.$el.offsetWidth / 2 + 'px'
							this.$el.style.right = 'auto'
						}
					} else if (this.placement == 'top-start' || this.placement == 'bottom-start') {
						if (nodeRect.right + node.offsetWidth < this.$el.offsetWidth) {
							if (nodeRect.right + node.offsetWidth / 2 >= this.$el.offsetWidth / 2) {
								this.$el.style.left = nodeRect.left - parentRect.left + node.offsetWidth / 2 - this.$el.offsetWidth / 2 + 'px'
								this.$el.style.right = 'auto'
							} else {
								this.$el.style.left = 'auto'
								this.$el.style.right = nodeRect.right - parentRect.right + 'px'
							}
						} else {
							this.$el.style.left = nodeRect.left - parentRect.left + 'px'
							this.$el.style.right = 'auto'
						}
					} else if (this.placement == 'top-end' || this.placement == 'bottom-end') {
						if (nodeRect.left + node.offsetWidth < this.$el.offsetWidth) {
							if (nodeRect.left + node.offsetWidth / 2 >= this.$el.offsetWidth / 2) {
								this.$el.style.left = nodeRect.left - parentRect.left + node.offsetWidth / 2 - this.$el.offsetWidth / 2 + 'px'
								this.$el.style.right = 'auto'
							} else {
								this.$el.style.left = nodeRect.left - parentRect.left + 'px'
								this.$el.style.right = 'auto'
							}
						} else {
							this.$el.style.left = 'auto'
							this.$el.style.right = nodeRect.right - parentRect.right + 'px'
						}
					}
				}
				//三角形位置
				if (this.showTriangle) {
					this.setTrianglePositionByNode()
				}
			})
		},
		//设置位置
		setPosition() {
			//如果根据range来定位
			if (this.useRange) {
				this.setPositionByRange()
			}
			//根据传入的node来定位
			else {
				this.setPositionByNode()
			}
		},
		//获取目标元素
		getNode() {
			if (!this.node) {
				return null
			}
			if (DapElement.isElement(this.node)) {
				return this.node
			}
			return document.body.querySelector(this.node)
		}
	},
	beforeUnmount() {
		DapEvent.off(window, `click.editify_layer_${this.uid} resize.editify_layer_${this.uid}`)
	}
}
</script>
<style lang="less" scoped>
.editify-layer-fade-enter-from,
.editify-layer-fade-leave-to {
	opacity: 0;
}
.editify-layer-fade-enter-active,
.editify-layer-fade-leave-active {
	transition: opacity 200ms linear;
}

.editify-layer-translate-enter-from,
.editify-layer-translate-leave-to {
	opacity: 0;
	transform: translateY(20px);
}

.editify-layer-translate-enter-active,
.editify-layer-translate-leave-active {
	transition: opacity 200ms ease-in-out, transform 200ms ease-in-out;
}

.editify-layer {
	display: block;
	position: absolute;
	padding: 0 0 10px 0;
	font-size: @font-size;
	color: @font-color;

	&[data-editify-placement='bottom'],
	&[data-editify-placement='bottom-start'],
	&[data-editify-placement='bottom-end'] {
		padding: 10px 0 0 0;
	}

	:deep(.editify-triangle) {
		position: absolute;
		z-index: 1;
	}

	.editify-layer-wrap {
		display: block;
		background-color: @background;
		box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
		border-radius: 4px;

		&.border {
			border: 1px solid @border-color;
		}
	}
}
</style>
