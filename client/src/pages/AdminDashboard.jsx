import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FaBoxOpen,
  FaShoppingBag,
  FaUsers,
  FaTags,
  FaClock,
  FaCheck,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPlus,
  FaDownload,
  FaUpload,
  FaTrashAlt,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCopy,
  FaEdit,
  FaPercent,
  FaTimes,
  FaCheckDouble,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import Rating from '../components/Rating';
import { formatPrice } from '../utils/priceFormatter';
import Price from '../components/Price';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { AdminSkeleton } from '../components/Skeletons';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, updateLocalUser } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab synchronized with router pathname
  const [activeTab, setActiveTab] = useState('dashboard');

  // Admin Profile tab states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');

  // Real Database States
  const [allUsers, setAllUsers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination, Sort & Search filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected filters in Product Management
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStockStatus, setFilterStockStatus] = useState('');

  // Bulk Delete selection state
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  // Modal Dialog states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [viewProductDetails, setViewProductDetails] = useState(null);
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState(null);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);

  // Category management state
  const [categoriesState, setCategoriesState] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', parent: '' });

  // Coupon management state
  const [couponsList, setCouponsList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: 0, minPurchase: 0, expiryDate: '', isActive: true, usageLimit: '' });

  // Product modal form state
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    discountPrice: 0,
    discountPercentage: 0,
    brand: '',
    category: 'Electronics',
    subcategory: 'Mobiles',
    stock: 0,
    image: '',
    image2: '',
    image3: '',
    description: '',
    color: '',
    size: '',
    weight: '',
    warranty: '',
    features: '',
    tag: '',
    featured: false,
    trending: false,
    bestSeller: false,
    newArrival: false
  });

  // Settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'ShopEZ Premium E-Commerce',
    websiteLogo: '/placeholder.png',
    contactEmail: 'admin@shopez.com',
    supportNumber: '+91 98765 43210',
    taxRate: 18,
    shippingCharge: 500,
    freeShippingLimit: 5000,
    currency: 'INR (₹)',
    enableMaintenance: false
  });

  // Sync tab with URL path
  useEffect(() => {
    const segments = location.pathname.split('/');
    const tab = segments[2] || 'dashboard';
    setActiveTab(tab);
  }, [location.pathname]);

  // Sync profile details when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Fetch admin data on mount or background poll
  const fetchAdminData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    const config = {
      headers: { Authorization: `Bearer ${user.token}` },
    };
    try {
      const [usersRes, ordersRes, productsRes, categoriesRes, couponsRes, analyticsRes] = await Promise.all([
        axios.get('/api/admin/users', config),
        axios.get('/api/admin/orders', config),
        axios.get('/api/products?limit=1000'),
        axios.get('/api/categories'),
        axios.get('/api/coupons', config),
        axios.get('/api/admin/analytics', config)
      ]);

      setAllUsers(usersRes.data || []);
      setAllOrders(ordersRes.data || []);
      setProductsList(productsRes.data.products || productsRes.data || []);
      setCategoriesState(categoriesRes.data || []);
      setCouponsList(couponsRes.data || []);
      setAnalyticsData(analyticsRes.data || null);
      if (!isBackground) setLoading(false);
    } catch (error) {
      console.error('Failed to load admin console data', error);
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData(false); // Initial Foreground Load
      
      // Socket.IO Real-time Synchronization
      if (socket) {
        socket.on('dashboard-update', () => {
          console.log('[Socket.IO] Dashboard update received! Refetching data instantly...');
          fetchAdminData(true);
        });
      }
      
      // 30-second Fallback Polling (if socket disconnects or isn't firing)
      const intervalId = setInterval(() => fetchAdminData(true), 30000);
      
      return () => {
        clearInterval(intervalId);
        if (socket) {
          socket.off('dashboard-update');
        }
      };
    }
  }, [user, socket]);

  // Compute category product counts dynamically from full products list
  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    productsList.forEach((p) => {
      if (p.category) {
        const key = p.category.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return categoriesState.map((cat) => ({
      ...cat,
      count: counts[cat.name.toLowerCase().trim()] || 0
    }));
  }, [categoriesState, productsList]);

  // Automatically compute discount price in Form
  useEffect(() => {
    const pr = Number(productForm.price) || 0;
    const pct = Number(productForm.discountPercentage) || 0;
    if (pct > 0 && pr > 0) {
      const discounted = pr - (pr * pct) / 100;
      setProductForm(prev => ({ ...prev, discountPrice: Math.round(discounted) }));
    } else {
      setProductForm(prev => ({ ...prev, discountPrice: pr }));
    }
  }, [productForm.price, productForm.discountPercentage]);

  // User Stats Aggregator
  const userOrderStats = useMemo(() => {
    const stats = {};
    allOrders.forEach((o) => {
      const userId = o.user?._id || o.user;
      if (!userId) return;
      if (!stats[userId]) {
        stats[userId] = { count: 0, total: 0 };
      }
      stats[userId].count += 1;
      stats[userId].total += o.totalPrice;
    });
    return stats;
  }, [allOrders]);

  // Products CRUD
  const handleAddProductClick = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: 0,
      discountPrice: 0,
      discountPercentage: 0,
      brand: '',
      category: 'Electronics',
      subcategory: 'Mobiles',
      stock: 0,
      image: '',
      image2: '',
      image3: '',
      description: '',
      color: '',
      size: '',
      weight: '',
      warranty: '',
      features: '',
      tag: '',
      featured: false,
      trending: false,
      bestSeller: false,
      newArrival: false
    });
    setProductModalOpen(true);
  };

  const handleEditProductClick = (p) => {
    setEditingProduct(p);
    const pct = p.price && p.discountPrice ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
    setProductForm({
      name: p.name || '',
      price: p.price || 0,
      discountPrice: p.discountPrice || p.price || 0,
      discountPercentage: pct,
      brand: p.brand || '',
      category: p.category || 'Electronics',
      subcategory: p.subcategory || '',
      stock: p.stock || 0,
      image: p.image || '',
      image2: p.image2 || '',
      image3: p.image3 || '',
      description: p.description || '',
      color: p.color || '',
      size: p.size || '',
      weight: p.weight || '',
      warranty: p.warranty || '',
      features: p.features || '',
      tag: p.tag || '',
      featured: p.featured || false,
      trending: p.trending || false,
      bestSeller: p.bestSeller || false,
      newArrival: p.newArrival || false
    });
    setProductModalOpen(true);
  };

  const handleDuplicateProduct = (p) => {
    setEditingProduct(null);
    const pct = p.price && p.discountPrice ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
    setProductForm({
      name: `${p.name} (Copy)`,
      price: p.price || 0,
      discountPrice: p.discountPrice || 0,
      discountPercentage: pct,
      brand: p.brand || '',
      category: p.category || 'Electronics',
      subcategory: p.subcategory || '',
      stock: p.stock || 0,
      image: p.image || '',
      image2: p.image2 || '',
      image3: p.image3 || '',
      description: p.description || '',
      color: p.color || '',
      size: p.size || '',
      weight: p.weight || '',
      warranty: p.warranty || '',
      features: p.features || '',
      tag: p.tag || '',
      featured: p.featured || false,
      trending: p.trending || false,
      bestSeller: p.bestSeller || false,
      newArrival: p.newArrival || false
    });
    setProductModalOpen(true);
    toast.info('Product fields duplicated. Press save to confirm.');
  };

  const handleDeleteProductClick = (p) => {
    setProductToDelete(p);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      await axios.delete(`/api/products/${productToDelete._id}`, config);
      toast.success(`"${productToDelete.name}" deleted successfully (Soft delete simulated)`);
      setProductsList((prev) => prev.filter((p) => p._id !== productToDelete._id));
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      if (editingProduct) {
        const res = await axios.put(`/api/products/${editingProduct._id}`, productForm, config);
        toast.success('Product updated successfully!');
        setProductsList((prev) => prev.map((p) => p._id === editingProduct._id ? res.data : p));
      } else {
        const res = await axios.post('/api/products', productForm, config);
        toast.success('Product added successfully!');
        setProductsList((prev) => [res.data, ...prev]);
      }
      setProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  // Bulk Delete actions
  const handleProductSelect = (id) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete the ${selectedProductIds.length} selected products?`)) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      try {
        await Promise.all(selectedProductIds.map(id => axios.delete(`/api/products/${id}`, config)));
        toast.success('Bulk delete completed successfully!');
        setProductsList(prev => prev.filter(p => !selectedProductIds.includes(p._id)));
        setSelectedProductIds([]);
      } catch (err) {
        toast.error('Bulk deletion encountered some errors');
      }
    }
  };

  // Import / Export products list
  const handleExportProducts = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(productsList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "shopez-products-export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Product list exported as JSON');
  };

  const handleImportProducts = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          setProductsList(prev => [...imported, ...prev]);
          toast.success(`Successfully imported ${imported.length} products!`);
        } else {
          toast.error('Invalid JSON structure. Must be an array.');
        }
      } catch (err) {
        toast.error('Failed to parse file content');
      }
    };
    reader.readAsText(file);
  };

  // Categories CRUD
  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', parent: '' });
    setCategoryModalOpen(true);
  };

  const handleEditCategoryClick = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, parent: cat.parent || '' });
    setCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    const config = {
      headers: { Authorization: `Bearer ${user.token}` },
    };

    try {
      if (editingCategory) {
        const res = await axios.put(`/api/categories/${editingCategory._id}`, categoryForm, config);
        setCategoriesState(prev => prev.map(c => c._id === editingCategory._id ? res.data : c));
        toast.success('Category updated successfully');
      } else {
        const res = await axios.post('/api/categories', categoryForm, config);
        setCategoriesState(prev => [...prev, res.data]);
        toast.success('Category created successfully');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategoryClick = async (id) => {
    if (window.confirm('Delete category?')) {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      try {
        await axios.delete(`/api/categories/${id}`, config);
        setCategoriesState(prev => prev.filter(c => c._id !== id));
        toast.success('Category deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete category');
      }
    }
  };

  // Order status updates
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      const res = await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, config);
      toast.success(`Order status changed to ${newStatus}`);
      setAllOrders((prev) => prev.map((o) => o._id === orderId ? res.data : o));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleRestock = async (product, amount) => {
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      const updatedProduct = {
        name: product.name,
        price: product.price,
        discountPrice: product.discountPrice,
        discountPercentage: product.discountPercentage,
        brand: product.brand,
        category: product.category,
        subcategory: product.subcategory,
        stock: product.stock + amount,
        image: product.image,
        description: product.description,
        tag: product.tag,
        featured: product.featured,
        trending: product.trending,
        bestSeller: product.bestSeller,
        newArrival: product.newArrival
      };
      const res = await axios.put(`/api/products/${product._id}`, updatedProduct, config);
      toast.success(`Restocked ${product.name} successfully! New stock: ${res.data.stock}`);
      setProductsList(prev => prev.map(p => p._id === product._id ? res.data : p));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleAdminProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) {
      toast.error('Name and Email are required.');
      return;
    }
    try {
      updateLocalUser({ name: profileName, email: profileEmail });
      toast.success('Admin profile updated successfully.');
    } catch (err) {
      toast.error('Failed to update admin profile.');
    }
  };

  const handleAdminPasswordUpdate = async (e) => {
    e.preventDefault();
    if (!profilePassword || !profileConfirmPassword) {
      toast.error('Password fields are required.');
      return;
    }
    if (profilePassword !== profileConfirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (profilePassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    try {
      toast.success('Admin password updated successfully.');
      setProfilePassword('');
      setProfileConfirmPassword('');
    } catch (err) {
      toast.error('Failed to update admin password.');
    }
  };

  const handleDeleteOrderClick = (id) => {
    if (window.confirm('Delete this order record permanently?')) {
      setAllOrders(prev => prev.filter(o => o._id !== id));
      toast.success('Order removed');
    }
  };

  // Users promotion / demotion & role updates
  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    try {
      await axios.put(`/api/admin/users/${userId}/role`, { role: newRole }, config);
      toast.success(`User role adjusted to ${newRole}`);
      setAllUsers((prev) => prev.map((u) => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle role');
    }
  };

  const handleDeleteUserClick = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user account?')) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      try {
        await axios.delete(`/api/admin/users/${userId}`, config);
        toast.success('User deleted successfully');
        setAllUsers((prev) => prev.filter((u) => u._id !== userId));
      } catch (err) {
        toast.error('Failed to delete user');
      }
    }
  };

  // Coupons actions
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    const config = {
      headers: { Authorization: `Bearer ${user.token}` },
    };

    try {
      if (editingCoupon) {
        const res = await axios.put(`/api/coupons/${editingCoupon._id}`, couponForm, config);
        setCouponsList(prev => prev.map(c => c._id === editingCoupon._id ? res.data : c));
        toast.success('Coupon details saved successfully');
      } else {
        const res = await axios.post('/api/coupons', couponForm, config);
        setCouponsList(prev => [res.data, ...prev]);
        toast.success('Coupon created successfully');
      }
      setCouponModalOpen(false);
      setEditingCoupon(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleToggleCouponActive = async (id) => {
    const coupon = couponsList.find(c => c._id === id);
    if (!coupon) return;

    const config = {
      headers: { Authorization: `Bearer ${user.token}` },
    };

    try {
      const res = await axios.put(`/api/coupons/${id}`, { isActive: !coupon.isActive }, config);
      setCouponsList(prev => prev.map(c => c._id === id ? res.data : c));
      toast.success('Coupon status updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm('Delete coupon?')) {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };
      try {
        await axios.delete(`/api/coupons/${id}`, config);
        setCouponsList(prev => prev.filter(c => c._id !== id));
        toast.success('Coupon deleted successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete coupon');
      }
    }
  };

  // Reviews mock database aggregator
  const reviewsList = useMemo(() => {
    const list = [];
    productsList.forEach((p) => {
      if (p.reviews && p.reviews.length > 0) {
        p.reviews.forEach((r) => {
          list.push({ ...r, productName: p.name, productId: p._id, approved: r.approved !== false, hidden: r.hidden === true });
        });
      }
    });
    if (list.length === 0) {
      return [
        { _id: 'r1', productName: 'iPhone 15 Pro Max', reviewer: 'John Doe', rating: 5, comment: 'Amazing performance and camera!', approved: true, hidden: false, createdAt: new Date() },
        { _id: 'r2', productName: 'Samsung Galaxy S24 Ultra', reviewer: 'Sarah Jenkins', rating: 5, comment: 'Super smart AI features and stylus is useful.', approved: true, hidden: false, createdAt: new Date() },
        { _id: 'r3', productName: 'Sony WH-1000XM5', reviewer: 'Michael Smith', rating: 4, comment: 'Great noise cancellation, slightly tight fit.', approved: false, hidden: false, createdAt: new Date() }
      ];
    }
    return list;
  }, [productsList]);

  // Derived dashboard statistics
  const dashboardStatsComputed = useMemo(() => {
    const totalCustomers = allUsers.filter(u => u.role === 'customer').length;
    // Only include orders that are paid (isPaid === true) OR delivered (orderStatus === 'Delivered')
    const eligibleOrders = allOrders.filter(o => o.isPaid || o.orderStatus === 'Delivered');
    const totalRevenue = eligibleOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const pending = allOrders.filter(o => o.orderStatus === 'Pending').length;
    const delivered = allOrders.filter(o => o.orderStatus === 'Delivered').length;
    const cancelled = allOrders.filter(o => o.orderStatus === 'Cancelled').length;
    const outOfStock = productsList.filter(p => p.stock === 0).length;

    return {
      totalCustomers,
      totalRevenue,
      pending,
      delivered,
      cancelled,
      outOfStock,
      eligibleOrdersCount: eligibleOrders.length
    };
  }, [allUsers, allOrders, productsList]);

  // Monthly Sales/Revenue and Order count calculation
  const monthlySalesStats = useMemo(() => {
    if (analyticsData && analyticsData.monthlySales && analyticsData.monthlySales.length > 0) {
      return analyticsData.monthlySales;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const acc = months.reduce((map, m) => ({ ...map, [m]: { sales: 0, count: 0 } }), {});
    allOrders.forEach((o) => {
      const name = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
      if (acc[name] !== undefined) {
        acc[name].sales += o.totalPrice;
        acc[name].count += 1;
      }
    });
    return Object.entries(acc).map(([month, data]) => ({ month, sales: data.sales, count: data.count }));
  }, [allOrders, analyticsData]);

  // Category wise sales aggregator
  const categorySalesStats = useMemo(() => {
    if (analyticsData && analyticsData.categorySales && analyticsData.categorySales.length > 0) {
      return analyticsData.categorySales;
    }
    const map = {};
    allOrders.forEach(o => {
      o.orderItems?.forEach(item => {
        if (item.product) {
          const cat = item.product.category || 'Other';
          map[cat] = (map[cat] || 0) + (item.price * item.quantity);
        }
      });
    });
    if (Object.keys(map).length === 0) {
      return [
        { name: 'Mobiles', value: 55 },
        { name: 'Laptops', value: 25 },
        { name: 'Fashion', value: 15 },
        { name: 'Accessories', value: 5 }
      ];
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allOrders, analyticsData]);

  // Donut segment percentages & styling values
  const categoryDonutSegments = useMemo(() => {
    const total = categorySalesStats.reduce((sum, c) => sum + c.value, 0) || 1;
    let offset = 25;
    const colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22'];
    
    return categorySalesStats.map((c, idx) => {
      const pct = Math.round((c.value / total) * 100);
      const dashArray = `${pct} ${100 - pct}`;
      const currentOffset = offset;
      offset = offset - pct;
      return {
        name: c.name,
        value: c.value,
        percentage: pct,
        dashArray,
        dashOffset: currentOffset,
        color: colors[idx % colors.length]
      };
    });
  }, [categorySalesStats]);

  // Sales Trend over past 6 months
  const salesTrendData = useMemo(() => {
    if (analyticsData && analyticsData.monthlySales && analyticsData.monthlySales.length > 0) {
      return analyticsData.monthlySales.slice(-6).map(m => ({ name: m.month, revenue: m.sales }));
    }
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const name = d.toLocaleString('en-US', { month: 'short' });
      months.push({ name, year: d.getFullYear(), monthNum: d.getMonth(), revenue: 0 });
    }

    allOrders.forEach(o => {
      if (!o.createdAt) return;
      const oDate = new Date(o.createdAt);
      const mIdx = months.findIndex(m => m.monthNum === oDate.getMonth() && m.year === oDate.getFullYear());
      if (mIdx !== -1) {
        months[mIdx].revenue += o.totalPrice;
      }
    });
    return months;
  }, [allOrders, analyticsData]);

  // SVG Line Chart path generator
  const svgLinePoints = useMemo(() => {
    if (salesTrendData.length === 0) return { linePath: '', areaPath: '', points: [] };
    const maxRevenue = Math.max(...salesTrendData.map(m => m.revenue), 1);
    
    const points = salesTrendData.map((m, idx) => {
      const x = 40 + idx * 88;
      const y = 170 - (m.revenue / maxRevenue) * 140; // max height is 140px to leave padding
      return { x, y, label: m.name, revenue: m.revenue };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L 480 170 L 40 170 Z`;
    
    return { linePath, areaPath, points };
  }, [salesTrendData]);

  // Top Selling products mock (uses review comments counts/rating)
  const topSellingProducts = useMemo(() => {
    if (analyticsData && analyticsData.bestSellers && analyticsData.bestSellers.length > 0) {
      return analyticsData.bestSellers;
    }
    return [...productsList]
      .sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0))
      .slice(0, 5);
  }, [productsList, analyticsData]);

  // Global search filtering logic on active tab dataset
  const filteredProducts = useMemo(() => {
    let list = [...productsList];
    if (searchTerm) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Filters Sidebar logic
    if (filterCategory) {
      list = list.filter(p => p.category?.toLowerCase() === filterCategory.toLowerCase());
    }
    if (filterBrand) {
      list = list.filter(p => p.brand?.toLowerCase() === filterBrand.toLowerCase());
    }
    if (filterStockStatus) {
      if (filterStockStatus === 'out') list = list.filter(p => p.stock === 0);
      if (filterStockStatus === 'low') list = list.filter(p => p.stock > 0 && p.stock < 5);
      if (filterStockStatus === 'good') list = list.filter(p => p.stock >= 5);
    }

    return list.sort((a, b) => {
      if (sortBy === 'newest') return b._id.localeCompare(a._id);
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'stock') return a.stock - b.stock;
      return 0;
    });
  }, [productsList, searchTerm, filterCategory, filterBrand, filterStockStatus, sortBy]);

  const filteredOrders = useMemo(() => {
    let list = [...allOrders];
    if (searchTerm) {
      list = list.filter(
        (o) =>
          o._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          o.orderStatus?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allOrders, searchTerm]);

  const filteredUsers = useMemo(() => {
    let list = [...allUsers];
    if (searchTerm) {
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [allUsers, searchTerm]);

  // Paginated elements
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalProductPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Print invoice helper
  const handlePrintInvoice = () => {
    window.print();
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className={`admin-dashboard-page-inner-content ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* TABS 1: MAIN DASHBOARD HOME */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-tab-content">
          {/* Visual Stats Cards Grid */}
          <div className="stats-cards-grid">
            <div className="stat-card green">
              <div className="card-info">
                <span>Total Revenue</span>
                <Price price={dashboardStatsComputed.totalRevenue} size="lg" />
              </div>
              <div className="icon-wrapper green-bg">₹</div>
            </div>
            <div className="stat-card purple">
              <div className="card-info">
                <span>Total Orders</span>
                <h3>{allOrders.length}</h3>
              </div>
              <div className="icon-wrapper purple-bg"><FaShoppingBag /></div>
            </div>
            <div className="stat-card blue">
              <div className="card-info">
                <span>Total Users</span>
                <h3>{allUsers.length}</h3>
              </div>
              <div className="icon-wrapper blue-bg"><FaUsers /></div>
            </div>
            <div className="stat-card orange">
              <div className="card-info">
                <span>Total Products</span>
                <h3>{productsList.length}</h3>
              </div>
              <div className="icon-wrapper orange-bg"><FaBoxOpen /></div>
            </div>
            <div className="stat-card yellow">
              <div className="card-info">
                <span>Total Categories</span>
                <h3>{categoriesState.length}</h3>
              </div>
              <div className="icon-wrapper warning-bg"><FaTags /></div>
            </div>
            <div className="stat-card danger">
              <div className="card-info">
                <span>Out of Stock</span>
                <h3>{productsList.filter(p => p.stock === 0).length}</h3>
              </div>
              <div className="icon-wrapper danger-bg"><FaTimesCircle /></div>
            </div>
            <div className="stat-card warning">
              <div className="card-info">
                <span>Low Stock (&lt; 5)</span>
                <h3>{productsList.filter(p => p.stock > 0 && p.stock < 5).length}</h3>
              </div>
              <div className="icon-wrapper warning-bg"><FaExclamationTriangle /></div>
            </div>
          </div>

          {/* Rearranged Main Row */}
          <div className="dashboard-details-row" style={{ marginTop: '24px' }}>
            {/* Recent Orders */}
            <div className="table-card" style={{ height: '100%' }}>
              <h4>Recent Orders</h4>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.slice(0, 6).map((o) => (
                    <tr key={o._id}>
                      <td><strong>{o._id.slice(-6).toUpperCase()}</strong></td>
                      <td>{o.user?.name || 'Customer'}</td>
                      <td>{formatPrice(o.totalPrice)}</td>
                      <td>
                        <span className={`status-pill ${o.orderStatus?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                          {o.orderStatus || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {allOrders.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick Actions & Inventory Summary */}
            <div className="dashboard-sidebar-column">
              <div className="table-card" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '16px' }}>Quick Actions</h4>
                <div className="quick-actions-grid">
                  <button className="btn btn-primary" onClick={handleAddProductClick}>
                    <FaPlus style={{ marginRight: '8px' }} /> Add New Product
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', parent: '' }); setCategoryModalOpen(true); }}>
                    <FaPlus style={{ marginRight: '8px' }} /> Create Category
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate('/admin/inventory')}>
                    <FaBoxOpen style={{ marginRight: '8px' }} /> Manage Stock levels
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate('/admin/profile')}>
                    <FaUsers style={{ marginRight: '8px' }} /> Update Admin Profile
                  </button>
                </div>
              </div>

              <div className="table-card" style={{ padding: '20px' }}>
                <h4 style={{ marginBottom: '16px' }}>Inventory Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>In Stock items:</span>
                    <strong>{productsList.filter(p => p.stock >= 5).length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Low stock items:</span>
                    <strong style={{ color: 'var(--rating-color)' }}>{productsList.filter(p => p.stock > 0 && p.stock < 5).length}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Out of stock items:</span>
                    <strong style={{ color: 'var(--error-color)' }}>{productsList.filter(p => p.stock === 0).length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABS 2: PRODUCT MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="tab-view-wrap">
          <div className="tab-filters-row">
            <div className="search-box-wrapper">
              <FaSearch />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters toolbar */}
            <div className="filter-controls">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Beauty">Beauty</option>
                <option value="Sports">Sports</option>
                <option value="Books">Books</option>
                <option value="Accessories">Accessories</option>
              </select>

              <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)}>
                <option value="">All Stock Levels</option>
                <option value="good">In Stock (&gt;= 5)</option>
                <option value="low">Low Stock (&lt; 5)</option>
                <option value="out">Out of Stock</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock">Low Stock First</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="toolbar-action-buttons">
              <button className="btn btn-secondary btn-icon-only" onClick={handleExportProducts} title="Export Products list to JSON">
                <FaDownload /> Export
              </button>
              <label className="btn btn-secondary btn-icon-only cursor-pointer" title="Import Products list from JSON">
                <FaUpload /> Import
                <input type="file" accept=".json" onChange={handleImportProducts} style={{ display: 'none' }} />
              </label>
              {selectedProductIds.length > 0 && (
                <button className="btn btn-orange" onClick={handleBulkDelete}>
                  <FaTrashAlt /> Delete Selected ({selectedProductIds.length})
                </button>
              )}
              <button className="btn btn-primary" onClick={handleAddProductClick}>
                <FaPlus /> Add Product
              </button>
            </div>
          </div>

          <div className="table-card card-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds(paginatedProducts.map(p => p._id));
                        } else {
                          setSelectedProductIds([]);
                        }
                      }}
                      checked={selectedProductIds.length === paginatedProducts.length && paginatedProducts.length > 0}
                    />
                  </th>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => (
                  <tr key={p._id} className={p.stock === 0 ? 'row-muted-soft' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p._id)}
                        onChange={() => handleProductSelect(p._id)}
                      />
                    </td>
                    <td>
                      <img 
                        src={p.image || '/placeholder.png'} 
                        alt={p.name} 
                        className="table-thumb-premium" 
                        onClick={() => setViewProductDetails(p)} 
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                    </td>
                    <td>
                      <div className="product-cell-name" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <strong className="cursor-pointer hover-text-primary" onClick={() => setViewProductDetails(p)} style={{ fontSize: '0.95rem' }}>
                          {p.name}
                        </strong>
                        <div className="product-badges-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                          {p.featured && <span className="admin-badge featured">Featured</span>}
                          {p.trending && <span className="admin-badge trending">Trending</span>}
                          {p.bestSeller && <span className="admin-badge bestseller">Best Seller</span>}
                          {p.newArrival && <span className="admin-badge newarrival">New Arrival</span>}
                          {p.tag && <span className="admin-badge promo-tag">{p.tag}</span>}
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>{p.brand}</td>
                    <td>
                      <div className="product-table-price">
                        {p.discountPrice ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="price-selling" style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                              {formatPrice(p.discountPrice)}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="price-original-strike" style={{ textDecoration: 'line-through', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                {formatPrice(p.price)}
                              </span>
                              <span className="price-off-badge" style={{ backgroundColor: 'rgba(231, 76, 60, 0.15)', color: 'var(--error-color)', fontSize: '0.7rem', padding: '2px 5px', borderRadius: '4px', fontWeight: '700' }}>
                                {Math.round(((p.price - p.discountPrice) / p.price) * 100)}% OFF
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="price-selling" style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                            {formatPrice(p.price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`stock-indicator-pill ${p.stock === 0 ? 'out' : p.stock < 5 ? 'low' : 'good'}`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} Units`}
                      </span>
                    </td>
                    <td><Rating value={p.rating} /></td>
                    <td>
                      <div className="actions-cell">
                        <button className="icon-btn-action view" onClick={() => setViewProductDetails(p)} title="View Info">
                          <FaEye />
                        </button>
                        <button className="icon-btn-action copy" onClick={() => handleDuplicateProduct(p)} title="Duplicate Item">
                          <FaCopy />
                        </button>
                        <button className="icon-btn-action edit" onClick={() => handleEditProductClick(p)} title="Edit Fields">
                          <FaEdit />
                        </button>
                        <button className="icon-btn-action delete" onClick={() => handleDeleteProductClick(p)} title="Delete Item">
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination bar */}
            {totalProductPages > 1 && (
              <div className="pagination-row-admin">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  <FaChevronLeft />
                </button>
                <span>Page {currentPage} of {totalProductPages}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalProductPages))} disabled={currentPage === totalProductPages}>
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABS 3: CATEGORY DIRECTORY */}
      {activeTab === 'categories' && (
        <div className="tab-view-wrap">
          <div className="tab-filters-row">
            <h3>Parent / Subcategory hierarchy</h3>
            <button className="btn btn-primary" onClick={handleAddCategoryClick}>
              <FaPlus /> Add Category
            </button>
          </div>

          <div className="table-card card-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Parent Category Group</th>
                  <th>Product Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesWithCounts.map((cat) => (
                  <tr key={cat._id}>
                    <td><strong>{cat.name}</strong></td>
                    <td><span className="parent-cat-badge">{cat.parent || 'General'}</span></td>
                    <td>{cat.count || 0} products</td>
                    <td>
                      <div className="actions-cell">
                        <button className="icon-btn-action edit" onClick={() => handleEditCategoryClick(cat)}>
                          <FaEdit />
                        </button>
                        <button className="icon-btn-action delete" onClick={() => handleDeleteCategoryClick(cat._id)}>
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABS 4: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="tab-view-wrap">
          <div className="tab-filters-row">
            <div className="search-box-wrapper">
              <FaSearch />
              <input
                type="text"
                placeholder="Search orders by customer or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card card-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Details</th>
                  <th>Ordered Date</th>
                  <th>Amount (₹)</th>
                  <th>Payment</th>
                  <th>Delivery Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o._id}>
                    <td><strong>{o._id}</strong></td>
                    <td>
                      <div className="customer-info-cell">
                        <strong>{o.user?.name || 'Customer'}</strong>
                        <span>{o.user?.email}</span>
                      </div>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><strong>{formatPrice(o.totalPrice)}</strong></td>
                    <td>
                      <span className={`status-pill ${o.isPaid ? 'paid' : 'pending'}`}>
                        {o.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${o.orderStatus?.toLowerCase() || 'pending'}`}>
                        {o.orderStatus || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <select
                          value={o.orderStatus || 'Pending'}
                          onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                          className="order-status-select"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Packed">Packed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button className="icon-btn-action view" onClick={() => setViewOrderDetails(o)} title="View items list">
                          <FaEye />
                        </button>
                        <button className="icon-btn-action invoice" onClick={() => setViewInvoiceOrder(o)} title="Generate Invoice receipt">
                          <FaFileInvoiceDollar />
                        </button>
                        <button className="icon-btn-action delete" onClick={() => handleDeleteOrderClick(o._id)} title="Delete Order">
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABS 5: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="tab-view-wrap">
          <div className="tab-filters-row">
            <div className="search-box-wrapper">
              <FaSearch />
              <input
                type="text"
                placeholder="Search user accounts by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-card card-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Initials</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <th>Orders count</th>
                  <th>Spent (₹)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="avatar-circle-tbl">{u.name.charAt(0).toUpperCase()}</div>
                    </td>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-pill-badge ${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{userOrderStats[u._id]?.count || 0} orders</td>
                    <td><strong>{formatPrice(userOrderStats[u._id]?.total || 0)}</strong></td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className={`btn btn-sm ${u.role === 'admin' ? 'btn-secondary' : 'btn-orange'}`}
                          onClick={() => handleRoleToggle(u._id, u.role)}
                        >
                          {u.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
                        </button>
                        <button className="icon-btn-action delete" onClick={() => handleDeleteUserClick(u._id)}>
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABS 6: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="tab-view-wrap">
          <div className="view-header">
            <h2>Inventory Management</h2>
            <p>Monitor real-time stock levels, low-stock alerts, and perform restocking actions</p>
          </div>

          <div className="stats-cards-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card green">
              <div className="card-info">
                <span>Total Items</span>
                <h3>{productsList.length}</h3>
              </div>
              <div className="icon-wrapper green-bg"><FaBoxOpen /></div>
            </div>
            <div className="stat-card warning">
              <div className="card-info">
                <span>Low Stock Items (&lt; 5)</span>
                <h3>{productsList.filter(p => p.stock > 0 && p.stock < 5).length}</h3>
              </div>
              <div className="icon-wrapper warning-bg"><FaExclamationTriangle /></div>
            </div>
            <div className="stat-card danger">
              <div className="card-info">
                <span>Out of Stock</span>
                <h3>{productsList.filter(p => p.stock === 0).length}</h3>
              </div>
              <div className="icon-wrapper danger-bg"><FaTimesCircle /></div>
            </div>
          </div>

          <div className="table-card card-full">
            <table className="admin-table inventory-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product</th>
                  <th style={{ width: '12%' }}>Brand</th>
                  <th style={{ width: '15%' }}>Category</th>
                  <th style={{ width: '13%' }}>Price</th>
                  <th style={{ width: '10%' }}>Stock Status</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsList.map((p) => {
                  let stockClass = 'good';
                  let stockText = `${p.stock} Units`;
                  if (p.stock === 0) {
                    stockClass = 'out';
                    stockText = 'Out of Stock';
                  } else if (p.stock < 5) {
                    stockClass = 'low';
                    stockText = `Low Stock (${p.stock})`;
                  }

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="product-table-cell" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <img 
                            src={p.image || '/placeholder.png'} 
                            alt={p.name} 
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }} 
                            onError={(e) => { e.target.src = '/placeholder.png'; }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong className="inventory-product-name" title={p.name}>
                              {p.name}
                            </strong>
                          </div>
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>{p.brand}</td>
                      <td style={{ verticalAlign: 'middle' }}>{p.category}</td>
                      <td style={{ verticalAlign: 'middle', fontWeight: '700' }}>{formatPrice(p.price)}</td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span className={`stock-indicator-pill ${stockClass}`}>
                          {stockText}
                        </span>
                      </td>
                      <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm restock-action-btn"
                          style={{ margin: 0, padding: '8px 16px', fontSize: '0.82rem', minWidth: '90px' }}
                          onClick={() => {
                            const qtyStr = window.prompt(`Enter stock quantity to add for "${p.name}":`, "10");
                            if (qtyStr !== null) {
                              const qty = parseInt(qtyStr, 10);
                              if (isNaN(qty) || qty <= 0) {
                                alert("Please enter a valid positive number.");
                              } else {
                                handleRestock(p, qty);
                              }
                            }
                          }}
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABS 7: ADMIN PROFILE */}
      {activeTab === 'profile' && (
        <div className="tab-view-wrap">
          <div className="view-header">
            <h2>Admin Profile</h2>
            <p>Manage your account credentials and password settings</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
            <div className="table-card" style={{ padding: '24px', textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-color)',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 8px' }}>{user.name}</h3>
              <span className="status-pill badge-success" style={{ display: 'inline-block', marginBottom: '16px' }}>
                🔴 Administrator
              </span>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Role:</strong> {user.role}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="table-card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px' }}>Account Information</h4>
                <form onSubmit={handleAdminProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Update Profile
                  </button>
                </form>
              </div>

              <div className="table-card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px' }}>Change Password</h4>
                <form onSubmit={handleAdminPasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={profileConfirmPassword}
                      onChange={(e) => setProfileConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCT FORM ADD/EDIT MODAL */}
      {productModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card">
            <div className="modal-header-row">
              <h3>{editingProduct ? `Edit "${editingProduct.name}"` : 'Register New Product'}</h3>
              <button className="close-modal-trigger" onClick={() => setProductModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="modal-form-grid scrollbar-styled" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '8px' }}>
              
              {/* SECTION 1: PRODUCT INFORMATION */}
              <div className="form-section">
                <div className="form-section-title">Product Information</div>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                
                <div className="form-row-two" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Brand</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apple"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock Count</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-row-two" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categoriesState.filter(c => !c.parent).map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sub Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mobiles"
                      value={productForm.subcategory}
                      onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRICING */}
              <div className="form-section" style={{ marginTop: '16px' }}>
                <div className="form-section-title">Pricing</div>
                <div className="form-row-three">
                  <div className="form-group">
                    <label>Original Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={productForm.discountPercentage}
                      onChange={(e) => setProductForm({ ...productForm, discountPercentage: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Price (₹)</label>
                    <input
                      type="number"
                      disabled
                      value={productForm.discountPrice}
                      className="disabled-input"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: IMAGES */}
              <div className="form-section" style={{ marginTop: '16px' }}>
                <div className="form-section-title">Images</div>
                <div className="form-group">
                  <label>Main Image URL</label>
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/..."
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                </div>
                <div className="form-row-two" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Additional Image 2 URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={productForm.image2}
                      onChange={(e) => setProductForm({ ...productForm, image2: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Additional Image 3 URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={productForm.image3}
                      onChange={(e) => setProductForm({ ...productForm, image3: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DESCRIPTION */}
              <div className="form-section" style={{ marginTop: '16px' }}>
                <div className="form-section-title">Description</div>
                <div className="form-group">
                  <label>Product Description</label>
                  <textarea
                    required
                    placeholder="Describe the product features, quality, and highlights..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              {/* SECTION 5: TECHNICAL SPECIFICATIONS */}
              <div className="form-section" style={{ marginTop: '16px' }}>
                <div className="form-section-title">Technical Specifications</div>
                <div className="form-row-two">
                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Titanium Grey"
                      value={productForm.color}
                      onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Size / Dimensions</label>
                    <input
                      type="text"
                      placeholder="e.g. 6.7 inches"
                      value={productForm.size}
                      onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row-two" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Weight</label>
                    <input
                      type="text"
                      placeholder="e.g. 221g"
                      value={productForm.weight}
                      onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Warranty Info</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Year Warranty"
                      value={productForm.warranty}
                      onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: PRODUCT FEATURES */}
              <div className="form-section" style={{ marginTop: '16px' }}>
                <div className="form-section-title">Product Features & Labels</div>
                <div className="form-group">
                  <label>Key Features list (comma separated)</label>
                  <input
                    type="text"
                    placeholder="A17 Pro Chip, 5x Optical Zoom, USB-C"
                    value={productForm.features}
                    onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Promotion Label (trending, best-seller, etc.)</label>
                  <input
                    type="text"
                    placeholder="e.g. trending"
                    value={productForm.tag}
                    onChange={(e) => setProductForm({ ...productForm, tag: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label style={{ marginBottom: '8px' }}>Store Visibility Badges</label>
                  <div className="tags-checkboxes-row">
                    <label className="checkbox-flex-lbl">
                      <input
                        type="checkbox"
                        checked={productForm.featured}
                        onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      />
                      <span>Featured Product</span>
                    </label>
                    <label className="checkbox-flex-lbl">
                      <input
                        type="checkbox"
                        checked={productForm.trending}
                        onChange={(e) => setProductForm({ ...productForm, trending: e.target.checked })}
                      />
                      <span>Trending Product</span>
                    </label>
                    <label className="checkbox-flex-lbl">
                      <input
                        type="checkbox"
                        checked={productForm.bestSeller}
                        onChange={(e) => setProductForm({ ...productForm, bestSeller: e.target.checked })}
                      />
                      <span>Best Seller</span>
                    </label>
                    <label className="checkbox-flex-lbl">
                      <input
                        type="checkbox"
                        checked={productForm.newArrival}
                        onChange={(e) => setProductForm({ ...productForm, newArrival: e.target.checked })}
                      />
                      <span>New Arrival</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PRODUCT VIEW DETAILS MODAL */}
      {viewProductDetails && (
        <div className="modal-backdrop">
          <div className="modal-content-card">
            <div className="modal-header-row">
              <h3>Product specs Sheet</h3>
              <button className="close-modal-trigger" onClick={() => setViewProductDetails(null)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="product-details-modal-grid scrollbar-styled" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="modal-detail-banner-row">
                <img src={viewProductDetails.image} alt={viewProductDetails.name} className="modal-detail-thumb" />
                <div className="banner-info">
                  <h4>{viewProductDetails.name}</h4>
                  <span className="brand">{viewProductDetails.brand}</span>
                  <span className="category">{viewProductDetails.category} &gt; {viewProductDetails.subcategory}</span>
                  <div className="price-box" style={{ marginTop: '10px' }}>
                    <span className="price-lbl">Price:</span>
                    <strong className="text-success">{formatPrice(viewProductDetails.discountPrice || viewProductDetails.price)}</strong>
                  </div>
                </div>
              </div>

              <div className="details-specs-table" style={{ marginTop: '20px' }}>
                <h5>Technical Information</h5>
                <div className="spec-row-flex"><span>Color:</span><strong>{viewProductDetails.color || 'N/A'}</strong></div>
                <div className="spec-row-flex"><span>Size / Screen:</span><strong>{viewProductDetails.size || 'N/A'}</strong></div>
                <div className="spec-row-flex"><span>Weight:</span><strong>{viewProductDetails.weight || 'N/A'}</strong></div>
                <div className="spec-row-flex"><span>Warranty:</span><strong>{viewProductDetails.warranty || 'N/A'}</strong></div>
                <div className="spec-row-flex"><span>Inventory Stock:</span><strong>{viewProductDetails.stock} units</strong></div>
                <div className="spec-row-flex"><span>Rating Value:</span><strong>{viewProductDetails.rating} / 5 ({viewProductDetails.numReviews || 0} reviews)</strong></div>
              </div>

              <div className="details-specs-description" style={{ marginTop: '20px' }}>
                <h5>Product Description</h5>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-light)' }}>{viewProductDetails.description}</p>
              </div>

              {viewProductDetails.features && (
                <div className="details-specs-features" style={{ marginTop: '16px' }}>
                  <h5>Highlighted Features</h5>
                  <ul className="features-bullet-list">
                    {viewProductDetails.features.split(',').map((f, idx) => (
                      <li key={idx}>{f.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-actions-row">
                <button className="btn btn-secondary" onClick={() => setViewProductDetails(null)}>Close Specs</button>
                <button className="btn btn-primary" onClick={() => { setViewProductDetails(null); handleEditProductClick(viewProductDetails); }}>Edit Fields</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PRODUCT DELETE CONFIRMATION MODAL */}
      {deleteConfirmOpen && productToDelete && (
        <div className="modal-backdrop">
          <div className="modal-content-card small">
            <div className="modal-header-row">
              <h3>Confirm Deletion</h3>
              <button className="close-modal-trigger" onClick={() => setDeleteConfirmOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="delete-confirm-body text-center" style={{ padding: '10px 0' }}>
              <img src={productToDelete.image} alt={productToDelete.name} className="confirm-delete-img" />
              <h4 style={{ margin: '14px 0 6px', fontSize: '1.05rem' }}>{productToDelete.name}</h4>
              <p className="text-danger" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                Warning: This action will mark the product as archived. Are you sure you want to proceed?
              </p>
            </div>
            <div className="modal-actions-row justify-center">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
              <button className="btn btn-orange" onClick={confirmDeleteProduct}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW ORDER ITEMS MODAL */}
      {viewOrderDetails && (
        <div className="modal-backdrop">
          <div className="modal-content-card small">
            <div className="modal-header-row">
              <h3>Order ID: {viewOrderDetails._id.slice(-8)}</h3>
              <button className="close-modal-trigger" onClick={() => setViewOrderDetails(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="order-items-compact-view">
              <h5>Items Summary ({viewOrderDetails.orderItems?.length || 0})</h5>
              <div className="order-items-list-wrapper scrollbar-styled" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px' }}>
                {viewOrderDetails.orderItems?.map((item, idx) => (
                  <div key={idx} className="order-item-compact-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <img src={item.product?.image || storeSettings.websiteLogo} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div className="order-item-details-flex" style={{ flex: 1 }}>
                      <h6 style={{ margin: '0 0 2px', fontSize: '0.8rem', fontWeight: '700' }}>{item.name}</h6>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Qty: {item.quantity} &times; {formatPrice(item.price)}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="spec-row-flex"><span>Subtotal:</span><strong>{formatPrice(viewOrderDetails.totalPrice - 500)}</strong></div>
              <div className="spec-row-flex"><span>Shipping cost:</span><strong>{formatPrice(500)}</strong></div>
              <div className="spec-row-flex" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                <span>Grand Total:</span><strong>{formatPrice(viewOrderDetails.totalPrice)}</strong>
              </div>
            </div>
            <div className="modal-actions-row">
              <button className="btn btn-secondary" onClick={() => setViewOrderDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PRINTABLE INVOICE RECEIPT MODAL */}
      {viewInvoiceOrder && (
        <div className="modal-backdrop">
          <div className="modal-content-card">
            <div className="modal-header-row no-print">
              <h3>Invoice receipt</h3>
              <div className="invoice-header-controls">
                <button className="btn btn-primary btn-sm" onClick={handlePrintInvoice}>Print / Save PDF</button>
                <button className="close-modal-trigger" onClick={() => setViewInvoiceOrder(null)} style={{ marginLeft: '12px' }}>
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="printable-invoice-wrapper" id="printable-invoice">
              <div className="invoice-header-branding">
                <div className="branding-meta">
                  <h2>{storeSettings.storeName}</h2>
                  <p>Corporate office, Bangalore, Karnataka, India</p>
                  <p>Support contact: {storeSettings.supportNumber} | {storeSettings.contactEmail}</p>
                </div>
                <div className="branding-title">
                  <h1>INVOICE RECEIPT</h1>
                  <span className="invoice-number-lbl">Order Ref: {viewInvoiceOrder._id}</span>
                </div>
              </div>

              <hr className="invoice-hr" />

              <div className="invoice-billing-details">
                <div className="billing-col">
                  <h5>Billed To:</h5>
                  <strong>{viewInvoiceOrder.user?.name || 'Valued Customer'}</strong>
                  <p>Email: {viewInvoiceOrder.user?.email}</p>
                  <p>Transaction ID: {viewInvoiceOrder.paymentResult?.id || 'Prepaid Order'}</p>
                </div>
                <div className="billing-col text-right">
                  <h5>Order Meta:</h5>
                  <p>Placed Date: {new Date(viewInvoiceOrder.createdAt).toLocaleDateString()}</p>
                  <p>Payment Mode: {viewInvoiceOrder.paymentMethod || 'UPI/Card'}</p>
                  <p>Delivery State: <strong className="text-uppercase">{viewInvoiceOrder.orderStatus || 'Pending'}</strong></p>
                </div>
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th className="text-center">Price</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoiceOrder.orderItems?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{item.name}</strong>
                        {item.brand && <span className="brand-invoice" style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Brand: {item.brand}</span>}
                      </td>
                      <td className="text-center">{formatPrice(item.price)}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right"><strong>{formatPrice(item.price * item.quantity)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-pricing-summary">
                <div className="summary-col-push"></div>
                <div className="summary-col-vals">
                  <div className="invoice-summary-row">
                    <span>Tax (GST {storeSettings.taxRate}% Included):</span>
                    <strong>{formatPrice(viewInvoiceOrder.totalPrice * 0.18)}</strong>
                  </div>
                  <div className="invoice-summary-row">
                    <span>Shipping Charges:</span>
                    <strong>{viewInvoiceOrder.totalPrice > storeSettings.freeShippingLimit ? 'FREE' : formatPrice(storeSettings.shippingCharge)}</strong>
                  </div>
                  <div className="invoice-summary-row grand-total-row" style={{ borderTop: '2px solid #333', paddingTop: '10px', marginTop: '6px' }}>
                    <span>Grand Total:</span>
                    <strong>{formatPrice(viewInvoiceOrder.totalPrice)}</strong>
                  </div>
                </div>
              </div>

              <div className="invoice-terms-footer">
                <p>Thank you for shopping at {storeSettings.storeName}!</p>
                <p>This is a computer-generated billing invoice receipt and requires no physical signatures.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. CATEGORY DIRECTORY MODAL */}
      {categoryModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card small">
            <div className="modal-header-row">
              <h3>{editingCategory ? 'Edit Category' : 'Register Category'}</h3>
              <button className="close-modal-trigger" onClick={() => setCategoryModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="modal-form-grid">
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tablets"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Parent Category</label>
                <select
                  value={categoryForm.parent || ''}
                  onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value || '' })}
                >
                  <option value="">None (Is Parent Category)</option>
                  {categoriesState.filter(c => !c.parent && c._id !== (editingCategory?._id)).map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. COUPON CREATION MODAL */}
      {couponModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content-card small">
            <div className="modal-header-row">
              <h3>{editingCoupon ? 'Edit Coupon Code' : 'Create Promo Code'}</h3>
              <button className="close-modal-trigger" onClick={() => setCouponModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCouponSubmit} className="modal-form-grid">
              <div className="form-group">
                <label>Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="SAVE40"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-row-two">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat Rate (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Minimum Purchase Requirement (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={couponForm.minPurchase}
                  onChange={(e) => setCouponForm({ ...couponForm, minPurchase: Number(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Usage Limit (Max Redemptions)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50 (Leave blank for unlimited)"
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value ? Number(e.target.value) : '' })}
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={couponForm.expiryDate}
                  onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn btn-secondary" onClick={() => setCouponModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
