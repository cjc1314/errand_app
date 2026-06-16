<template>
	<view style="padding: 20rpx;">
		<view class="bean-card">
			<view class="bean-label">我的金豆</view>
			<view class="bean-value">{{ account }}</view>
			<view class="bean-tip">仅用于课程作业演示，是测试数值</view>
		</view>

		<view style="margin-top: 20rpx;">
			<button type="primary" style="background-color: dodgerblue;" @click="handleCharge">领取金豆</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				account: 0,
				user: uni.getStorageSync('xm-user') || {}
			}
		},
		onShow() {
			this.user = uni.getStorageSync('xm-user') || {}
			this.load()
		},
		methods: {
			handleCharge() {
				uni.navigateTo({
					url: '/pages/charge/charge'
				})
			},
			load() {
				if (!this.user.id) return
				this.$request.get('/user/selectById/' + this.user.id).then(res => {
					this.account = res.data.account || 0
				})
			}
		}
	}
</script>

<style>
	.bean-card {
		background-color: dodgerblue;
		padding: 60rpx 30rpx;
		text-align: center;
		border-radius: 10rpx;
		color: white;
	}
	.bean-label {
		font-size: 30rpx;
		opacity: .9;
	}
	.bean-value {
		font-size: 64rpx;
		font-weight: bold;
		margin: 16rpx 0;
		color: #ffe58f;
	}
	.bean-tip {
		font-size: 24rpx;
		opacity: .9;
	}
</style>
