const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const collections = {
  user: db.collection('user'),
  address: db.collection('address'),
  orders: db.collection('orders'),
  notice: db.collection('notice'),
  certification: db.collection('certification'),
  comment: db.collection('comment'),
  records: db.collection('records'),
  banner: db.collection('banner'),
  counters: db.collection('counters')
}

const ok = (data = null, msg = 'success') => ({ code: '200', msg, data })
const fail = (msg = '操作失败', code = '500') => ({ code, msg })

function nowText() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function minutesFrom(time) {
  const date = time ? new Date(String(time).replace(/-/g, '/')) : new Date()
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
}

function getCurrentUser(event) {
  return event.user || null
}

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (e) {
    const message = e && (e.message || e.errMsg || '')
    if (!String(message).includes('exist')) {
      console.log(`createCollection ${name}:`, message)
    }
  }
}

async function nextId(name) {
  await ensureCollection('counters')
  const id = `counter_${name}`
  let current = 0
  try {
    const res = await collections.counters.doc(id).get()
    current = Number(res.data.value || 0)
    await collections.counters.doc(id).update({ data: { value: _.inc(1) } })
  } catch (e) {
    try {
      await collections.counters.add({ data: { _id: id, value: 1 } })
    } catch (addError) {
      const message = addError && (addError.message || addError.errMsg || '')
      if (!String(message).includes('duplicate') && !String(message).includes('exist')) {
        throw addError
      }
    }
    return 1
  }
  return current + 1
}

async function byId(collection, id) {
  const res = await collection.where({ id: Number(id) }).limit(1).get()
  return res.data[0] || null
}

async function updateById(collection, id, data) {
  const item = await byId(collection, id)
  if (!item) return false
  const clean = { ...data }
  delete clean._id
  await collection.doc(item._id).update({ data: clean })
  return true
}

async function removeById(collection, id) {
  const item = await byId(collection, id)
  if (!item) return false
  await collection.doc(item._id).remove()
  return true
}

async function enrichUser(user) {
  if (!user) return null
  const cert = await collections.certification.where({
    userId: user.id,
    status: '通过'
  }).limit(1).get()
  return {
    ...user,
    token: user.token || `demo-token-${user.id}`,
    isRider: cert.data.length > 0
  }
}

async function addRecord(userId, content, money, type) {
  await ensureCollection('records')
  await collections.records.add({
    data: {
      id: await nextId('records'),
      userId,
      content,
      money: Number(money || 0),
      type,
      time: nowText()
    }
  })
}

async function login(data) {
  const res = await collections.user.where({
    username: data.username,
    password: data.password
  }).limit(1).get()

  if (!res.data.length && data.username === 'admin' && data.password === 'demo-password') {
    const admin = {
      id: await nextId('user'),
      username: 'admin',
      password: 'demo-password',
      name: '管理员',
      avatar: '/static/logo.png',
      role: 'ADMIN',
      sex: '男',
      phone: '10000000003',
      account: 1000
    }
    await collections.user.add({ data: admin })
    return ok(await enrichUser(admin))
  }

  if (!res.data.length) return fail('账号或密码错误', '400')
  return ok(await enrichUser(res.data[0]))
}

async function register(data) {
  const exists = await collections.user.where({ username: data.username }).limit(1).get()
  if (exists.data.length) return fail('账号已存在', '400')
  const user = {
    id: await nextId('user'),
    username: data.username,
    password: data.password,
    name: data.name || data.username,
    avatar: data.avatar || '/static/logo.png',
    role: data.role || 'USER',
    sex: data.sex || '',
    phone: data.phone || '',
    account: 1000
  }
  await collections.user.add({ data: user })
  return ok(user)
}

async function listOrders(params = {}) {
  const query = {}
  if (params.userId) query.userId = Number(params.userId)
  if (params.acceptId) query.acceptId = Number(params.acceptId)
  if (params.status) query.status = params.status
  const res = await collections.orders.where(query).orderBy('id', 'desc').get()
  return ok(res.data.map(item => ({ ...item, range: minutesFrom(item.time) })))
}

