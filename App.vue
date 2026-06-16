<script>
	export default {
		onLaunch: function() {
			// #ifdef MP-WEIXIN
			const apiConfig = require('./config.js').default
			if (wx.cloud) {
				wx.cloud.init({
					env: apiConfig.cloud.env,
					traceUser: true
				})
			}
			// #endif
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
