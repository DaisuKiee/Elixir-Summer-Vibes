/**
 * Mongoose Helper Utilities
 * Provides helper functions for common Mongoose operations
 */

/**
 * Save a document with automatic retry on version conflicts
 * @param {Document} doc - Mongoose document to save
 * @param {Object} options - Options
 * @param {Number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {Function} options.onRetry - Optional callback to reapply changes on retry
 * @returns {Promise<Document>} Saved document
 */
export async function saveWithRetry(doc, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const onRetry = options.onRetry;
    let retries = maxRetries;
    
    while (retries > 0) {
        try {
            await doc.save();
            return doc;
        } catch (error) {
            if (error.name === 'VersionError' && retries > 1) {
                retries--;
                console.log(`[Mongoose] Version conflict, retrying... (${retries} attempts left)`);
                
                // Reload the document
                const Model = doc.constructor;
                const freshDoc = await Model.findById(doc._id);
                
                if (!freshDoc) {
                    throw new Error('Document not found during retry');
                }
                
                // If onRetry callback provided, reapply changes
                if (onRetry && typeof onRetry === 'function') {
                    await onRetry(freshDoc, doc);
                    doc = freshDoc;
                } else {
                    // No callback, just use fresh doc and retry
                    doc = freshDoc;
                }
            } else {
                // Not a version error or out of retries
                throw error;
            }
        }
    }
    
    throw new Error('Failed to save document after multiple retries');
}

/**
 * Find and update with version conflict handling
 * @param {Model} Model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} update - Update operations
 * @param {Object} options - Options for findOneAndUpdate
 * @returns {Promise<Document>} Updated document
 */
export async function findAndUpdateWithRetry(Model, filter, update, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let retries = maxRetries;
    
    while (retries > 0) {
        try {
            const result = await Model.findOneAndUpdate(
                filter,
                update,
                { new: true, runValidators: true, ...options }
            );
            return result;
        } catch (error) {
            if (error.name === 'VersionError' && retries > 1) {
                retries--;
                console.log(`[Mongoose] Version conflict in findAndUpdate, retrying... (${retries} attempts left)`);
            } else {
                throw error;
            }
        }
    }
    
    throw new Error('Failed to update document after multiple retries');
}

/**
 * Increment fields atomically without version conflicts
 * @param {Model} Model - Mongoose model
 * @param {String} id - Document ID
 * @param {Object} increments - Fields to increment { field: amount }
 * @returns {Promise<Document>} Updated document
 */
export async function incrementFields(Model, id, increments) {
    return await Model.findByIdAndUpdate(
        id,
        { $inc: increments },
        { new: true }
    );
}

/**
 * Push to array atomically
 * @param {Model} Model - Mongoose model
 * @param {String} id - Document ID
 * @param {Object} pushes - Fields to push { field: value }
 * @returns {Promise<Document>} Updated document
 */
export async function pushToArray(Model, id, pushes) {
    return await Model.findByIdAndUpdate(
        id,
        { $push: pushes },
        { new: true }
    );
}

/**
 * Set fields atomically
 * @param {Model} Model - Mongoose model
 * @param {String} id - Document ID
 * @param {Object} sets - Fields to set { field: value }
 * @returns {Promise<Document>} Updated document
 */
export async function setFields(Model, id, sets) {
    return await Model.findByIdAndUpdate(
        id,
        { $set: sets },
        { new: true }
    );
}

/**
 * Combine multiple atomic operations
 * @param {Model} Model - Mongoose model
 * @param {String} id - Document ID
 * @param {Object} operations - MongoDB update operations ($inc, $set, $push, etc.)
 * @returns {Promise<Document>} Updated document
 */
export async function atomicUpdate(Model, id, operations) {
    return await Model.findByIdAndUpdate(
        id,
        operations,
        { new: true, runValidators: true }
    );
}

export default {
    saveWithRetry,
    findAndUpdateWithRetry,
    incrementFields,
    pushToArray,
    setFields,
    atomicUpdate
};
