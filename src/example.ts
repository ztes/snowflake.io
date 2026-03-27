import { 
  Snowflake, 
  generateId, 
  generateIds,
  generateIdAsync,
  parseId,
  isValidId,
  type SnowflakeOptions 
} from './index.js'

async function examples() {
  console.log('=== 基本使用示例 ===')
  const id1 = generateId({ datacenter: 1, worker: 1 })
  console.log('生成的雪花ID:', id1)

  console.log('\n=== 自定义配置示例 ===')
  const options: SnowflakeOptions = {
    datacenter: 1,
    worker: 2,
    epoch: Date.now() - 30 * 24 * 60 * 60 * 1000
  }
  const id2 = generateId(options)
  console.log('使用自定义配置生成的雪花ID:', id2)

  console.log('\n=== 批量生成示例 ===')
  const batchIds = generateIds(5, { datacenter: 1, worker: 1 })
  console.log('批量生成的5个雪花ID:', batchIds)

  console.log('\n=== 异步生成示例 ===')
  const asyncId = await generateIdAsync({ id: 100 })
  console.log('异步生成的雪花ID:', asyncId)

  console.log('\n=== 解析雪花ID示例 ===')
  const deconstructed = parseId(id1)
  console.log('解析雪花ID:', deconstructed)
  console.log('生成时间:', new Date(deconstructed.timestamp).toISOString())

  console.log('\n=== 验证雪花ID示例 ===')
  const isValid = isValidId(id1)
  console.log('验证雪花ID:', isValid)

  console.log('\n=== 获取统计信息示例 ===')
  const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })
  console.log('雪花ID生成器统计信息:', stats)

  console.log('\n=== 时钟回拨策略示例 ===')
  const throwOptions: SnowflakeOptions = {
    id: 1,
    clockSkewHandler: 'throw'
  }
  console.log('throw策略ID:', generateId(throwOptions))

  const adjustOptions: SnowflakeOptions = {
    id: 2,
    clockSkewHandler: 'auto_adjust'
  }
  console.log('auto_adjust策略ID:', generateId(adjustOptions))

  console.log('\n=== 性能测试示例 ===')
  const count = 10000
  const startTime = Date.now()
  const testIds = generateIds(count, { datacenter: 1, worker: 1 })
  const endTime = Date.now()
  console.log(`生成 ${count} 个雪花ID耗时: ${endTime - startTime}ms`)
  console.log(`平均每个ID生成耗时: ${((endTime - startTime) / count).toFixed(4)}ms`)
  console.log(`每秒可生成: ${Math.floor(count / (endTime - startTime) * 1000)} 个ID`)
}

examples().catch(console.error)
