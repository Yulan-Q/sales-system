import React from 'react'
import { Card, Empty } from 'antd'

const Campaigns = () => {
  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>📧 营销活动</h1>
      <Card>
        <Empty description="营销活动功能开发中..." />
      </Card>
    </div>
  )
}

export default Campaigns
