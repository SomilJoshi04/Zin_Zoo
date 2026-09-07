import { searchGlobal } from '../services/globalSearch.service.js';
import { sendResponse } from '../../../utils/response.js';

/**
 * Controller to handle cross-module search
 */
export const globalSearchController = async (req, res, next) => {
    try {
        const { q, limit } = req.query;
        
        const results = await searchGlobal({ q, limit });
        
        return sendResponse(res, 200, 'Global search results fetched successfully', results.data);
    } catch (error) {
        next(error);
    }
};
