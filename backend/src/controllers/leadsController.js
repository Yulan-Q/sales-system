/**
 * 线索管理控制器
 */

const Database = require('../config/database');
const apifyService = require('../services/apifyService');
const { logger } = require('../utils/logger');

const db = new Database();

/**
 * 搜索线索
 */
async function searchLeads(req, res, next) {
  try {
    const { keywords, countries, sources = ['google_maps'], limit = 100 } = req.body;
    const company_id = req.user.company_id;

    let result;

    if (sources.includes('google_maps')) {
      result = await apifyService.searchGoogleMaps({
        keywords,
        countries,
        limit
      });
    } else if (sources.includes('google_search')) {
      result = await apifyService.searchGoogleSearch({
        keywords,
        countries,
        limit
      });
    }

    // 保存搜索任务到数据库
    const searchTask = {
      company_id,
      run_id: result.runId,
      keywords: JSON.stringify(keywords),
      countries: JSON.stringify(countries),
      status: 'running',
      created_at: new Date()
    };

    db.run(`
      INSERT INTO search_tasks (company_id, run_id, keywords, countries, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      searchTask.company_id,
      searchTask.run_id,
      searchTask.keywords,
      searchTask.countries,
      searchTask.status,
      searchTask.created_at
    ]);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取搜索进度
 */
async function getSearchProgress(req, res, next) {
  try {
    const { runId } = req.params;

    const progress = await apifyService.getRunProgress(runId);

    // 如果完成，导入数据
    if (progress.status === 'SUCCEEDED') {
      const leads = await apifyService.getRunResults(runId);
      
      // 保存到数据库
      const company_id = req.user.company_id;
      
      for (const lead of leads) {
        db.run(`
          INSERT INTO leads (company_id, company_name, website, country, city, email, phone, source, source_url, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
        `, [
          company_id,
          lead.company_name,
          lead.website,
          lead.country,
          lead.city,
          lead.email,
          lead.phone,
          lead.source,
          lead.source_url
        ]);
      }

      // 更新搜索任务状态
      db.run(`
        UPDATE search_tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE run_id = ?
      `, [runId]);

      // WebSocket 推送完成通知
      if (global.broadcastToClients) {
        global.broadcastToClients({
          type: 'lead_search_completed',
          data: {
            run_id: runId,
            total: leads.length,
            imported: leads.length
          }
        });
      }
    } else {
      // WebSocket 推送进度
      if (global.broadcastToClients) {
        global.broadcastToClients({
          type: 'lead_search_progress',
          data: progress
        });
      }
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取线索列表
 */
async function getLeads(req, res, next) {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      country,
      assigned_to,
      sort = '-created_at',
      search
    } = req.query;

    const company_id = req.user.company_id;
    const offset = (page - 1) * limit;

    // 构建查询
    let whereClause = 'WHERE company_id = ?';
    const params = [company_id];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (country) {
      whereClause += ' AND country = ?';
      params.push(country);
    }

    if (assigned_to) {
      whereClause += ' AND assigned_to = ?';
      params.push(assigned_to);
    }

    if (search) {
      whereClause += ' AND (company_name LIKE ? OR email LIKE ? OR contact_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // 排序
    const orderField = sort.replace('-', '');
    const orderDir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const orderBy = `ORDER BY ${orderField} ${orderDir}`;

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
    const { total } = db.prepare(countQuery).get(...params);

    // 查询数据
    const dataQuery = `
      SELECT * FROM leads ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const leads = db.prepare(dataQuery).all(...params, parseInt(limit), offset);

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 获取线索详情
 */
async function getLeadById(req, res, next) {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const lead = db.prepare(`
      SELECT * FROM leads WHERE id = ? AND company_id = ?
    `).get(id, company_id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    // 获取邮件历史
    const emails = db.prepare(`
      SELECT id, subject, status, sent_at, opened_count, clicked_count
      FROM emails WHERE lead_id = ?
      ORDER BY sent_at DESC
    `).all(id);

    // 获取跟进记录
    const notes = db.prepare(`
      SELECT n.*, u.name as author_name
      FROM lead_notes n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.lead_id = ?
      ORDER BY n.created_at DESC
    `).all(id);

    lead.email_history = emails;
    lead.notes = notes;

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 导入线索
 */
async function importLeads(req, res, next) {
  try {
    const { runId, company_id } = req.body;

    const leads = await apifyService.getRunResults(runId);
    let imported = 0;

    for (const lead of leads) {
      const result = db.run(`
        INSERT INTO leads (
          company_id, company_name, website, contact_name, contact_title,
          email, phone, address, country, city,
          facebook_url, linkedin_url, instagram_url,
          source, source_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
      `, [
        company_id,
        lead.company_name,
        lead.website,
        lead.contact_name,
        lead.contact_title,
        lead.email,
        lead.phone,
        lead.address,
        lead.country,
        lead.city,
        lead.facebook_url,
        lead.linkedin_url,
        lead.instagram_url,
        lead.source,
        lead.source_url
      ]);

      if (result.changes > 0) {
        imported++;
      }
    }

    res.json({
      success: true,
      data: {
        total: leads.length,
        imported
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 更新线索
 */
async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to, notes, next_follow_up } = req.body;
    const company_id = req.user.company_id;

    // 构建更新字段
    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }

    if (assigned_to) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }

    if (next_follow_up) {
      updates.push('next_follow_up = ?');
      values.push(next_follow_up);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, company_id);

    const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = ? AND company_id = ?`;
    
    const result = db.run(query, values);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    // 如果有 notes，添加到跟进记录
    if (notes) {
      db.run(`
        INSERT INTO lead_notes (lead_id, content, created_by, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [id, notes, req.user.id]);
    }

    res.json({
      success: true,
      data: {
        id: parseInt(id),
        updated: true
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 删除线索
 */
async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;
    const company_id = req.user.company_id;

    const result = db.run(`
      DELETE FROM leads WHERE id = ? AND company_id = ?
    `, [id, company_id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lead not found' }
      });
    }

    res.json({
      success: true,
      data: { id: parseInt(id), deleted: true }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 导出线索
 */
async function exportLeads(req, res, next) {
  try {
    const { format = 'csv', filters = {}, fields } = req.body;
    const company_id = req.user.company_id;

    // TODO: 实现导出逻辑
    // 1. 根据 filters 查询数据
    // 2. 生成文件（CSV/Excel/JSON）
    // 3. 保存到 uploads 目录
    // 4. 返回下载链接

    res.json({
      success: true,
      data: {
        download_url: `/downloads/leads_${Date.now()}.${format}`,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        count: 0 // TODO: 实际数量
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 批量更新线索
 */
async function bulkUpdateLeads(req, res, next) {
  try {
    const { lead_ids, updates } = req.body;
    const company_id = req.user.company_id;

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updates)) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(company_id);

    const query = `
      UPDATE leads SET ${updateFields.join(', ')}
      WHERE id IN (${lead_ids.map(() => '?').join(',')}) AND company_id = ?
    `;

    const result = db.run(query, [...updateValues, ...lead_ids, company_id]);

    res.json({
      success: true,
      data: {
        updated: result.changes
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 添加跟进记录
 */
async function addNote(req, res, next) {
  try {
    const { id } = req.params;
    const { content, reminder_date } = req.body;
    const user_id = req.user.id;

    const result = db.run(`
      INSERT INTO lead_notes (lead_id, content, created_by, reminder_date, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, content, user_id, reminder_date]);

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        content,
        created_by: user_id,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  searchLeads,
  getSearchProgress,
  getLeads,
  getLeadById,
  importLeads,
  updateLead,
  deleteLead,
  exportLeads,
  bulkUpdateLeads,
  addNote
};
