<template>
	<view style="padding: 20rpx;">
		<view class="box" style="padding: 40rpx 20rpx;">
			<uni-forms :modelValue="form" :rules="rules" ref="formRef" label-width="140rpx" label-align="right">
				<uni-forms-item label="头像" name="avatar">
					<view class="avatar-uploader" @click="chooseAvatar">
						<image :src="avatarSrc" class="avatar-img" mode="aspectFill"></image>
					</view>
				</uni-forms-item>
				<uni-forms-item label="账号" name="username">
					<uni-easyinput type="text" v-model="form.username" disabled />
				</uni-forms-item>
				<uni-forms-item label="密码" name="password" required>
					<uni-easyinput type="password" v-model="form.password" placeholder="请输入密码" />
				</uni-forms-item>
				<uni-forms-item label="姓名" name="name" required>
					<uni-easyinput type="text" v-model="form.name" placeholder="请输入姓名" />
				</uni-forms-item>
				<uni-forms-item label="性别" name="sex">
					<radio-group class="radio-row" @change="form.sex = $event.detail.value">
						<label class="radio-item">
							<radio value="男" :checked="form.sex === '男'" color="#006eff" />男
						</label>
						<label class="radio-item">
							<radio value="女" :checked="form.sex === '女'" color="#006eff" />女
						</label>
					</radio-group>
				</uni-forms-item>
				<uni-forms-item label="电话" name="phone">
					<uni-easyinput type="text" v-model="form.phone" placeholder="请输入电话" />
				</uni-forms-item>
				<view>
					<button type="primary" @click="save" class="my-button-primary">保存</button>
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
					password: {
						rules: [{
							required: true,
							errorMessage: '请填写密码'
						}]
					},
					name: {
						rules: [{
							required: true,
							errorMessage: '请填写姓名'
						}]
					}
				}
			}
		},
		computed: {
			avatarSrc() {
				const avatar = this.form.avatar
				if (!avatar || /^https?:\/\//.test(avatar)) {
					return '/static/logo.png'
				}
				return avatar
			}
		},
		onShow() {
			this.form = uni.getStorageSync('xm-user') || {}
		},
		methods: {
			save() {
				this.$request.put('/user/update', this.form).then(res => {
					if (res.code === '200') {
						uni.showToast({
							icon: 'success',
							title: '操作成功'
						})
						uni.setStorageSync('xm-user', this.form)
					} else {
						uni.showToast({
							icon: 'none',
							title: res.msg
						})
					}
				})
			},
			chooseAvatar() {
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: res => {
						const filePath = res.tempFilePaths[0]
						uploadCloudFile(filePath, 'avatars').then(url => {
							this.form.avatar = url
						})
					}
				})
			}
		}
	}
</script>

<style>
	.avatar-uploader {
		width: 120rpx;
		height: 120rpx;
		border-radius: 60rpx;
		border: 1px solid #eee;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: #fafafa;
	}
	.avatar-img {
		width: 120rpx;
		height: 120rpx;
	}
	.radio-row {
		display: flex;
		align-items: center;
		gap: 40rpx;
		min-height: 72rpx;
	}
	.radio-item {
		display: inline-flex;
		align-items: center;
		color: #333;
	}
</style>