async function selectOrderById(id) {
  const order = await byId(collections.orders, id)
  if (!order) return ok(null)
  const address = order.addressId ? await byId(collections.address, order.addressId) : {}
  const targetAddress = order.targetId ? await byId(collections.address, order.targetId) : {}
  let certification = {}
  if (order.acceptId) {
    const cert = await collections.certification.where({ userId: Number(order.acceptId) }).limit(1).get()
    certification = cert.data[0] || {}
  }
  return ok({ ...order, address: address || {}, targetAddress: targetAddress || {}, certification })
}

async function addOrder(data, event) {
  const current = getCurrentUser(event)
  if (!current || !current.id) return fail('请先登录', '401')
  const user = await byId(collections.user, current.id)
  if (!user) return fail('用户不存在', '400')
  const price = Number(data.price || 0)
  if (Number(user.account || 0) < price) return fail('金豆不足', '400')
  const id = await nextId('orders')
  const order = {
    ...data,
    id,
    userId: user.id,
    price,
    orderNo: `${Date.now()}${id}`,
    time: nowText(),
    acceptTime: '',
    acceptId: null,
    status: '待接单',
    expireAt: Date.now() + 30 * 60 * 1000
  }
  await collections.orders.add({ data: order })
  await updateById(collections.user, user.id, { account: Number(user.account || 0) - price })
  await addRecord(user.id, `下单${order.name || ''}`, price, '支出')
  return ok(order)
}

async function acceptOrder(data, event) {
  const current = getCurrentUser(event)
  if (!current || !current.id) return fail('请先登录', '401')
  const user = await enrichUser(await byId(collections.user, current.id))
  if (!user || !user.isRider) return fail('只有认证骑手才能接单', '400')
  const order = await byId(collections.orders, data.id)
  if (!order) return fail('订单不存在', '400')
  if (order.status !== '待接单') return fail('订单状态已变化', '400')
  const price = Number(order.price || 0)
  await updateById(collections.orders, order.id, {
    acceptId: user.id,
    acceptTime: nowText(),
    status: '待送达'
  })
  await updateById(collections.user, user.id, { account: Number(user.account || 0) + price })
  await addRecord(user.id, `接单${order.name || ''}`, price, '骑手')
  return ok()
}

async function updateOrder(data) {
  const order = await byId(collections.orders, data.id)
  if (!order) return fail('订单不存在', '400')
  const next = { ...data }
  delete next._id
  if (next.status === '已取消' && order.status !== '已取消') {
    const user = await byId(collections.user, order.userId)
    const price = Number(order.price || 0)
    if (user) await updateById(collections.user, user.id, { account: Number(user.account || 0) + price })
    await addRecord(order.userId, `取消订单${order.name || ''}`, price, '取消')
  }
  if (next.status === '待收货' && order.status !== '待收货') {
    next.arriveTime = nowText()
  }
  await updateById(collections.orders, data.id, next)
  return ok()
}

async function addComment(data) {
  const exists = await collections.comment.where({
    userId: Number(data.userId),
    orderId: Number(data.orderId)
  }).limit(1).get()
  if (exists.data.length) return fail('该订单已评价', '400')
  const item = {
    ...data,
    id: await nextId('comment'),
    userId: Number(data.userId),
    acceptId: Number(data.acceptId || 0),
    orderId: Number(data.orderId),
    star: Number(data.star || 0),
    time: nowText()
  }
  await collections.comment.add({ data: item })
  await updateById(collections.orders, item.orderId, { status: '已完成' })
  return ok(item)
}

async function addCertification(data) {
  const userId = Number(data.userId)
  const exists = await collections.certification.where({ userId }).limit(1).get()
  const item = {
    ...data,
    userId,
    status: '待审核',
    reason: ''
  }
  if (exists.data.length) {
    await collections.certification.doc(exists.data[0]._id).update({ data: item })
    return ok({ ...exists.data[0], ...item })
  }
  item.id = await nextId('certification')
  await collections.certification.add({ data: item })
  return ok(item)
}

