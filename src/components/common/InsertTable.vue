<template>
	<div class="editify-table">
		<table>
			<tr v-for="row in tableGrids">
				<td :class="{ inside: column.inside }" v-for="column in row" @mouseenter="changeTableSize(column)" @click="createTable(column)">
					<span></span>
				</td>
			</tr>
		</table>
		<div class="editify-table-footer">
			<span v-if="specification">{{ specification.x }} x {{ specification.y }}</span>
			<span v-else>{{ $editTrans('insertTable') }}</span>
		</div>
	</div>
</template>
<script>
export default {
	name: 'InsertTable',
	emits: ['insert'],
	inject: ['$editTrans'],
	props: {
		//主题色
		color: {
			type: String,
			default: ''
		},
		//最大行数
		maxRows: {
			type: Number,
			default: 10
		},
		//最大列数
		maxColumns: {
			type: Number,
			default: 10
		}
	},
	data() {
		return {
			tableGrids: this.getTableGrids()
		}
	},
	computed: {
		//表格规格
		specification() {
			return this.tableGrids
				.flat()
				.filter(item => {
					return item.inside
				})
				.sort((a, b) => {
					if (a.x > b.x && a.y > b.y) {
						return -1
					}
					if (a.x > b.x) {
						return -1
					}
					if (a.y > b.y) {
						return -1
					}
					return 1
				})[0]
		}
	},
	methods: {
		//确认创立表格
		createTable(data) {
			this.$emit('insert', data.x, data.y)
		},
		//改变表格大小
		changeTableSize(data) {
			for (let i in this.tableGrids) {
				const grid = this.tableGrids[i]
				for (let j in grid) {
					if (grid[j].x <= data.x && grid[j].y <= data.y) {
						this.tableGrids[i][j].inside = true
					} else {
						this.tableGrids[i][j].inside = false
					}
				}
			}
		},
		//获取表格
		getTableGrids() {
			const grids = []
			for (let i = 1; i <= this.maxRows; i++) {
				let row = []
				for (let j = 1; j <= this.maxColumns; j++) {
					row.push({
						x: i,
						y: j,
						inside: false //是否被选中
					})
				}
				grids.push(row)
			}
			return grids
		}
	}
}
</script>
<style lang="less" scoped>
.editify-table {
	display: block;
	position: relative;
	padding: 10px 10px 32px 10px;
	box-sizing: border-box;

	table {
		border: 1px solid @border-color;
		margin: 0;
		padding: 0;
		border-collapse: collapse;

		tr {
			margin: 0;
			padding: 0;

			td {
				margin: 0;
				padding: 0;
				border: 1px solid @border-color;

				span {
					display: block;
					width: 15px;
					height: 15px;
				}

				&:hover {
					cursor: pointer;
				}

				&.inside {
					background-color: @background-darker;
				}
			}
		}
	}

	.editify-table-footer {
		text-align: center;
		color: @font-color-light;
		line-height: 1;
		font-size: 12px;
		position: absolute;
		padding: 0 10px;
		bottom: 10px;
		left: 0;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		box-sizing: border-box;
	}
}
</style>
