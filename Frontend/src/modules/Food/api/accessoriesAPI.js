import api from '../../../../../core/api/api';

const BASE_URL = '/v1/accessories/public';

export const accessoriesAPI = {
  getCategories: () => api.get(`${BASE_URL}/categories`),
  getProducts: (params) => api.get(`${BASE_URL}/products`, { params }),
};