async function listUsers() {
  const res = await collections.user.orderBy('id', 'desc').get()
  return ok(res.data)
}

async function updateUser(data) {
  if (!data.id) return fail('Missing user id', '400')
  await updateById(collections.user, data.id, data)
  return ok()
}

async function deleteUser(id, event) {
  const current = getCurrentUser(event)
  const userId = Number(id)
  if (current && Number(current.id) === userId) return fail('不能删除当前登录管理员', '400')
  const user = await byId(collections.user, userId)
  if (!user) return fail('用户不存在', '400')
  await removeById(collections.user, userId)
  await removeWhere(collections.address, { userId })
  await removeWhere(collections.certification, { userId })
  await removeWhere(collections.records, { userId })
  return ok()
}

async function removeWhere(collection, query) {
  const res = await collection.where(query).limit(100).get()
  await Promise.all((res.data || []).map(item => collection.doc(item._id).remove()))
}

async function addNotice(data) {
  const item = {
    ...data,
    id: await nextId('notice'),
    time: data.time || nowText().slice(0, 10),
    user: data.user || 'admin'
  }
  await collections.notice.add({ data: item })
  return ok(item)
}

async function updateNotice(data) {
  if (!data.id) return fail('Missing notice id', '400')
  await updateById(collections.notice, data.id, data)
  return ok()
}

async function listCertification(params = {}) {
  const query = {}
  if (params.status) query.status = params.status
  const res = await collections.certification.where(query).orderBy('id', 'desc').get()
  return ok(res.data)
}

async function updateCertification(data) {
  if (!data.id) return fail('Missing certification id', '400')
  await updateById(collections.certification, data.id, data)
  return ok()
}

async function listComments(params = {}) {
  const query = {}
  if (params.userId) query.userId = Number(params.userId)
  if (params.orderId) query.orderId = Number(params.orderId)
  const res = await collections.comment.where(query).orderBy('id', 'desc').get()
  return ok(res.data)
}

async function listRecords(params = {}) {
  const query = {}
  if (params.userId) query.userId = Number(params.userId)
  if (params.type) query.type = params.type
  const res = await collections.records.where(query).orderBy('id', 'desc').get()
  return ok(res.data)
}

async function listBanners() {
  await ensureCollection('banner')
  const res = await collections.banner.orderBy('sort', 'asc').get()
  return ok(res.data)
}

async function addBanner(data) {
  await ensureCollection('banner')
  const item = {
    id: Date.now(),
    title: data.title || '',
    url: data.url,
    sort: Number(data.sort || 0),
    enabled: data.enabled !== false,
    time: nowText()
  }
  if (!item.url) return fail('请选择图片', '400')
  await collections.banner.add({ data: item })
  return ok(item)
}

async function updateBanner(data) {
  await ensureCollection('banner')
  if (!data.id) return fail('Missing banner id', '400')
  await updateById(collections.banner, data.id, {
    ...data,
    sort: Number(data.sort || 0),
    enabled: data.enabled !== false
  })
  return ok()
}

