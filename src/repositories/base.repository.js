const mongoose = require('mongoose');

/**
 * Base Repository
 * Provides common database operations for all repositories
 * Following SOLID principles:
 * - Single Responsibility: Handles only data access operations
 * - Open/Closed: Extensible for specific repositories
 * - Liskov Substitution: Can be replaced by any specific repository
 */
class BaseRepository {
  /**
   * @param {mongoose.Model} model - Mongoose model
   */
  constructor(model) {
    if (!model) {
      throw new Error('Model is required for repository');
    }
    this.model = model;
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options (select, populate)
   * @returns {Promise<Object|null>}
   */
  async findById(id, options = {}) {
    let query = this.model.findById(id);
    
    if (options.select) {
      query = query.select(options.select);
    }
    
    if (options.populate) {
      query = query.populate(options.populate);
    }
    
    return query.exec();
  }

  /**
   * Find one document by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findOne(criteria, options = {}) {
    let query = this.model.findOne(criteria);
    
    if (options.select) {
      query = query.select(options.select);
    }
    
    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.sort) {
      query = query.sort(options.sort);
    }
    
    return query.exec();
  }

  /**
   * Find multiple documents
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async find(criteria = {}, options = {}) {
    let query = this.model.find(criteria);
    
    if (options.select) {
      query = query.select(options.select);
    }
    
    if (options.populate) {
      query = query.populate(options.populate);
    }
    
    if (options.sort) {
      query = query.sort(options.sort);
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.skip) {
      query = query.skip(options.skip);
    }
    
    return query.exec();
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @param {Object} options - Options (session for transactions)
   * @returns {Promise<Object>}
   */
  async create(data, options = {}) {
    const document = new this.model(data);
    return document.save(options);
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} data - Update data
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateById(id, data, options = {}) {
    return this.model.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true, ...options }
    ).exec();
  }

  /**
   * Update one document by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} data - Update data
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateOne(criteria, data, options = {}) {
    return this.model.findOneAndUpdate(
      criteria,
      data,
      { new: true, runValidators: true, ...options }
    ).exec();
  }

  /**
   * Update multiple documents
   * @param {Object} criteria - Search criteria
   * @param {Object} data - Update data
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Update result
   */
  async updateMany(criteria, data, options = {}) {
    return this.model.updateMany(criteria, data, options).exec();
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async deleteById(id, options = {}) {
    return this.model.findByIdAndDelete(id, options).exec();
  }

  /**
   * Delete one document by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async deleteOne(criteria, options = {}) {
    return this.model.findOneAndDelete(criteria, options).exec();
  }

  /**
   * Delete multiple documents
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(criteria, options = {}) {
    return this.model.deleteMany(criteria, options).exec();
  }

  /**
   * Count documents
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>}
   */
  async count(criteria = {}) {
    return this.model.countDocuments(criteria).exec();
  }

  /**
   * Check if document exists
   * @param {Object} criteria - Search criteria
   * @returns {Promise<boolean>}
   */
  async exists(criteria) {
    const count = await this.model.countDocuments(criteria).limit(1).exec();
    return count > 0;
  }

  /**
   * Start a database session for transactions
   * @returns {Promise<mongoose.ClientSession>}
   */
  async startSession() {
    return mongoose.startSession();
  }

  /**
   * Get distinct values for a field
   * @param {string} field - Field name
   * @param {Object} criteria - Filter criteria
   * @returns {Promise<Array>}
   */
  async distinct(field, criteria = {}) {
    return this.model.distinct(field, criteria).exec();
  }

  /**
   * Aggregate documents
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>}
   */
  async aggregate(pipeline) {
    return this.model.aggregate(pipeline).exec();
  }
}

module.exports = BaseRepository;
