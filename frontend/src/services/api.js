import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
	try {
		const storedUser = localStorage.getItem('shopezUser');
		const user = storedUser ? JSON.parse(storedUser) : null;

		if (user?.token) {
			config.headers.Authorization = `Bearer ${user.token}`;
		}
	} catch (error) {
		localStorage.removeItem('shopezUser');
	}

	return config;
});

API.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error?.response?.status === 401) {
			localStorage.removeItem('shopezUser');
		}
		return Promise.reject(error);
	}
);

// Auth APIs
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Product APIs
export const getProducts = (params) => API.get('/products', { params });
export const getProductById = (id) => API.get(`/products/${id}`);
export const getFeaturedProducts = () => API.get('/products/featured');
export const getSellerProducts = () => API.get('/products/seller');
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const addReview = (id, data) => API.post(`/products/${id}/reviews`, data);

// Order APIs
export const createOrder = (data) => API.post('/orders', data);
export const getMyOrders = () => API.get('/orders/myorders');
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const payOrder = (id, data) => API.put(`/orders/${id}/pay`, data);
export const cancelOrder = (id) => API.put(`/orders/${id}/cancel`);
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });
export const getAllOrders = () => API.get('/orders');
export const getOrderStats = () => API.get('/orders/stats');

// Admin APIs
export const getDashboardStats = () => API.get('/admin/stats');
export const getAllUsers = () => API.get('/admin/users');
export const updateUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);

// Refund APIs (Admin)
export const initiateRefund = (id, data) => API.put(`/orders/${id}/refund`, data);
export const completeRefund = (id, data) => API.put(`/orders/${id}/refund/complete`, data);

// Return APIs
export const initiateReturn = (id, data) => API.put(`/orders/${id}/return`, data);
export const approveReturn = (id) => API.put(`/orders/${id}/return/approve`);
export const rejectReturn = (id, data) => API.put(`/orders/${id}/return/reject`, data);

// Dispute APIs (Admin)
export const initiateDispute = (id, data) => API.put(`/orders/${id}/dispute`, data);

// Seller APIs
export const getSellerOrders = () => API.get('/seller/orders');
export const getSellerStats = () => API.get('/seller/stats');

// Export axios instance as default for direct API calls
export default API;
