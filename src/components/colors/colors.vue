<template>
	<div class="editify-colors">
		<div class="editify-colors-header" @click="selectColor({ value: '' })">
			<Icon value="remove"></Icon>
			<span>{{ $editTrans('defaultColor') }}</span>
		</div>
		<div class="editify-colors-list">
			<div class="editify-color" :class="{ 'editify-active': value == item.value }" v-for="item in data" :style="{ borderColor: value == item.value ? color || '' : '' }">
				<Tooltip block :content="<string>item.label" :disabled="!tooltip">
					<div @click="selectColor(item)" class="editify-color-el" :style="{ background: item.value }"></div>
				</Tooltip>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { inject } from 'vue'
import Icon from '@/components/icon/icon.vue'
import Tooltip from '@/components/tooltip/tooltip.vue'
import { ButtonOptionsItemType } from '@/components/button/props'
import { ColorsProps } from './props'

defineOptions({
	name: 'Colors'
})
defineProps(ColorsProps)
const emits = defineEmits(['change'])

const $editTrans = inject<(key: string) => any>('$editTrans')!

//选择颜色
const selectColor = (item: ButtonOptionsItemType) => {
	emits('change', item.value)
}
</script>
<style scoped src="./colors.less"></style>
