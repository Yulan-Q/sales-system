/**
 * Apify 服务 - 线索挖掘
 */

const { ApifyClient } = require('apify-client');
const { logger } = require('../utils/logger');

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN
});

/**
 * 从 Google Maps 搜索线索
 * @param {Object} options - 搜索选项
 * @param {string[]} options.keywords - 关键词列表
 * @param {string[]} options.countries - 目标国家
 * @param {number} options.limit - 最大结果数
 * @returns {Promise<Object>} - Apify run ID
 */
async function searchGoogleMaps({ keywords, countries, limit = 100 }) {
  try {
    logger.info('Starting Google Maps search', { keywords, countries, limit });

    const runOptions = {
      queries: keywords.map(k => 
        `${k} ${countries.map(c => `in ${c}`).join(', ')}`
      ),
      maxItems: limit,
      includeEmails: true,
      includePhones: true,
      includeWebsites: true,
      outputFormat: 'json'
    };

    const actor = await client.actor('compass/crawler-google-places').call(runOptions);
    
    logger.info('Google Maps search started', { runId: actor.id });

    return {
      runId: actor.id,
      status: 'running',
      estimatedTime: Math.ceil(limit / 10) * 5 // 估算秒数
    };
  } catch (error) {
    logger.error('Google Maps search failed:', error);
    throw new Error(`Apify search failed: ${error.message}`);
  }
}

/**
 * 从 Google Search 搜索线索
 * @param {Object} options - 搜索选项
 * @param {string[]} options.keywords - 关键词
 * @param {string[]} options.countries - 目标国家
 * @param {number} options.limit - 最大结果数
 * @returns {Promise<Object>} - Apify run ID
 */
async function searchGoogleSearch({ keywords, countries, limit = 100 }) {
  try {
    logger.info('Starting Google Search', { keywords, countries, limit });

    const runOptions = {
      queries: keywords.map(k => 
        `${k} distributor wholesaler importer ${countries.join(' ')}`
      ),
      maxResults: limit,
      outputFormat: 'json'
    };

    const actor = await client.actor('apify/google-search-scraper').call(runOptions);
    
    logger.info('Google Search started', { runId: actor.id });

    return {
      runId: actor.id,
      status: 'running',
      estimatedTime: Math.ceil(limit / 20) * 10
    };
  } catch (error) {
    logger.error('Google Search failed:', error);
    throw new Error(`Apify search failed: ${error.message}`);
  }
}

/**
 * 获取 Apify run 结果
 * @param {string} runId - Apify run ID
 * @returns {Promise<Array>} - 线索数据
 */
async function getRunResults(runId) {
  try {
    const run = await client.run(runId);
    const { status } = await run.waitForFinish();

    if (status !== 'SUCCEEDED') {
      throw new Error(`Run failed with status: ${status}`);
    }

    const items = await client.run(runId).dataset().listItems();
    
    logger.info('Retrieved run results', { runId, count: items.count });

    return items.items.map(normalizeLeadData);
  } catch (error) {
    logger.error('Failed to get run results:', error);
    throw error;
  }
}

/**
 * 获取 run 进度
 * @param {string} runId - Apify run ID
 * @returns {Promise<Object>} - 进度信息
 */
async function getRunProgress(runId) {
  try {
    const run = await client.run(runId);
    const runInfo = await run.get();

    return {
      runId,
      status: runInfo.status,
      progress: runInfo.stats?.inputBodyRecordsProcessed || 0,
      total: runInfo.stats?.inputBodyRecordsTotal || 0
    };
  } catch (error) {
    logger.error('Failed to get run progress:', error);
    throw error;
  }
}

/**
 * 标准化线索数据
 * @param {Object} item - Apify 原始数据
 * @returns {Object} - 标准化后的数据
 */
function normalizeLeadData(item) {
  return {
    company_name: item.title || item.name || '',
    website: item.website || '',
    address: item.address || '',
    city: item.city || '',
    country: item.country || '',
    phone: item.phone || '',
    email: item.email || '',
    contact_name: item.contactName || '',
    contact_title: item.contactTitle || '',
    facebook_url: item.facebookUrl || '',
    linkedin_url: item.linkedinUrl || '',
    instagram_url: item.instagramUrl || '',
    source: 'google_maps',
    source_url: item.url || '',
    latitude: item.lat || null,
    longitude: item.lng || null,
    rating: item.rating || null,
    reviews: item.reviewsCount || 0
  };
}

/**
 * 从网站提取联系信息
 * @param {string} websiteUrl - 网站 URL
 * @returns {Promise<Object>} - 联系信息
 */
async function extractContactInfo(websiteUrl) {
  try {
    const runOptions = {
      startUrls: [{ url: websiteUrl }],
      maxRequestRetries: 2,
      outputFormat: 'json'
    };

    const actor = await client.actor('vdrmota/contact-info-scraper').call(runOptions);
    const run = await client.run(actor.id);
    const { status } = await run.waitForFinish();

    if (status !== 'SUCCEEDED') {
      return { error: 'Failed to extract contact info' };
    }

    const items = await client.run(actor.id).dataset().listItems();
    
    if (items.count === 0) {
      return { error: 'No contact info found' };
    }

    const contact = items.items[0];
    
    return {
      emails: contact.emails || [],
      phones: contact.phones || [],
      socialLinks: contact.socialLinks || []
    };
  } catch (error) {
    logger.error('Contact info extraction failed:', error);
    return { error: error.message };
  }
}

module.exports = {
  searchGoogleMaps,
  searchGoogleSearch,
  getRunResults,
  getRunProgress,
  extractContactInfo,
  normalizeLeadData
};
