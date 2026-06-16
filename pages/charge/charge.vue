<template>
	<view style="padding: 20rpx;">
		<view class="box">
			<view class="tip">课程演示用金豆，仅作测试数值，不具备现实用途。</view>
			<view class="charge-grid">
				<view v-for="item in items" :key="item" class="charge-item" :class="{ active: current === item }" @click="clickItem(item)">
					{{ item }} 金豆
				</view>
			</view>
			<view style="margin-top: 20rpx;">
				<button type="primary" style="background-color: #18bc37;" @click="charge">领取金豆</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				current: 10,
				items: [10, 30, 60, 100, 200, 500]
			}
		},
		methods: {
			clickItem(item) {
				this.current = item
			},
			charge() {
				this.$request.put('/user/beans/' + this.current).then(res => {
					if (res.code === '200') {
						uni.showToast({
							icon: 'success',
							title: '领取成功'
						})
						uni.navigateBack()
					} else {
						uni.showToast({
							icon: 'none',
							title: res.msg
						})
					}
				})
			}
		}
	}
</script>

<style>
	.tip {
		color: #777;
		font-size: 26rpx;
		line-height: 1.6;
		margin-bottom: 20rpx;
	}
	.charge-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10rpx;
	}
	.charge-item {
		width: calc((100% - 20rpx) / 3);
		box-sizing: border-box;
		border: 1px solid #ccc;
		padding: 40rpx 0;
		text-align: center;
		font-size: 32rpx;
		color: #666;
		border-radius: 5rpx;
	}
	.active {
		background-color: #18bc37;
		color: white;
		border-color: #18bc37;
	}
</style>
