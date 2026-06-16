const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

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

async function resetCollection(name, rows) {
  await ensureCollection(name)
  const col = db.collection(name)
  let old = { data: [] }
  try {
    old = await col.limit(100).get()
  } catch (e) {
    old = { data: [] }
  }
  await Promise.all(old.data.map(item => col.doc(item._id).remove()))
  await Promise.all(rows.map(row => col.add({ data: row })))
}

async function resetCounters(rows) {
  await ensureCollection('counters')
  const col = db.collection('counters')
  let old = { data: [] }
  try {
    old = await col.limit(100).get()
  } catch (e) {
    old = { data: [] }
  }
  await Promise.all(old.data.map(item => col.doc(item._id).remove()))
  for (const row of rows) {
    await col.add({ data: { _id: row._id, value: row.value } })
  }
}

exports.main = async () => {
  await resetCollection('user', [
    {
      id: 1,
      username: 'user',
      password: 'demo-password',
      name: '普通用户',
      avatar: '/static/logo.png',
      role: 'USER',
      sex: '男',
      phone: '10000000001',
      account: 1000
    },
    {
      id: 2,
      username: 'rider',
      password: 'demo-password',
      name: '认证骑手',
      avatar: '/static/logo.png',
      role: 'USER',
      sex: '男',
      phone: '10000000002',
      account: 1000
    },
    {
      id: 3,
      username: 'admin',
      password: 'demo-password',
      name: '管理员',
      avatar: '/static/logo.png',
      role: 'ADMIN',
      sex: '男',
      phone: '10000000003',
      account: 1000
    }
  ])

  await resetCollection('certification', [
    {
      id: 1,
      userId: 2,
      name: '认证骑手',
      phone: '10000000002',
      cardNo: 'ID_CARD_EXAMPLE',
      address: '校园生活区',
      avatar: '',
      card1: '',
      card2: '',
      status: '通过',
      reason: '演示账号'
    }
  ])

  await resetCollection('notice', [
    { id: 1, title: '系统公告', content: '校园跑腿小程序演示版已上线', time: '2026-06-13', user: 'admin' },
    { id: 2, title: '温馨提示', content: '下单后请保持电话畅通，方便骑手联系', time: '2026-06-13', user: 'admin' }
  ])

  await resetCollection('banner', [
    { id: 1, title: '默认首页图', url: '/static/logo.png', sort: 1, enabled: true, time: '2026-06-14 00:00:00' }
  ])

  await resetCollection('address', [
    { id: 1, userId: 1, address: '一号教学楼', doorNo: '101', userName: '普通用户', phone: '10000000001' },
    { id: 2, userId: 1, address: '学生公寓 A 栋', doorNo: '501', userName: '普通用户', phone: '10000000001' }
  ])

  await resetCollection('orders', [])
  await resetCollection('comment', [])
  await resetCollection('records', [])
  await resetCounters([
    { _id: 'counter_user', value: 3 },
    { _id: 'counter_certification', value: 1 },
    { _id: 'counter_notice', value: 2 },
    { _id: 'counter_banner', value: 1 },
    { _id: 'counter_address', value: 2 },
    { _id: 'counter_orders', value: 0 },
    { _id: 'counter_comment', value: 0 },
    { _id: 'counter_records', value: 0 }
  ])

  return {
    code: '200',
    msg: '初始化完成',
    demoAccounts: [
      { username: 'user', password: 'demo-password', role: '普通用户' },
      { username: 'rider', password: 'demo-password', role: '认证骑手' },
      { username: 'admin', password: 'demo-password', role: '管理员' }
    ]
  }
}

