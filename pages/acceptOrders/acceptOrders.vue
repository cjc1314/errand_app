<template>
	<view style="padding: 20rpx;">
		<view>
			<view v-for="item in orderList" :key="item.id" class="box" style="margin-bottom: 10rpx;" @click="goDetail(item.id)">
				<view style="display: flex; align-items: center; margin-bottom: 20rpx;">
					<view style="flex: 1;">
						<uni-tag text="餐品" size="small" type="success" v-if="item.type === '代取餐品'"></uni-tag>
						<uni-tag text="快递" size="small" type="primary" v-if="item.type === '代拿快递'"></uni-tag>
						<uni-tag text="零食" size="small" type="warning" v-if="item.type === '代买零食'"></uni-tag>
						<uni-tag text="鲜花" size="small" type="error" v-if="item.type === '代送鲜花'"></uni-tag>
						<text style="margin-left: 10rpx;">{{ item.name }}</text>
					</view>
					<view style="flex: 1; text-align: right;">
						<text style="color: #888;">奖励金豆</text>
						<text style="color: red; font-size: 34rpx;">{{ item.price }}</text>
					</view>
				</view>

				<view style="display: flex; align-items: center;">
					<view style="flex: 1;">
						<text style="margin-right: 20rpx;" v-if="['待接单', '待送达', '待收货'].includes(item.status)">已下单{{ item.range }}分钟</text>
						<text style="color: dodgerblue">{{ item.status }}</text>
					</view>
					<view style="flex: 1; text-align: right;">
						<uni-tag v-if="item.status === '待送达'" text="确认送达" type="primary" size="small"
							@click.native.stop="arrive(item)"></uni-tag>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				orderList: [],
				user: uni.getStorageSync('xm-user') || {}
			}
		},
		onLoad() {
			this.load()
		},
		methods: {
			goDetail(orderId) {
				uni.navigateTo({
					url: '/pages/detail/detail?orderId=' + orderId
				})
			},
			load() {
				if (!this.user.id) return
				this.$request.get('/orders/selectAll', {
					acceptId: this.user.id
				}).then(res => {
					this.orderList = res.data || []
				})
			},
			arrive(orders) {
				orders.status = '待收货'
				this.$request.put('/orders/update', orders).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.load()
					} else {
						uni.showToast({ icon: 'none', title: res.msg })
					}
				})
			}
		}
	}
</script>

<style>
</style>
