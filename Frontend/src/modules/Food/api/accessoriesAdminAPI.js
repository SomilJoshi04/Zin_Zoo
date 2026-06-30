import api from '../../../../../core/api/api';

const BASE_URL = '/v1/accessories/admin';

export const accessoriesAdminAPI = {
  // Categories
  getCategories: () => api.get(`${BASE_URL}/categories`),
  createCategory: (data) => api.post(`${BASE_URL}/categories`, data),
  updateCategory: (id, data) => api.put(`${BASE_URL}/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`${BASE_URL}/categories/${id}`),
  toggleCategoryStatus: (id) => api.patch(`${BASE_URL}/categories/${id}/status`),

  // Products
  getProducts: (params) => api.get(`${BASE_URL}/products`, { params }),
  createProduct: (data) => api.post(`${BASE_URL}/products`, data),
  updateProduct: (id, data) => api.put(`${BASE_URL}/products/${id}`, data),
  deleteProduct: (id) => api.delete(`${BASE_URL}/products/${id}`),
  toggleProductStatus: (id) => api.patch(`${BASE_URL}/products/${id}/status`),
};
