export function uploadCloudFile(filePath, folder = 'uploads') {
	const extMatch = filePath.match(/\.[^.]+$/)
	const ext = extMatch ? extMatch[0] : ''
	const cloudPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

	return wx.cloud.uploadFile({
		cloudPath,
		filePath
	}).then(res => res.fileID)
}
