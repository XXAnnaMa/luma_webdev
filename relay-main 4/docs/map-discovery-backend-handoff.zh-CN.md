# LUMA 地图发现后端交接文档（中文）

最后更新：2026-03-05  
负责人：Backend（仅 Map 范围）

## 1. 已交付内容

地图相关后端 MVP 已完成并验证通过。

### 已交付接口

- 新接口：`GET /api/v1/events/map`
- 目的：按当前地图视窗（bbox）返回地图渲染所需事件数据。

### 已交付能力

- 视窗边界过滤（bbox）：
  - `min_lat`, `max_lat`, `min_lng`, `max_lng`
- 在 bbox 基础上支持筛选：
  - `category`, `date`, `search`
- 分页能力：
  - `limit` 默认 `500`
  - `offset` 默认 `0`
  - `limit` 最大 `2000`
- 参数校验：
  - 拦截非法边界（`min_lat > max_lat`、`min_lng > max_lng`）
- 性能基础优化：
  - 数据库坐标复合索引：`ix_events_latitude_longitude`
  - Alembic 迁移：`202603050001_events_lat_lng_index.py`

### 验证状态

- 自动化测试：`5 passed`
- 手动联调：
  - 合法 bbox -> `200`
  - 非法 bbox -> `422`
  - 超上限分页（`limit > 2000`）-> `422`

## 2. 前端接口契约

### Endpoint

`GET /api/v1/events/map`

### Query 参数

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `min_lat` | float | 是 | 范围 `-90` 到 `90` |
| `max_lat` | float | 是 | 范围 `-90` 到 `90` |
| `min_lng` | float | 是 | 范围 `-180` 到 `180` |
| `max_lng` | float | 是 | 范围 `-180` 到 `180` |
| `category` | string | 否 | 分类过滤（后端大小写不敏感） |
| `date` | string | 否 | `YYYY-MM-DD` |
| `search` | string | 否 | 搜索标题/描述/地址 |
| `limit` | int | 否 | 默认 `500`，最大 `2000` |
| `offset` | int | 否 | 默认 `0` |

### 成功响应（`200`）

```json
{
  "events": [
    {
      "id": "50cb7705-28e5-4f2e-8fa8-902b6500911b",
      "title": "Community Meetup",
      "category": "Tech",
      "date": "2026-03-20",
      "time": "19:30",
      "address": "123 Main St, Los Angeles, CA",
      "location": {
        "lat": 34.0522,
        "lng": -118.2437
      }
    }
  ],
  "total": 1
}
```

### 错误响应（`422`）

1. 自定义边界校验：

```json
{
  "detail": "min_lat cannot be greater than max_lat"
}
```

或

```json
{
  "detail": "min_lng cannot be greater than max_lng"
}
```

2. 参数规则校验（例如 `limit=3000`）：

```json
{
  "detail": [
    {
      "loc": ["query", "limit"],
      "msg": "Input should be less than or equal to 2000"
    }
  ]
}
```

## 3. 前端接入步骤（Leaflet/Mapbox 通用）

### Step 1：将地图视窗转换为 bbox

从地图 bounds 提取：

- `min_lat = south`
- `max_lat = north`
- `min_lng = west`
- `max_lng = east`

### Step 2：在视窗稳定后触发请求

- 用 `moveend` / `zoomend` 触发，不要每帧请求。
- 建议加 `250-400ms` 防抖。
- 新请求发起时取消旧请求（AbortController）。

### Step 3：调用接口

示例：

```http
GET /api/v1/events/map?min_lat=33.9&max_lat=34.2&min_lng=-118.5&max_lng=-118.0&limit=500&offset=0
```

### Step 4：渲染地图点位

建议映射：

- `id`：marker 唯一键
- `location.lat/lng`：坐标
- `title/category/date/time/address`：弹窗或卡片摘要

### Step 5：分页策略（需要时）

- 首次请求：`limit=500, offset=0`
- 若 `total > events.length`，按 `offset` 继续拉下一页

## 4. 给产品和团队的信息

### 已完成

- 地图发现后端 MVP 可供前端直接接入。
- 已支持视窗驱动查询 + 基础筛选。
- 已做基础性能保护（坐标索引 + 分页上限）。

### 当前不在本次后端范围

- marker clustering（聚合展示逻辑）
- 前端防抖/请求取消实现
- 缓存策略（ETag / 服务端缓存）
- 按距离排序/推荐
- 个性化与认证相关地图行为

## 5. 建议 QA 清单

1. 拖动到新区域后，事件按视窗刷新。
2. 手工传反向边界参数，接口返回 `422`。
3. 传 `limit=3000`，接口返回 `422`。
4. bbox + `category/date/search` 组合筛选结果正确。
5. 使用 `offset` 翻页时，不出现重复 marker id。
