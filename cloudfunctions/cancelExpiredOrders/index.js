const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const orders = db.collection('orders')
const users = db.collection('user')
const records = db.collection('records')
const counters = db.collection('counters')

function nowText() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

async function nextId(name) {
  const id = `counter_${name}`
  try {
    await counters.doc(id).update({ data: { value: _.inc(1) } })
  } catch (e) {
    await counters.doc(id).set({ data: { value: 1 } })
  }
  const res = await counters.doc(id).get()
  return res.data.value
}

exports.main = async () => {
  const expired = await orders.where({
    status: '待接单',
    expireAt: _.lt(Date.now())
  }).limit(100).get()

  for (const order of expired.data) {
    await orders.doc(order._id).update({
      data: {
        status: '已取消',
        canceledAt: nowText()
      }
    })

    const userRes = await users.where({ id: Number(order.userId) }).limit(1).get()
    const user = userRes.data[0]
    if (user) {
      await users.doc(user._id).update({
        data: {
          account: Number(user.account || 0) + Number(order.price || 0)
        }
      })
    }

    await records.add({
      data: {
        id: await nextId('records'),
        userId: Number(order.userId),
        content: `超时取消订单${order.name || ''}`,
        money: Number(order.price || 0),
        type: '取消',
        time: nowText()
      }
    })
  }

  return {
    code: '200',
    msg: 'ok',
    canceled: expired.data.length
  }
}
