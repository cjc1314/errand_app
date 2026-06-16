<template>
	<view class="admin-page">
		<view class="tabs">
			<view v-for="item in tabs" :key="item.key" class="tab" :class="{ active: current === item.key }" @click="switchTab(item.key)">
				{{ item.text }}
			</view>
		</view>

		<view v-if="current === 'dashboard'" class="panel">
			<view class="panel-title">数据概览</view>
			<view class="metrics">
				<view class="metric"><text>{{ users.length }}</text><label>用户</label></view>
				<view class="metric"><text>{{ orders.length }}</text><label>订单</label></view>
				<view class="metric"><text>{{ pendingCertCount }}</text><label>待审核</label></view>
				<view class="metric"><text>{{ banners.length }}</text><label>轮播图</label></view>
			</view>
			<view class="card">
				<view class="row strong">订单状态</view>
				<view class="row muted">{{ orderSummary }}</view>
			</view>
			<view class="card">
				<view class="row strong">待处理提醒</view>
				<view class="row muted">待接单 {{ countOrders('待接单') }} 个，待审核骑手 {{ pendingCertCount }} 个，未启用轮播 {{ disabledBannerCount }} 张</view>
			</view>
		</view>

		<view v-if="current === 'banner'" class="panel">
			<view class="panel-title">首页图片管理</view>
			<view class="upload-box" @click="chooseBannerImage">
				<image v-if="bannerForm.url" :src="bannerForm.url" mode="aspectFill"></image>
				<view v-else class="upload-placeholder">点击选择首页图片</view>
			</view>
			<uni-easyinput v-model="bannerForm.title" placeholder="图片标题，可不填" />
			<view class="gap"></view>
			<uni-easyinput v-model="bannerForm.sort" type="number" placeholder="排序，数字越小越靠前" />
			<view class="switch-row">
				<text>是否启用</text>
				<switch :checked="bannerForm.enabled !== false" @change="bannerForm.enabled = $event.detail.value" />
			</view>
			<button type="primary" class="action-btn" @click="saveBanner">{{ bannerForm.id ? '更新图片' : '新增图片' }}</button>
			<button v-if="bannerForm.id" class="plain-btn" @click="resetBannerForm">取消编辑</button>

			<view v-if="!banners.length" class="empty-box">暂无轮播图</view>
			<view v-for="item in banners" :key="item.id" class="card">
				<image class="banner-thumb" :src="item.url" mode="aspectFill"></image>
				<view class="row strong">{{ item.title || '首页图片' }}</view>
				<view class="row muted">排序：{{ item.sort || 0 }}　状态：{{ item.enabled === false ? '停用' : '启用' }}</view>
				<view class="ops">
					<button size="mini" @click="editBanner(item)">编辑</button>
					<button size="mini" @click="toggleBanner(item)">{{ item.enabled === false ? '启用' : '停用' }}</button>
					<button size="mini" type="warn" @click="deleteBanner(item.id)">删除</button>
				</view>
			</view>
		</view>

		<view v-if="current === 'notice'" class="panel">
			<view class="panel-title">公告管理</view>
			<uni-easyinput v-model="noticeKeyword" placeholder="搜索标题或内容" />
			<view class="gap"></view>
			<uni-easyinput v-model="noticeForm.title" placeholder="公告标题" />
			<view class="gap"></view>
			<uni-easyinput v-model="noticeForm.content" placeholder="公告内容" />
			<button type="primary" class="action-btn" @click="saveNotice">{{ noticeForm.id ? '更新公告' : '新增公告' }}</button>
			<button v-if="noticeForm.id" class="plain-btn" @click="noticeForm = {}">取消编辑</button>
			<view v-if="!filteredNotices.length" class="empty-box">暂无公告</view>
			<view v-for="item in filteredNotices" :key="item.id" class="card">
				<view class="row strong">{{ item.title }}</view>
				<view class="row muted">{{ item.content }}</view>
				<view class="row muted">{{ item.time }} {{ item.user || '' }}</view>
				<view class="ops">
					<button size="mini" @click="editNotice(item)">编辑</button>
					<button size="mini" type="warn" @click="deleteNotice(item.id)">删除</button>
				</view>
			</view>
		</view>

		<view v-if="current === 'orders'" class="panel">
			<view class="panel-title">订单管理</view>
			<view class="toolbar">
				<uni-easyinput v-model="orderKeyword" placeholder="搜索订单号/名称/用户ID/骑手ID" />
				<picker :range="orderStatusOptions" @change="orderStatus = orderStatusOptions[$event.detail.value]">
					<view class="picker-box">{{ orderStatus || '全部状态' }}</view>
				</picker>
			</view>
			<view v-if="!filteredOrders.length" class="empty-box">暂无订单</view>
			<view v-for="item in filteredOrders" :key="item.id" class="card">
				<view class="row strong">#{{ item.orderNo || item.id }} {{ item.name || '-' }}</view>
				<view class="row">类型：{{ item.type || '-' }}　金豆：{{ item.price || 0 }}</view>
				<view class="row">用户ID：{{ item.userId || '-' }}　骑手ID：{{ item.acceptId || '-' }}</view>
				<view class="row">状态：<text class="blue">{{ item.status }}</text></view>
				<view class="ops">
					<button size="mini" v-for="status in editableOrderStatuses" :key="status" @click="setOrderStatus(item, status)">{{ status }}</button>
					<button size="mini" type="warn" @click="deleteOrder(item.id)">删除</button>
				</view>
			</view>
		</view>

		<view v-if="current === 'certification'" class="panel">
			<view class="panel-title">骑手认证</view>
			<view class="toolbar">
				<uni-easyinput v-model="certKeyword" placeholder="搜索姓名/手机号/用户ID" />
				<picker :range="certStatusOptions" @change="certStatus = certStatusOptions[$event.detail.value]">
					<view class="picker-box">{{ certStatus || '全部状态' }}</view>
				</picker>
			</view>
			<view v-if="!filteredCertifications.length" class="empty-box">暂无认证申请</view>
			<view v-for="item in filteredCertifications" :key="item.id" class="card">
				<view class="row strong">{{ item.name || '-' }} <text class="tag">{{ item.status || '待审核' }}</text></view>
				<view class="row">用户ID：{{ item.userId }}　手机号：{{ item.phone || '-' }}</view>
				<view class="row">身份证：{{ item.cardNo || '-' }}</view>
				<view class="row muted" v-if="item.address">地址：{{ item.address }}</view>
				<view class="row muted" v-if="item.reason">原因：{{ item.reason }}</view>
				<view class="ops">
					<button size="mini" type="primary" @click="reviewCertification(item, '通过')">通过</button>
					<button size="mini" type="warn" @click="rejectCertification(item)">拒绝</button>
					<button size="mini" type="warn" @click="deleteCertification(item.id)">删除</button>
				</view>
			</view>
		</view>

		<view v-if="current === 'users'" class="panel">
			<view class="panel-head">
				<view>
					<view class="panel-title">用户管理</view>
					<view class="panel-subtitle">共 {{ filteredUsers.length }} 位用户，点击卡片可查看和编辑资料</view>
				</view>
			</view>
			<view class="search-box">
				<uni-easyinput v-model="userKeyword" prefixIcon="search" placeholder="搜索账号、姓名、电话、ID、角色" />
			</view>

			<view v-if="!filteredUsers.length" class="empty-box">暂无用户</view>
			<view v-for="item in filteredUsers" :key="item.id" class="user-list-card" :class="{ selected: selectedUser.id === item.id }" @click="selectUser(item)">
				<view class="user-line">
					<view class="avatar small">{{ userInitial(item) }}</view>
					<view class="user-main">
						<view class="user-name">{{ item.name || '-' }} <text>（{{ item.username }}）</text></view>
						<view class="user-meta">ID {{ item.id }} · {{ item.phone || '暂无电话' }}</view>
					</view>
					<view class="role-pill small-pill" :class="{ admin: item.role === 'ADMIN' }">{{ roleText(item.role) }}</view>
				</view>
				<view class="user-stats">
					<view><text>金豆</text>{{ item.account || 0 }}</view>
					<view><text>角色</text>{{ roleText(item.role) }}</view>
				</view>
				<view class="list-actions">
					<button class="list-detail-btn" size="mini" @click.stop="selectUser(item)">查看详情</button>
					<button class="list-delete-btn" size="mini" @click.stop="deleteUser(item)">删除用户</button>
				</view>

				<view v-if="selectedUser.id === item.id" class="user-detail-card inline-detail" @click.stop>
					<view class="detail-header">
						<view class="avatar">{{ userInitial(selectedUser) }}</view>
						<view class="detail-main">
							<view class="detail-name">{{ selectedUser.name || selectedUser.username }}</view>
							<view class="detail-meta">ID {{ selectedUser.id }} · {{ selectedUser.username }}</view>
						</view>
						<view class="role-pill" :class="{ admin: selectedUser.role === 'ADMIN' }">{{ roleText(selectedUser.role) }}</view>
					</view>

					<view class="info-grid">
						<view class="info-cell">
							<text>电话</text>
							<view>{{ selectedUser.phone || '-' }}</view>
						</view>
						<view class="info-cell">
							<text>金豆</text>
							<view>{{ selectedUser.account || 0 }}</view>
						</view>
					</view>

					<view class="form-block">
						<view class="field-label">姓名</view>
						<uni-easyinput v-model="selectedUser.name" placeholder="请输入姓名" />
						<view class="field-label">电话</view>
						<uni-easyinput v-model="selectedUser.phone" placeholder="请输入电话" />
						<view class="field-label">密码</view>
						<uni-easyinput v-model="selectedUser.password" placeholder="请输入密码" />
						<view class="field-label">金豆</view>
						<uni-easyinput v-model="selectedUser.account" type="number" placeholder="请输入金豆数量" />
					</view>

					<view class="role-switch">
						<view class="role-option" :class="{ active: selectedUser.role === 'USER' }" @click="selectedUser.role = 'USER'">普通用户</view>
						<view class="role-option" :class="{ active: selectedUser.role === 'ADMIN' }" @click="selectedUser.role = 'ADMIN'">管理员</view>
					</view>

					<view class="detail-actions">
						<button class="primary-action" size="mini" type="primary" @click="saveSelectedUser">保存资料</button>
						<button class="soft-action" size="mini" @click="selectedUser = {}">收起</button>
						<button class="danger-action" size="mini" type="warn" @click="deleteUser(selectedUser)">删除用户</button>
					</view>
				</view>
			</view>
		</view>

		<view v-if="current === 'comments'" class="panel">
			<view class="panel-title">评价管理</view>
			<uni-easyinput v-model="commentKeyword" placeholder="搜索评价内容/订单ID/用户ID" />
			<view v-if="!filteredComments.length" class="empty-box">暂无评价</view>
			<view v-for="item in filteredComments" :key="item.id" class="card">
				<view class="row strong">{{ item.content || '-' }}</view>
				<view class="row">评分：{{ item.star || 0 }}　订单ID：{{ item.orderId }}　用户ID：{{ item.userId }}</view>
				<view class="row muted">{{ item.time }}</view>
				<view class="ops">
					<button size="mini" type="warn" @click="deleteComment(item.id)">删除</button>
				</view>
			</view>
		</view>

		<view v-if="current === 'records'" class="panel">
			<view class="panel-title">金豆明细</view>
			<view class="toolbar">
				<uni-easyinput v-model="recordKeyword" placeholder="搜索内容/用户ID/类型" />
				<picker :range="recordTypeOptions" @change="recordType = recordTypeOptions[$event.detail.value]">
					<view class="picker-box">{{ recordType || '全部类型' }}</view>
				</picker>
			</view>
			<view v-if="!filteredRecords.length" class="empty-box">暂无明细</view>
			<view v-for="item in filteredRecords" :key="item.id" class="card">
				<view class="row strong">{{ item.content || '-' }}</view>
				<view class="row">类型：{{ item.type }}　金豆：{{ item.money || 0 }}</view>
				<view class="row muted">用户ID：{{ item.userId }}　{{ item.time }}</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { uploadCloudFile } from '@/utils/cloudFile.js'

	export default {
		data() {
			return {
				current: 'dashboard',
				adminUser: {},
				tabs: [
					{ key: 'dashboard', text: '概览' },
					{ key: 'banner', text: '轮播' },
					{ key: 'notice', text: '公告' },
					{ key: 'orders', text: '订单' },
					{ key: 'certification', text: '认证' },
					{ key: 'users', text: '用户' },
					{ key: 'comments', text: '评价' },
					{ key: 'records', text: '金豆' }
				],
				banners: [],
				notices: [],
				orders: [],
				certifications: [],
				users: [],
				comments: [],
				records: [],
				bannerForm: { sort: 1, enabled: true },
				noticeForm: {},
				selectedUser: {},
				noticeKeyword: '',
				userKeyword: '',
				orderKeyword: '',
				orderStatus: '',
				certKeyword: '',
				certStatus: '',
				commentKeyword: '',
				recordKeyword: '',
				recordType: '',
				editableOrderStatuses: ['待接单', '待送达', '待收货', '待评价', '已完成', '已取消'],
				orderStatusOptions: ['', '待接单', '待送达', '待收货', '待评价', '已完成', '已取消'],
				certStatusOptions: ['', '待审核', '通过', '拒绝'],
				recordTypeOptions: ['', '领取', '支出', '骑手', '取消']
			}
		},
		computed: {
			pendingCertCount() {
				return this.certifications.filter(item => (item.status || '待审核') === '待审核').length
			},
			disabledBannerCount() {
				return this.banners.filter(item => item.enabled === false).length
			},
			orderSummary() {
				if (!this.orders.length) return '暂无订单'
				const map = {}
				this.orders.forEach(item => {
					const key = item.status || '未知'
					map[key] = (map[key] || 0) + 1
				})
				return Object.keys(map).map(key => `${key} ${map[key]} 单`).join('，')
			},
			filteredNotices() {
				const keyword = this.noticeKeyword.trim().toLowerCase()
				return this.notices.filter(item => this.matchKeyword(item, keyword, ['title', 'content', 'user']))
			},
			filteredUsers() {
				const keyword = this.userKeyword.trim().toLowerCase()
				return this.users.filter(item => this.matchKeyword(item, keyword, ['id', 'username', 'name', 'phone', 'role']))
			},
			filteredOrders() {
				const keyword = this.orderKeyword.trim().toLowerCase()
				return this.orders.filter(item => {
					const okStatus = !this.orderStatus || item.status === this.orderStatus
					return okStatus && this.matchKeyword(item, keyword, ['id', 'orderNo', 'name', 'type', 'userId', 'acceptId'])
				})
			},
			filteredCertifications() {
				const keyword = this.certKeyword.trim().toLowerCase()
				return this.certifications.filter(item => {
					const okStatus = !this.certStatus || (item.status || '待审核') === this.certStatus
					return okStatus && this.matchKeyword(item, keyword, ['id', 'userId', 'name', 'phone', 'cardNo', 'status'])
				})
			},
			filteredComments() {
				const keyword = this.commentKeyword.trim().toLowerCase()
				return this.comments.filter(item => this.matchKeyword(item, keyword, ['id', 'content', 'userId', 'orderId', 'acceptId']))
			},
			filteredRecords() {
				const keyword = this.recordKeyword.trim().toLowerCase()
				return this.records.filter(item => {
					const okType = !this.recordType || item.type === this.recordType
					return okType && this.matchKeyword(item, keyword, ['id', 'content', 'userId', 'type'])
				})
			}
		},
		onShow() {
			this.adminUser = uni.getStorageSync('xm-user') || {}
			if (this.adminUser.role !== 'ADMIN') {
				uni.showToast({ icon: 'none', title: '仅管理员可访问' })
				setTimeout(() => uni.navigateBack(), 600)
				return
			}
			this.loadAll()
		},
		methods: {
			matchKeyword(item, keyword, fields) {
				if (!keyword) return true
				return fields.some(field => String(item[field] === undefined ? '' : item[field]).toLowerCase().includes(keyword))
			},
			roleText(role) {
				return role === 'ADMIN' ? '管理员' : '普通用户'
			},
			userInitial(user) {
				const text = user.name || user.username || '用'
				return String(text).slice(0, 1).toUpperCase()
			},
			countOrders(status) {
				return this.orders.filter(item => item.status === status).length
			},
			confirm(title, content) {
				return new Promise(resolve => {
					uni.showModal({ title, content, success: res => resolve(res.confirm) })
				})
			},
			switchTab(key) {
				this.current = key
				this.loadCurrent()
			},
			loadCurrent() {
				const loaders = {
					dashboard: this.loadAll,
					banner: this.loadBanners,
					notice: this.loadNotices,
					orders: this.loadOrders,
					certification: this.loadCertifications,
					users: this.loadUsers,
					comments: this.loadComments,
					records: this.loadRecords
				}
				loaders[this.current] && loaders[this.current]()
			},
			loadAll() {
				this.loadBanners()
				this.loadNotices()
				this.loadOrders()
				this.loadCertifications()
				this.loadUsers()
				this.loadComments()
				this.loadRecords()
			},
			loadBanners() {
				this.$request.get('/banner/selectAll').then(res => { this.banners = res.data || [] })
			},
			chooseBannerImage() {
				uni.chooseImage({
					count: 1,
					success: async res => {
						uni.showLoading({ title: '上传中' })
						try {
							const url = await uploadCloudFile(res.tempFilePaths[0], 'banners')
							this.bannerForm = { ...this.bannerForm, url }
						} catch (e) {
							uni.showToast({ icon: 'none', title: '上传失败' })
						} finally {
							uni.hideLoading()
						}
					}
				})
			},
			saveBanner() {
				if (!this.bannerForm.url) {
					uni.showToast({ icon: 'none', title: '请选择图片' })
					return
				}
				const data = { ...this.bannerForm, sort: Number(this.bannerForm.sort || 0), enabled: this.bannerForm.enabled !== false }
				const req = data.id ? this.$request.put('/banner/update', data) : this.$request.post('/banner/add', data)
				req.then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.resetBannerForm()
						this.loadBanners()
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '操作失败' })
					}
				})
			},
			editBanner(item) {
				this.bannerForm = { ...item }
			},
			toggleBanner(item) {
				this.$request.put('/banner/update', { ...item, enabled: item.enabled === false }).then(res => {
					if (res.code === '200') this.loadBanners()
				})
			},
			async deleteBanner(id) {
				if (!(await this.confirm('删除图片', '确认删除这张首页图片吗？'))) return
				this.$request.del('/banner/delete/' + id).then(res => {
					if (res.code === '200') this.loadBanners()
				})
			},
			resetBannerForm() {
				this.bannerForm = { sort: 1, enabled: true }
			},
			loadNotices() {
				this.$request.get('/notice/selectAll').then(res => { this.notices = res.data || [] })
			},
			saveNotice() {
				if (!this.noticeForm.title || !this.noticeForm.content) {
					uni.showToast({ icon: 'none', title: '请填写公告内容' })
					return
				}
				const req = this.noticeForm.id ? this.$request.put('/notice/update', this.noticeForm) : this.$request.post('/notice/add', this.noticeForm)
				req.then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.noticeForm = {}
						this.loadNotices()
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '操作失败' })
					}
				})
			},
			editNotice(item) {
				this.noticeForm = { ...item }
			},
			async deleteNotice(id) {
				if (!(await this.confirm('删除公告', '确认删除这条公告吗？'))) return
				this.$request.del('/notice/delete/' + id).then(res => {
					if (res.code === '200') this.loadNotices()
				})
			},
			loadOrders() {
				this.$request.get('/orders/selectAll').then(res => { this.orders = res.data || [] })
			},
			setOrderStatus(item, status) {
				this.$request.put('/orders/update', { ...item, status }).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.loadOrders()
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '操作失败' })
					}
				})
			},
			async deleteOrder(id) {
				if (!(await this.confirm('删除订单', '确认删除这条订单吗？'))) return
				this.$request.del('/orders/delete/' + id).then(res => {
					if (res.code === '200') this.loadOrders()
				})
			},
			loadCertifications() {
				this.$request.get('/certification/selectAll').then(res => { this.certifications = res.data || [] })
			},
			reviewCertification(item, status, reason = '') {
				this.$request.put('/certification/update', {
					...item,
					status,
					reason: reason || (status === '通过' ? '审核通过' : '资料不完整')
				}).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.loadCertifications()
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '操作失败' })
					}
				})
			},
			rejectCertification(item) {
				uni.showModal({
					title: '拒绝申请',
					editable: true,
					placeholderText: '请输入拒绝原因',
					success: res => {
						if (res.confirm) this.reviewCertification(item, '拒绝', res.content || '资料不完整')
					}
				})
			},
			async deleteCertification(id) {
				if (!(await this.confirm('删除认证', '确认删除这条认证记录吗？'))) return
				this.$request.del('/certification/delete/' + id).then(res => {
					if (res.code === '200') this.loadCertifications()
				})
			},
			loadUsers() {
				this.$request.get('/user/selectAll').then(res => { this.users = res.data || [] })
			},
			selectUser(item) {
				this.selectedUser = { ...item }
			},
			saveSelectedUser() {
				const data = { ...this.selectedUser, account: Number(this.selectedUser.account || 0) }
				this.$request.put('/user/update', data).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '保存成功' })
						this.selectedUser = {}
						this.loadUsers()
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '保存失败' })
					}
				})
			},
			setUserRole(item, role) {
				this.$request.put('/user/update', { ...item, role }).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '操作成功' })
						this.loadUsers()
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '操作失败' })
					}
				})
			},
			async deleteUser(item) {
				if (!item.id) return
				if (Number(item.id) === Number(this.adminUser.id)) {
					uni.showToast({ icon: 'none', title: '不能删除当前登录管理员' })
					return
				}
				if (!(await this.confirm('删除用户', `确认删除用户 ${item.username} 吗？相关地址、认证和金豆记录也会删除。`))) return
				this.$request.del('/user/delete/' + item.id).then(res => {
					if (res.code === '200') {
						uni.showToast({ icon: 'success', title: '删除成功' })
						if (this.selectedUser.id === item.id) this.selectedUser = {}
						this.loadUsers()
						this.loadCertifications()
						this.loadRecords()
					} else {
						uni.showToast({ icon: 'none', title: res.msg || '删除失败' })
					}
				})
			},
			loadComments() {
				this.$request.get('/comment/selectAll').then(res => { this.comments = res.data || [] })
			},
			async deleteComment(id) {
				if (!(await this.confirm('删除评价', '确认删除这条评价吗？'))) return
				this.$request.del('/comment/delete/' + id).then(res => {
					if (res.code === '200') this.loadComments()
				})
			},
			loadRecords() {
				this.$request.get('/records/selectAll').then(res => { this.records = res.data || [] })
			}
		}
	}