async function route(event) {
  const url = event.url || ''
  const method = String(event.method || 'GET').toUpperCase()
  const data = event.data || {}
  const current = getCurrentUser(event)

  if (method === 'POST' && url === '/login') return login(data)
  if (method === 'POST' && url === '/register') return register(data)

  let match = url.match(/^\/user\/selectById\/(\d+)/)
  if (method === 'GET' && url === '/user/selectAll') return listUsers()
  if (method === 'GET' && match) return ok(await enrichUser(await byId(collections.user, match[1])))
  if (method === 'PUT' && url === '/user/update') return updateUser(data)
  match = url.match(/^\/user\/delete\/(\d+)/)
  if (method === 'DELETE' && match) return deleteUser(match[1], event)
  match = url.match(/^\/user\/beans\/([\d.]+)/)
  if (method === 'PUT' && match) {
    if (!current || !current.id) return fail('请先登录', '401')
    const user = await byId(collections.user, current.id)
    const money = Number(match[1] || 0)
    await updateById(collections.user, user.id, { account: Number(user.account || 0) + money })
    await addRecord(user.id, '领取金豆', money, '领取')
    return ok()
  }

  if (method === 'GET' && url === '/address/selectAll') {
    const res = await collections.address.where({ userId: Number(data.userId) }).orderBy('id', 'desc').get()
    return ok(res.data)
  }
  if (method === 'POST' && url === '/address/add') {
    const item = { ...data, userId: Number(data.userId) }
    if (item.id) {
      await updateById(collections.address, item.id, item)
      return ok(item)
    }
    item.id = await nextId('address')
    await collections.address.add({ data: item })
    return ok(item)
  }
  match = url.match(/^\/address\/delete\/(\d+)/)
  if (method === 'DELETE' && match) {
    await removeById(collections.address, match[1])
    return ok()
  }

  if (method === 'GET' && url === '/banner/selectAll') return listBanners()
  if (method === 'POST' && url === '/banner/add') return addBanner(data)
  if (method === 'PUT' && url === '/banner/update') return updateBanner(data)
  match = url.match(/^\/banner\/delete\/(\d+)/)
  if (method === 'DELETE' && match) {
    await ensureCollection('banner')
    await removeById(collections.banner, match[1])
    return ok()
  }

  if (method === 'GET' && url === '/notice/selectAll') {
    const res = await collections.notice.orderBy('id', 'desc').get()
    return ok(res.data)
  }
  if (method === 'POST' && url === '/notice/add') return addNotice(data)
  if (method === 'PUT' && url === '/notice/update') return updateNotice(data)
  match = url.match(/^\/notice\/delete\/(\d+)/)
  if (method === 'DELETE' && match) {
    await removeById(collections.notice, match[1])
    return ok()
  }

  if (method === 'GET' && url === '/orders/selectAll') return listOrders(data)
  if (method === 'POST' && url === '/orders/addOrder') return addOrder(data, event)
  if (method === 'PUT' && url === '/orders/accept') return acceptOrder(data, event)
  if (method === 'PUT' && url === '/orders/update') return updateOrder(data)
  match = url.match(/^\/orders\/selectById\/(\d+)/)
  if (method === 'GET' && match) return selectOrderById(match[1])
  match = url.match(/^\/orders\/delete\/(\d+)/)
  if (method === 'DELETE' && match) {
    await removeById(collections.orders, match[1])
    return ok()
  }

  if (method === 'POST' && url === '/comment/add') return addComment(data)
  if (method === 'GET' && url === '/comment/selectAll') return listComments(data)
  match = url.match(/^\/comment\/selectComment\/(\d+)/)
  if (method === 'GET' && match) {
    const res = await collections.comment.where({ userId: Number(match[1]) }).orderBy('id', 'desc').get()
    return ok(res.data)
  }
  match = url.match(/^\/comment\/delete\/(\d+)/)
  if (method === 'DELETE' && match) {
    await removeById(collections.comment, match[1])
    return ok()
  }

  if (method === 'GET' && url === '/records/selectAll') return listRecords(data)

  if (method === 'GET' && url === '/certification/selectUserCertification') {
    if (!current || !current.id) return fail('请先登录', '401')
    const res = await collections.certification.where({ userId: Number(current.id) }).limit(1).get()
    return ok(res.data[0] || null)
  }
  if (method === 'GET' && url === '/certification/selectAll') return listCertification(data)
  if (method === 'PUT' && url === '/certification/update') return updateCertification(data)
  if (method === 'POST' && url === '/certification/add') return addCertification(data)
  match = url.match(/^\/certification\/delete\/(\d+)/)
  if (method === 'DELETE' && match) {
    await removeById(collections.certification, match[1])
    return ok()
  }

  return fail(`未实现接口：${method} ${url}`, '404')
}

exports.main = async (event) => {
  try {
    return await route(event)
  } catch (e) {
    console.error(e)
    return fail(e.message || '云函数异常')
  }
}

