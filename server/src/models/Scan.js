const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true, enum: ['pass', 'warn', 'fail', 'info'] },
    severity: { type: String, required: true, enum: ['high', 'medium', 'low', 'info'] },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    recommendation: { type: String, default: '' },
  },
  { _id: false, strict: true }
);

const categoryResultSchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: ['completed', 'error'] },
    summary: {
      pass: { type: Number, default: 0 },
      warn: { type: Number, default: 0 },
      fail: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },
    findings: { type: [findingSchema], default: [] },
  },
  { _id: false, strict: true }
);

const remediationSchema = new mongoose.Schema(
  {
    summary: { type: String, required: true },
    impact: { type: String, required: true },
    codeFix: { type: String, default: null },
    steps: { type: [String], default: [] },
    verification: { type: String, required: true },
  },
  { _id: false, strict: true }
);

const actionItemSchema = new mongoose.Schema(
  {
    findingId: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true, enum: ['fail', 'warn'] },
    severity: { type: String, required: true, enum: ['high', 'medium', 'low'] },
    domain: {
      type: String,
      required: true,
      enum: ['security', 'accessibility', 'performance', 'seo_crawlability', 'markup_structure'],
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    recommendation: { type: String, default: '' },
    remediation: { type: remediationSchema, default: null },
  },
  { _id: false, strict: true }
);

const actionCenterSchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: ['completed', 'error'] },
    summary: {
      actionable: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
    domainCounts: {
      security: { type: Number, default: 0 },
      accessibility: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      seo_crawlability: { type: Number, default: 0 },
      markup_structure: { type: Number, default: 0 },
    },
    items: { type: [actionItemSchema], default: [] },
  },
  { _id: false, strict: true }
);

const scanSchema = new mongoose.Schema(
  {
    scanId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^scan_[a-f0-9]{16}$/,
    },
    targetUrl: { type: String, required: true, maxlength: 2048 },
    finalUrl: { type: String, required: true, maxlength: 2048 },
    statusCode: { type: Number, required: true, min: 100, max: 599 },
    timing: {
      startTime: { type: Date },
      endTime: { type: Date },
      durationMs: { type: Number },
    },
    document: {
      statusCode: { type: Number },
      contentType: { type: String, default: '' },
      contentLengthBytes: { type: Number, default: 0 },
      baseline: {
        title: { type: String, default: '' },
        lang: { type: String, default: '' },
        charset: { type: String, default: '' },
        description: { type: String, default: '' },
        hasDoctype: { type: Boolean, default: false },
      },
    },
    summary: {
      pass: { type: Number, default: 0 },
      warn: { type: Number, default: 0 },
      fail: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },
    categories: {
      seo: { type: categoryResultSchema, required: true },
      securityHeaders: { type: categoryResultSchema, required: true },
      crawlability: { type: categoryResultSchema, required: true },
      technical: { type: categoryResultSchema, required: true },
      performance: { type: categoryResultSchema, required: true },
      accessibility: { type: categoryResultSchema, required: true },
      mobile: { type: categoryResultSchema, required: true },
      content: { type: categoryResultSchema, required: true },
    },
    actionCenter: { type: actionCenterSchema, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000, // 30 days TTL retention
      index: true,
    },
  },
  {
    strict: true,
    bufferCommands: false, // Disable Mongoose buffering for bounded write failures
  }
);

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;
