<template>
	<view style="padding: 20rpx;">
		<view class="box">
			<uni-forms :modelValue="form" :rules="rules" ref="formRef" label-width="180rpx" label-align="right">
				<uni-forms-item label="姓名" name="name" required>
					<uni-easyinput type="text" v-model="form.name" placeholder="请输入姓名" />
				</uni-forms-item>
				<uni-forms-item label="本人照片" name="avatar" required>
					<view class="upload-box" @click="chooseImage('avatar')">
						<image v-if="form.avatar" :src="form.avatar" class="upload-img" mode="aspectFill"></image>
						<text v-else class="upload-plus">+</text>
					</view>
				</uni-forms-item>
				<uni-forms-item label="联系方式" name="phone" required>
					<uni-easyinput type="text" v-model="form.phone" placeholder="请输入联系方式" />
				</uni-forms-item>
				<uni-forms-item label="身份证号" name="cardNo" required>
					<uni-easyinput type="text" v-model="form.cardNo" placeholder="请输入身份证号码" />
				</uni-forms-item>
				<uni-forms-item label="身份证正面" name="card1" required>
					<view class="upload-box" @click="chooseImage('card1')">
						<image v-if="form.card1" :src="form.card1" class="upload-img" mode="aspectFill"></image>
						<text v-else class="upload-plus">+</text>
					</view>
				</uni-forms-item>
				<uni-forms-item label="身份证反面" name="card2" required>
					<view class="upload-box" @click="chooseImage('card2')">
						<image v-if="form.card2" :src="form.card2" class="upload-img" mode="aspectFill"></image>
						<text v-else class="upload-plus">+</text>
					</view>
				</uni-forms-item>
				<uni-forms-item label="常住地址" name="address" required>
					<uni-easyinput type="text" v-model="form.address" placeholder="请输入常住地址" />
				</uni-forms-item>
				<uni-forms-item label="审核状态" name="status">
					<view style="padding-top: 15rpx;">
						<uni-tag type="default" v-if="!form.status" text="待申请"></uni-tag>
						<uni-tag type="warning" v-if="form.status === '待审核'" text="待审核"></uni-tag>
						<uni-tag type="success" v-if="form.status === '通过'" text="通过"></uni-tag>
						<uni-tag type="error" v-if="form.status === '拒绝'" text="拒绝"></uni-tag>
					</view>
				</uni-forms-item>
				<uni-forms-item label="审核理由" name="reason" v-if="form.reason">
					<view style="padding-top: 15rpx;">{{ form.reason }}</view>
				</uni-forms-item>
				<view class="hint" v-if="form.status === '待审核'">已提交申请，请等待管理员审核。审核通过后重新登录即可接单。</view>
				<view class="hint success" v-if="form.status === '通过'">管理员已通过审核，重新登录后可接单。</view>
				<view style="margin-bottom: 20rpx;">
					<button :disabled="form.status === '待审核' || form.status === '通过'" class="my-button-primary" type="primary" @click="submitRequest">
						{{ form.status === '拒绝' ? '重新提交申请' : '提交申请' }}
					</button>
				</view>
				<view v-if="form.id && form.status === '拒绝'">
					<button class="my-button-danger" type="primary" @click="deleteRequest">删除申请</button>
				</view>
			</uni-forms>
		</view>
	</view>
</template>

<script>
	import { uploadCloudFile } from '@/utils/cloudFile.js'

	export default {
		data() {
			return {
				form: {},
				rules: {
					name: { rules: [{ required: true, errorMessage: '请填写姓名' }] },
					phone: { rules: [{ required: true, errorMessage: '请填写手机号' }] },
					cardNo: { rules: [{ required: true, errorMessage: '请填写身份证号码' }] },
					address: { rules: [{ required: true, errorMessage: '请填写常住地址' }] }
				},
				user: uni.getStorageSync('xm-user') || {}
			}
		},
		onLoad() {
			this.load()
		},
		methods: {
			load() {
				this.$request.get('/certification/selectUserCertification').then(res => {
					this.form = res.data || {}
				})
			},
			submitRequest() {
				this.$refs.formRef.validate().then(() => {
					const data = {
						...this.form,
						userId: this.user.id,
						status: '待审核',
						reason: ''
					}
					this.$request.post('/certification/add', data).then(res => {
						if (res.code === '200') {
							uni.showToast({ icon: 'success', title: '提交成功' })
							this.load()
						} else {
							uni.showToast({ icon: 'none', title: res.msg })
						}
					})
				})
			},
			deleteRequest() {
				this.$request.del('/certification/delete/' + this.form.id).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '删除成功' })
						this.form = {}
					} else {
						uni.showToast({ icon: 'none', title: res.msg })
					}
				})
			},
			chooseImage(field) {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: res => {
						uploadCloudFile(res.tempFilePaths[0], 'certification').then(url => {
							this.$set(this.form, field, url)
						})
					}
				})
			}
		}
	}
</script>

<style>
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
	.upload-img {
		width: 120rpx;
		height: 120rpx;
	}
	.upload-plus {
		color: #ccc;
		font-size: 70rpx;
	}
	.hint {
		color: #999;
		font-size: 26rpx;
		line-height: 1.5;
		margin-bottom: 20rpx;
	}
	.hint.success {
		color: #18bc37;
	}
</style>
