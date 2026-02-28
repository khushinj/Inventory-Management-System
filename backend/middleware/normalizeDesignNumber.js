/**
 * Middleware to normalize design numbers in requests
 * Ensures all design numbers are normalized for consistent comparison
 */

import { normalizeDesignNumber, normalizeColor, normalizeSize } from '../utils/normalization.js';

/**
 * Normalize design numbers in query parameters
 */
export const normalizeDesignNumberQuery = (req, res, next) => {
  if (req.query.designNumber) {
    req.query.designNumber = normalizeDesignNumber(req.query.designNumber);
  }
  if (req.query.dno) {
    req.query.dno = normalizeDesignNumber(req.query.dno);
  }
  next();
};

/**
 * Normalize design numbers in route parameters
 */
export const normalizeDesignNumberParams = (req, res, next) => {
  if (req.params.designNumber) {
    req.params.designNumber = normalizeDesignNumber(req.params.designNumber);
  }
  if (req.params.dno) {
    req.params.dno = normalizeDesignNumber(req.params.dno);
  }
  next();
};

/**
 * Normalize design numbers in request body
 */
export const normalizeDesignNumberBody = (req, res, next) => {
  if (req.body) {
    if (req.body.designNumber) {
      req.body.designNumber = normalizeDesignNumber(req.body.designNumber);
    }
    if (req.body.dno) {
      req.body.dno = normalizeDesignNumber(req.body.dno);
    }
    if (req.body.color) {
      req.body.color = normalizeColor(req.body.color);
    }
    if (req.body.size) {
      req.body.size = normalizeSize(req.body.size);
    }
    
    // Normalize arrays of items
    if (Array.isArray(req.body.items)) {
      req.body.items.forEach(item => {
        if (item.designNumber) item.designNumber = normalizeDesignNumber(item.designNumber);
        if (item.dno) item.dno = normalizeDesignNumber(item.dno);
        if (item.color) item.color = normalizeColor(item.color);
        if (item.size) item.size = normalizeSize(item.size);
      });
    }
  }
  next();
};

/**
 * Combine all normalization middlewares
 */
export const normalizeDesignNumberAll = (req, res, next) => {
  normalizeDesignNumberQuery(req, res, () => {
    normalizeDesignNumberParams(req, res, () => {
      normalizeDesignNumberBody(req, res, next);
    });
  });
};

export default {
  normalizeDesignNumberQuery,
  normalizeDesignNumberParams,
  normalizeDesignNumberBody,
  normalizeDesignNumberAll
};