</script>

<style>
	.admin-page {
		padding: 20rpx;
	}
	.tabs {
		display: flex;
		flex-wrap: wrap;
		background: #fff;
		border-radius: 8rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
	}
	.tab {
		width: 25%;
		box-sizing: border-box;
		text-align: center;
		padding: 22rpx 0;
		color: #666;
	}
	.tab.active {
		background: #006eff;
		color: #fff;
	}
	.panel {
		background: #fff;
		border-radius: 8rpx;
		padding: 20rpx;
	}
	.panel-title {
		font-size: 34rpx;
		font-weight: bold;
		margin-bottom: 20rpx;
	}
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 18rpx;
	}
	.panel-head .panel-title {
		margin-bottom: 6rpx;
	}
	.panel-subtitle {
		color: #8a8f99;
		font-size: 24rpx;
		line-height: 1.4;
	}
	.search-box {
		margin-bottom: 18rpx;
	}
	.metrics {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
		margin-bottom: 20rpx;
	}
	.metric {
		width: calc((100% - 12rpx) / 2);
		box-sizing: border-box;
		background: #f6f8fb;
		border-radius: 8rpx;
		padding: 24rpx;
	}
	.metric text {
		display: block;
		font-size: 44rpx;
		font-weight: bold;
		color: #006eff;
	}
	.metric label {
		color: #666;
	}
	.toolbar {
		display: flex;
		gap: 12rpx;
		align-items: center;
		margin-bottom: 16rpx;
	}
	.toolbar .uni-easyinput {
		flex: 1;
	}
	.picker-box {
		min-width: 150rpx;
		border: 1px solid #ddd;
		border-radius: 8rpx;
		padding: 18rpx 14rpx;
		color: #555;
		text-align: center;
		background: #fafafa;
	}
	.upload-box {
		height: 300rpx;
		border-radius: 8rpx;
		background: #f4f7fb;
		margin-bottom: 20rpx;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #888;
	}
	.upload-box image {
		width: 100%;
		height: 100%;
	}
	.upload-placeholder {
		font-size: 30rpx;
	}
	.switch-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 16rpx;
	}
	.banner-thumb {
		width: 100%;
		height: 220rpx;
		border-radius: 8rpx;
		margin-bottom: 12rpx;
	}
	.detail-box {
		background: #f7fbff;
		border: 1px solid #dcecff;
		border-radius: 8rpx;
		padding: 18rpx;
		margin: 18rpx 0;
	}
	.user-detail-card {
		background: linear-gradient(180deg, #f8fbff 0%, #ffffff 42%);
		border: 1px solid #d9e8ff;
		border-radius: 14rpx;
		padding: 24rpx;
		margin: 18rpx 0 24rpx;
		box-shadow: 0 10rpx 24rpx rgba(20, 84, 160, 0.08);
	}
	.inline-detail {
		margin: 20rpx 0 0;
		box-shadow: none;
		background: #f8fbff;
		border-style: dashed;
	}
	.detail-header {
		display: flex;
		align-items: center;
		gap: 16rpx;
		margin-bottom: 18rpx;
	}
	.avatar {
		width: 76rpx;
		height: 76rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #1478ff, #41a5ff);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 34rpx;
		font-weight: bold;
		flex-shrink: 0;
	}
	.avatar.small {
		width: 58rpx;
		height: 58rpx;
		font-size: 26rpx;
	}
	.detail-main,
	.user-main {
		flex: 1;
		min-width: 0;
	}
	.detail-name {
		font-size: 32rpx;
		font-weight: bold;
		color: #222;
		margin-bottom: 6rpx;
	}
	.detail-meta,
	.user-meta {
		color: #8a8f99;
		font-size: 24rpx;
	}
	.role-pill {
		padding: 8rpx 14rpx;
		border-radius: 999rpx;
		background: #edf5ff;
		color: #006eff;
		font-size: 24rpx;
		white-space: nowrap;
	}
	.role-pill.admin {
		background: #fff3df;
		color: #b56a00;
	}
	.small-pill {
		font-size: 22rpx;
		padding: 6rpx 12rpx;
	}
	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12rpx;
		margin-bottom: 18rpx;
	}
	.info-cell {
		background: #fff;
		border-radius: 8rpx;
		padding: 16rpx;
		border: 1px solid #edf1f6;
	}
	.info-cell text {
		display: block;
		color: #8a8f99;
		font-size: 22rpx;
		margin-bottom: 6rpx;
	}
	.info-cell view {
		color: #222;
		font-size: 30rpx;
		font-weight: bold;
	}
	.form-block {
		background: #fff;
		border: 1px solid #edf1f6;
		border-radius: 10rpx;
		padding: 18rpx;
	}
	.field-label {
		color: #555;
		font-size: 24rpx;
		margin: 14rpx 0 8rpx;
	}
	.field-label:first-child {
		margin-top: 0;
	}
	.role-switch {
		display: flex;
		gap: 12rpx;
		margin: 18rpx 0;
	}
	.role-option {
		flex: 1;
		text-align: center;
		padding: 16rpx 0;
		border: 1px solid #d9dfe8;
		border-radius: 10rpx;
		background: #fff;
		color: #555;
	}
	.role-option.active {
		background: #006eff;
		border-color: #006eff;
		color: #fff;
		font-weight: bold;
	}
	.detail-actions {
		display: grid;
		grid-template-columns: 1.2fr 0.8fr 1fr;
		gap: 12rpx;
	}
	.detail-actions button,
	.list-actions button {
		margin: 0;
	}
	.primary-action,
	.soft-action,
	.danger-action {
		height: 68rpx;
		line-height: 68rpx;
		border-radius: 10rpx;
		font-size: 26rpx;
	}
	.detail-title {
		font-weight: bold;
		margin-bottom: 14rpx;
	}
	.role-row {
		display: flex;
		gap: 12rpx;
		margin: 16rpx 0;
	}
	.action-btn {
		margin: 20rpx 0 10rpx;
	}
	.plain-btn {
		margin-bottom: 10rpx;
		background: #f5f5f5;
		color: #333;
	}
	.gap {
		height: 16rpx;
	}
	.card {
		padding: 20rpx 0;
		border-top: 1px solid #eee;
	}
	.user-card {
		cursor: pointer;
	}
	.user-list-card {
		background: #fff;
		border: 1px solid #edf1f6;
		border-radius: 14rpx;
		padding: 22rpx;
		margin-top: 18rpx;
		box-shadow: 0 8rpx 20rpx rgba(28, 39, 64, 0.04);
	}
	.user-list-card.selected {
		background: #f8fbff;
		border-color: #b9d8ff;
	}
	.user-line {
		display: flex;
		align-items: center;
		gap: 14rpx;
	}
	.user-name {
		font-size: 30rpx;
		font-weight: bold;
		color: #222;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.user-name text {
		color: #555;
		font-weight: normal;
	}
	.user-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12rpx;
		margin: 18rpx 0 16rpx;
	}
	.user-stats view {
		background: #f7f9fc;
		border-radius: 8rpx;
		padding: 14rpx;
		color: #333;
		font-size: 26rpx;
	}
	.user-stats text {
		color: #8a8f99;
		margin-right: 10rpx;
	}
	.list-actions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12rpx;
	}
	.list-actions button {
		height: 64rpx;
		line-height: 64rpx;
		border-radius: 10rpx;
		font-size: 26rpx;
	}
	.list-detail-btn {
		background: #f4f8ff;
		color: #006eff;
	}
	.list-delete-btn {
		background: #fff1f1;
		color: #e93f3f;
	}
	.row {
		margin-bottom: 10rpx;
	}
	.strong {
		font-weight: bold;
	}
	.muted {
		color: #777;
	}
	.blue {
		color: #006eff;
	}
	.tag {
		display: inline-block;
		margin-left: 12rpx;
		padding: 2rpx 12rpx;
		border-radius: 6rpx;
		background: #eef5ff;
		color: #006eff;
		font-size: 24rpx;
	}
	.ops {
		display: flex;
		flex-wrap: wrap;
		gap: 12rpx;
	}
	.empty-box {
		color: #999;
		text-align: center;
		padding: 80rpx 0;
	}
</style>
