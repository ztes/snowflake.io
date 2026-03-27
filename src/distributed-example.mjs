import { 
  composeNodeId,
  decomposeNodeId,
  Snowflake,
  generateId,
  generateIds,
  generateIdAsync,
  parseId,
  isValidId
} from '../lib/index.js'

async function distributedExample() {
  console.log('=== 分布式环境配置示例 ===\n')

  console.log('1. 单数据中心多节点配置:')
  const dcNode1 = generateId({ datacenter: 1, worker: 1 })
  const dcNode2 = generateId({ datacenter: 1, worker: 2 })
  console.log(`节点1 ID: ${dcNode1}`)
  console.log(`节点2 ID: ${dcNode2}`)
  console.log(`节点1解析:`, parseId(dcNode1, { datacenter: 1, worker: 1 }))
  console.log('')

  console.log('1.1 节点ID编解码辅助方法:')
  const nodeId = composeNodeId(1, 5)
  console.log(`composeNodeId(1, 5) => ${nodeId}`)
  console.log('decomposeNodeId =>', decomposeNodeId(nodeId))
  console.log('')

  console.log('2. 多数据中心配置:')
  const beijing = generateId({ datacenter: 1, worker: 1 })
  const shanghai = generateId({ datacenter: 2, worker: 1 })
  const shenzhen = generateId({ datacenter: 3, worker: 1 })
  console.log(`北京节点 ID: ${beijing}`)
  console.log(`上海节点 ID: ${shanghai}`)
  console.log(`深圳节点 ID: ${shenzhen}`)
  console.log('')

  console.log('3. 直接指定节点ID配置:')
  const customNodeIdValue = 66
  const customNodeId = generateId({ id: customNodeIdValue })
  console.log(`自定义节点ID (${customNodeIdValue}) 生成的ID: ${customNodeId}`)
  console.log('')

  console.log('4. 时钟回拨处理策略:')
  console.log('  - throw: 检测到时钟回拨立即抛出异常')
  console.log('  - wait: 等待时钟追上（默认策略）')
  console.log('  - auto_adjust: 使用上一次的时间戳继续生成')
  
  const throwId = generateId({ id: 1, clockSkewHandler: 'throw' })
  const adjustId = generateId({ id: 2, clockSkewHandler: 'auto_adjust' })
  console.log(`throw策略 ID: ${throwId}`)
  console.log(`auto_adjust策略 ID: ${adjustId}`)
  console.log('')

  console.log('5. 批量生成配置:')
  const batchIds = generateIds(10, { datacenter: 2, worker: 3 })
  console.log(`批量生成的10个ID:`)
  batchIds.forEach((id, index) => {
    console.log(`  ${index + 1}. ${id}`)
  })
  console.log('')

  console.log('6. 自定义Epoch配置:')
  const customEpoch = new Date('2023-01-01').getTime()
  const customEpochId = generateId({ datacenter: 1, worker: 1, epoch: customEpoch })
  console.log(`自定义Epoch (${new Date(customEpoch).toISOString()}) 生成的ID: ${customEpochId}`)
  console.log('')

  console.log('7. 节点ID分配策略示例:')
  const nodeAllocation = [
    { range: '0-31', purpose: '预留系统节点', example: '系统管理、监控等' },
    { range: '32-63', purpose: '数据中心1', example: '北京机房' },
    { range: '64-95', purpose: '数据中心2', example: '上海机房' },
    { range: '96-127', purpose: '数据中心3', example: '深圳机房' },
    { range: '128-1023', purpose: '扩展节点', example: '未来扩展' }
  ]
  console.table(nodeAllocation)
  console.log('')

  console.log('8. 高并发场景配置:')
  console.time('批量生成10000个ID耗时')
  const highConcurrencyIds = generateIds(10000, { datacenter: 1, worker: 1 })
  console.timeEnd('批量生成10000个ID耗时')
  console.log(`生成的ID数量: ${highConcurrencyIds.length}`)
  console.log(`ID唯一性检查: ${new Set(highConcurrencyIds).size === highConcurrencyIds.length ? '通过' : '失败'}`)
  console.log('')

  console.log('9. 异步并发生成:')
  const promises = []
  for (let i = 0; i < 100; i++) {
    promises.push(generateIdAsync({ id: 500 }))
  }
  const asyncIds = await Promise.all(promises)
  console.log(`并发生成100个ID，唯一性: ${new Set(asyncIds).size === asyncIds.length ? '通过' : '失败'}`)
  console.log('')

  console.log('10. 统计信息:')
  const stats = Snowflake.getStats({ datacenter: 1, worker: 1 })
  console.log('统计信息:', stats)
  console.log('')

  console.log('=== 分布式环境最佳实践 ===')
  console.log(`
1. 确保所有节点时钟同步，使用NTP服务
2. 为每个数据中心分配唯一的datacenter ID
3. 在同一数据中心内，为每个工作节点分配唯一的worker ID
4. 根据业务需求选择合适的时钟回拨处理策略
5. 监控ID生成速率，避免超过每毫秒4096个的限制
6. 使用批量生成API提高高并发场景下的性能
7. 使用异步API处理并发请求
8. 定期检查ID的唯一性，特别是在添加新节点时
9. 生产环境必须显式传入 id 或 datacenter/worker
10. allowUnsafeAutoNodeId 仅用于开发和测试，不要用于生产
`)

  console.log('\n=== 分布式配置示例完成 ===')
}

distributedExample().catch(console.error)
