<template>
	<view style="padding: 20rpx;">
		<view style="text-align: center;">
			<image :src="avatarSrc" style="width: 200rpx; height: 200rpx; border-radius: 50%;"></image>
			<view style="margin: 10rpx 0;">{{ user.name }}</view>
			<view v-if="user.isRider">
				<uni-icons color="#006eff" type="vip-filled" size="18" style="position: relative; top: 2rpx;"></uni-icons>
				<text style="color: #006eff; font-weight: bold;">认证骑手</text>
			</view>
		</view>

		<view style="margin: 20rpx 0;" class="box">
			<view class="title">用户服务</view>
			<view style="display: flex;">
				<view class="cartegory-item" @click="goPage('/pages/address/address')">
					<image src="../../static/imgs/地址.png" style="width: 50%;" mode="widthFix"></image>
					<view style="flex: 1;">我的地址</view>
				</view>
				<view class="cartegory-item" @click="goPage('/pages/records/records')">
					<image :src="recordsIcon" style="width: 50%;" mode="widthFix"></image>
					<view style="flex: 1;">金豆明细</view>
				</view>
				<view class="cartegory-item" @click="goPage('/pages/myComment/myComment')">
					<image src="../../static/imgs/评价.png" style="width: 50%;" mode="widthFix"></image>
					<view style="flex: 1;">评价中心</view>
				</view>
				<view class="cartegory-item" @click="goPage('/pages/wallet/wallet')">
					<image :src="beansIcon" style="width: 50%;" mode="widthFix"></image>
					<view style="flex: 1;">我的金豆</view>
				</view>
			</view>
		</view>

		<view style="margin: 20rpx 0;" class="box">
			<view class="title">骑手服务</view>
			<view style="display: flex;">
				<view class="cartegory-item" @click="goPage('/pages/certification/certification')">
					<image src="../../static/imgs/认证.png" style="width: 30%;" mode="widthFix"></image>
					<view style="flex: 1;">骑手认证</view>
				</view>
				<view class="cartegory-item" @click="goPage('/pages/acceptOrders/acceptOrders')">
					<image src="../../static/imgs/跑腿.png" style="width: 30%;" mode="widthFix"></image>
					<view style="flex: 1;">骑手订单</view>
				</view>
			</view>
		</view>

		<view style="margin: 20rpx 0;" class="box" v-if="user.role === 'ADMIN'">
			<view class="title">管理员服务</view>
			<view class="info-item" @click="goPage('/pages/admin/admin')">
				<uni-icons type="gear" size="18"></uni-icons>
				<text style="margin-left: 10rpx;">小程序管理后台</text>
			</view>
		</view>

		<view style="margin: 20rpx 0;" class="box">
			<view class="info-item" @click="goPage('/pages/person/person')">
				<uni-icons type="person" size="18"></uni-icons>
				<text style="margin-left: 10rpx;">个人信息</text>
			</view>
			<view class="info-item" @click="goPage('/pages/introduce/introduce')">
				<uni-icons type="medal" size="18"></uni-icons>
				<text style="margin-left: 10rpx;">平台介绍</text>
			</view>
			<view class="info-item" @click="goPage('/pages/agreement/agreement')">
				<uni-icons type="paperclip" size="18"></uni-icons>
				<text style="margin-left: 10rpx;">用户协议</text>
			</view>
			<view class="info-item" @click="logout">
				<uni-icons type="undo" size="18"></uni-icons>
				<text style="margin-left: 10rpx;">退出登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				user: uni.getStorageSync('xm-user') || {},
				recordsIcon: require('../../static/imgs/\u6536\u652f.png'),
				beansIcon: require('../../static/imgs/\u94b1\u5305.png')
			}
		},
		onShow() {
			this.user = uni.getStorageSync('xm-user') || {}
			this.refreshUser()
		},
		computed: {
			avatarSrc() {
				const avatar = this.user && this.user.avatar
				if (!avatar || /^https?:\/\//.test(avatar)) {
					return '/static/logo.png'
				}
				return avatar
			}
		},
		methods: {
			refreshUser() {
				if (!this.user.id) return
				this.$request.get('/user/selectById/' + this.user.id).then(res => {
					if (res.code === '200' && res.data) {
						this.user = res.data
						uni.setStorageSync('xm-user', res.data)
					}
				})
			},
			logout() {
				uni.removeStorageSync('xm-user')
				uni.removeStorageSync('orderStore')
				uni.navigateTo({
					url: '/pages/login/login'
				})
			},
			goPage(url) {
				uni.navigateTo({
					url
				})
			}
		}
	}
</script>

<style>
	.title {
		font-weight: bold;
		font-size: 36rpx;
		margin-bottom: 30rpx;
	}
	.cartegory-item {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-direction: column;
		grid-gap: 10rpx;
	}
	.info-item {
		padding: 15rpx;
		border-bottom: 2rpx solid #eee;
	}
	.info-item .uni-icons {
		position: relative;
		top: 2rpx;
	}
</style>
