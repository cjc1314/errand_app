<template>
	<view style="padding: 20rpx;">
		<view style="margin-bottom: 10rpx;">
			<uni-segmented-control :current="currentIndex" :values="items" @clickItem="onClickItem" styleType="text"
				activeColor="#006eff"></uni-segmented-control>
		</view>

		<view v-if="!orderList.length" class="empty-box">暂无订单</view>

		<view>
			<view v-for="item in orderList" :key="item.id" class="box" style="margin-bottom: 10rpx;" @click="goDetail(item.id)">
				<view style="display: flex; align-items: center; margin-bottom: 20rpx;">
					<view style="flex: 1;">
						<uni-tag text="餐品" size="small" type="success" v-if="item.type === '代取餐品'"></uni-tag>
						<uni-tag text="快递" size="small" type="primary" v-if="item.type === '代拿快递'"></uni-tag>
						<uni-tag text="零食" size="small" type="warning" v-if="item.type === '代买零食'"></uni-tag>
						<uni-tag text="鲜花" size="small" type="error" v-if="item.type === '代送鲜花'"></uni-tag>
						<text style="margin-left: 10rpx;">{{ item.name }}</text>
						<text v-if="item.acceptId === user.id && item.userId !== user.id" class="rider-mark">我接的</text>
					</view>
					<view style="flex: 1; text-align: right;">
						<text style="color: #888;">所需金豆</text>
						<text style="color: red; font-size: 34rpx;">{{ item.price }}</text>
					</view>
				</view>

				<view style="display: flex; align-items: center;">
					<view style="flex: 1;">
						<text style="margin-right: 20rpx;" v-if="['待接单', '待送达', '待收货'].includes(item.status)">已下单{{ item.range }}分钟</text>
						<text :style="{ color: statusColor(item.status) }">{{ item.status }}</text>
					</view>
					<view style="flex: 1; text-align: right;">
						<view style="display: inline-block;" v-if="item.status === '已取消' || item.status === '已完成'">
							<uni-icons type="trash" size="18" color="#888" style="position: relative; top: 4rpx;"></uni-icons>
							<text style="color: #888;" @click.native.stop="handleDel(item.id)">删除</text>
						</view>
						<uni-tag text="确认送达" type="primary" size="small" v-if="item.acceptId === user.id && item.status === '待送达'" @click.native.stop="changeStatus(item, '待收货')"></uni-tag>
						<uni-tag text="确认收货" type="primary" size="small" v-if="item.userId === user.id && item.status === '待收货'" @click.native.stop="changeStatus(item, '待评价')"></uni-tag>
						<uni-tag text="取消订单" type="default" size="small" v-if="item.userId === user.id && item.status === '待接单'" @click.native.stop="changeStatus(item, '已取消')"></uni-tag>
						<uni-tag text="评价" type="success" size="small" v-if="item.userId === user.id && item.status === '待评价'" @click.native.stop="goComment(item.id)"></uni-tag>
					</view>
				</view>
			</view>
		</view>

		<uni-popup ref="alertDialog" type="dialog">
			<uni-popup-dialog :type="msgType" cancelText="取消" confirmText="确认" title="删除确认" content="确认删除订单吗？"
				@confirm="del"></uni-popup-dialog>
		</uni-popup>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				items: ['全部订单', '待接单', '待送达', '待收货', '待评价'],
				orderList: [],
				current: '全部订单',
				currentIndex: 0,
				user: uni.getStorageSync('xm-user') || {},
				orderId: 0,
				msgType: 'info'
			}
		},
		onShow() {
			this.user = uni.getStorageSync('xm-user') || {}
			this.load()
		},
		methods: {
			statusColor(status) {
				const colors = {
					'已取消': '#888',
					'待接单': 'orange',
					'待送达': 'dodgerblue',
					'待收货': 'mediumpurple',
					'待评价': 'indianred',
					'已完成': '#18bc37'
				}
				return colors[status] || '#666'
			},
			goComment(orderId) {
				uni.navigateTo({
					url: '/pages/comment/comment?orderId=' + orderId
				})
			},
			changeStatus(orders, status) {
				orders.status = status
				this.$request.put('/orders/update', orders).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.load()
					} else {
						uni.showToast({ icon: 'none', title: res.msg })
					}
				})
			},
			del() {
				this.$request.del('/orders/delete/' + this.orderId).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.load()
					} else {
						uni.showToast({ icon: 'none', title: res.msg })
					}
				})
			},
			handleDel(orderId) {
				this.orderId = orderId
				this.$refs.alertDialog.open()
			},
			goDetail(orderId) {
				uni.navigateTo({
					url: '/pages/detail/detail?orderId=' + orderId
				})
			},
			onClickItem(e) {
				this.currentIndex = e.currentIndex
				this.current = this.items[e.currentIndex]
				this.load()
			},
			buildParams(field) {
				const params = {}
				params[field] = this.user.id
				if (this.current !== '全部订单') {
					params.status = this.current
				}
				return params
			},
			mergeOrders(created, accepted) {
				const map = {}
				created.concat(accepted).forEach(item => {
					map[item.id] = item
				})
				return Object.keys(map)
					.map(key => map[key])
					.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
			},
			load() {
				if (!this.user.id) return
				const createdReq = this.$request.get('/orders/selectAll', this.buildParams('userId'))
				const acceptedReq = this.user.isRider
					? this.$request.get('/orders/selectAll', this.buildParams('acceptId'))
					: Promise.resolve({ data: [] })

				Promise.all([createdReq, acceptedReq]).then(([createdRes, acceptedRes]) => {
					this.orderList = this.mergeOrders(createdRes.data || [], acceptedRes.data || [])
				})
			}
		}
	}
</script>

<style>
	.empty-box {
		text-align: center;
		color: #999;
		padding: 120rpx 0;
	}
	.rider-mark {
		margin-left: 10rpx;
		font-size: 22rpx;
		color: #006eff;
		background: #eaf3ff;
		border-radius: 6rpx;
		padding: 4rpx 8rpx;
	}
</style>
