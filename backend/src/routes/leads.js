/**
 * 线索管理路由
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const leadsController = require('../controllers/leadsController');
const validate = require('../middleware/validator');

/**
 * POST /leads/search
 * 搜索线索（Apify）
 */
router.post('/search',
  body('keywords').isArray().notEmpty().withMessage('Keywords required'),
  body('countries').optional().isArray(),
  body('limit').optional().isInt({ max: 1000 }),
  validate,
  leadsController.searchLeads
);

/**
 * GET /leads/search/:runId
 * 获取搜索进度
 */
router.get('/search/:runId',
  param('runId').notEmpty(),
  validate,
  leadsController.getSearchProgress
);

/**
 * GET /leads
 * 获取线索列表
 */
router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('status').optional().isIn(['new', 'contacted', 'replied', 'quoting', 'sample', 'closed', 'lost']),
  query('country').optional().isString(),
  query('assigned_to').optional().isInt(),
  query('sort').optional().isString(),
  query('search').optional().isString(),
  validate,
  leadsController.getLeads
);

/**
 * GET /leads/:id
 * 获取线索详情
 */
router.get('/:id',
  param('id').isInt(),
  validate,
  leadsController.getLeadById
);

/**
 * POST /leads/import
 * 导入线索（从 Apify）
 */
router.post('/import',
  body('runId').notEmpty(),
  body('company_id').isInt(),
  validate,
  leadsController.importLeads
);

/**
 * PUT /leads/:id
 * 更新线索
 */
router.put('/:id',
  param('id').isInt(),
  body('status').optional().isIn(['new', 'contacted', 'replied', 'quoting', 'sample', 'closed', 'lost']),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('assigned_to').optional().isInt(),
  body('notes').optional().isString(),
  body('next_follow_up').optional().isISO8601(),
  validate,
  leadsController.updateLead
);

/**
 * DELETE /leads/:id
 * 删除线索
 */
router.delete('/:id',
  param('id').isInt(),
  validate,
  leadsController.deleteLead
);

/**
 * POST /leads/export
 * 导出线索
 */
router.post('/export',
  body('format').isIn(['csv', 'excel', 'json']),
  body('filters').optional().isObject(),
  body('fields').optional().isArray(),
  validate,
  leadsController.exportLeads
);

/**
 * POST /leads/bulk-update
 * 批量更新线索
 */
router.post('/bulk-update',
  body('lead_ids').isArray().notEmpty(),
  body('updates').isObject(),
  validate,
  leadsController.bulkUpdateLeads
);

/**
 * POST /leads/:id/notes
 * 添加跟进记录
 */
router.post('/:id/notes',
  param('id').isInt(),
  body('content').notEmpty().isString(),
  body('reminder_date').optional().isISO8601(),
  validate,
  leadsController.addNote
);

module.exports = router;
