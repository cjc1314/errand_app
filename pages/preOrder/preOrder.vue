<template>
	<view style="padding: 20rpx;">
		<view class="box address-box" @click="selectAddress('取货')">
			<view class="section-title">取货地址</view>
			<view v-if="pickAddress.id">
				<view style="font-weight: bold; font-size: 32rpx; margin-bottom: 10rpx;">{{ pickAddress.address + pickAddress.doorNo }}</view>
				<view style="color: #888; margin-bottom: 10rpx;">
					<text style="margin-right: 20rpx;">{{ pickAddress.userName }}</text>
					<text>{{ pickAddress.phone }}</text>
				</view>
			</view>
			<view style="color: #888;" v-else>请选择取货地址</view>
		</view>

		<view class="box address-box" @click="selectAddress('收货')">
			<view class="section-title">收货地址</view>
			<view v-if="recieveAddress.id">
				<view style="font-weight: bold; font-size: 32rpx; margin-bottom: 10rpx;">{{ recieveAddress.address + recieveAddress.doorNo }}</view>
				<view style="color: #888; margin-bottom: 10rpx;">
					<text style="margin-right: 20rpx;">{{ recieveAddress.userName }}</text>
					<text>{{ recieveAddress.phone }}</text>
				</view>
			</view>
			<view style="color: #888;" v-else>请选择收货地址</view>
		</view>

		<view class="box">
			<uni-forms :modelValue="form" :rules="rules" ref="formRef" label-width="160rpx" label-align="right" validateTrigger="blur">
				<uni-forms-item label="物品名称" name="name" required>
					<uni-easyinput type="text" v-model="form.name" placeholder="请输入物品名称" />
				</uni-forms-item>
				<uni-forms-item label="描述信息" name="descr">
					<uni-easyinput type="text" v-model="form.descr" placeholder="请输入描述信息" />
				</uni-forms-item>
				<uni-forms-item label="重量(kg)" name="weight">
					<uni-easyinput type="text" v-model="form.weight" placeholder="请输入物品重量" />
				</uni-forms-item>
				<uni-forms-item label="所需金豆" name="price" required>
					<input class="number-input" type="number" v-model="form.price" placeholder="请输入金豆数" />
				</uni-forms-item>
				<uni-forms-item label="订单类型" name="type" required>
					<uni-data-select v-model="form.type" :localdata="orderTypes"></uni-data-select>
				</uni-forms-item>
				<uni-forms-item label="物品图片" name="img">
					<view class="upload-box" @click="chooseOrderImage">
						<image v-if="form.img" :src="form.img" class="upload-img" mode="aspectFill"></image>
						<text v-else class="upload-plus">+</text>
					</view>
				</uni-forms-item>
				<uni-forms-item label="备注" name="comment">
					<uni-easyinput type="text" v-model="form.comment" placeholder="请输入备注信息" />
				</uni-forms-item>
			</uni-forms>
			<view>
				<button type="primary" @click="addOrder" class="my-button-primary">提交订单</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { uploadCloudFile } from '@/utils/cloudFile.js'

	export default {
		data() {
			return {
				form: { price: 1, type: '' },
				rules: {
					name: {
						rules: [{
							required: true,
							errorMessage: '请填写物品名称'
						}]
					},
					price: {
						rules: [{
							required: true,
							errorMessage: '请设置金豆数'
						}]
					},
					type: {
						rules: [{
							required: true,
							errorMessage: '请设置订单类型'
						}]
					}
				},
				orderTypes: [
					{ value: '代拿快递', text: '代拿快递' },
					{ value: '代取餐品', text: '代取餐品' },
					{ value: '代买零食', text: '代买零食' },
					{ value: '代送鲜花', text: '代送鲜花' }
				],
				pickAddress: {},
				recieveAddress: {}
			}
		},
		onShow() {
			const orderStore = uni.getStorageSync('orderStore') || {}
			this.form.type = orderStore.type || this.form.type
			this.pickAddress = orderStore.pickAddress || {}
			this.recieveAddress = orderStore.recieveAddress || {}
		},
		methods: {
			selectAddress(addressType) {
				uni.navigateTo({
					url: '/pages/address/address?addressType=' + addressType
				})
			},
			addOrder() {
				if (!this.pickAddress.id) {
					uni.showToast({ icon: 'none', title: '请设置取货地址' })
					return
				}
				if (!this.recieveAddress.id) {
					uni.showToast({ icon: 'none', title: '请设置收货地址' })
					return
				}
				if (this.pickAddress.id === this.recieveAddress.id) {
					uni.showToast({ icon: 'none', title: '取货地址不能跟收货地址一致' })
					return
				}
				this.form.addressId = this.pickAddress.id
				this.form.targetId = this.recieveAddress.id
				this.$refs.formRef.validate().then(() => {
					this.$request.post('/orders/addOrder', this.form).then(res => {
						if (res.code === '200') {
							uni.showToast({ icon: 'success', title: '下单成功' })
							uni.removeStorageSync('orderStore')
							setTimeout(() => {
								uni.switchTab({ url: '/pages/index/index' })
							}, 500)
						} else {
							uni.showToast({ icon: 'none', title: res.msg })
						}
					})
				})
			},
			chooseOrderImage() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: res => {
						const filePath = res.tempFilePaths[0]
						uploadCloudFile(filePath, 'orders').then(url => {
							this.form.img = url
						})
					}
				})
			}
		}
	}
</script>

<style>
	.address-box {
		margin-bottom: 10rpx;
	}
	.section-title {
		border-left: 8rpx solid #006eff;
		padding-left: 14rpx;
		margin-bottom: 16rpx;
		font-weight: bold;
		color: #333;
	}
	.upload-box {
		width: 120rpx;
		height: 120rpx;
		border: 1px solid #eee;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: #fafafa;
	}
	.number-input {
		height: 72rpx;
		border: 1px solid #e5e5e5;
		border-radius: 8rpx;
		padding: 0 20rpx;
		box-sizing: border-box;
	}
	.upload-img {
		width: 120rpx;
		height: 120rpx;
	}
	.upload-plus {
		color: #ccc;
		font-size: 70rpx;
	}
</style>
