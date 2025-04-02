import React, { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import adminApi from "../../services/adminApi";
import { AuthContext } from "../../AuthContext";
import Modal from "react-modal";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Users, ShoppingBag, TrendingUp, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function AdminDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    isFeatured: false,
  });
  const [modalForm, setModalForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    isFeatured: false,
  });
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState({
    todayOrders: 0,
    totalRevenue: 0,
    popularItems: [],
    totalCustomers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Monthly revenue data for chart
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loadingMonthlyData, setLoadingMonthlyData] = useState(true);

  // Low stock inventory alerts
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loadingLowStock, setLoadingLowStock] = useState(true);

  // Performance statistics
  const [performanceStats, setPerformanceStats] = useState({
    averageOrderValue: 0,
    ordersByStatus: {},
    categoryPerformance: []
  });
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const menuSectionRef = useRef(null);

  useEffect(() => {
    fetchMenuItems();
    fetchDashboardStats();
    fetchMonthlyRevenue();
    fetchLowStockItems();
    fetchPerformanceStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const response = await adminApi.get('/admin/stats/dashboard');
      setDashboardStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMonthlyRevenue = async () => {
    setLoadingMonthlyData(true);
    try {
      const response = await adminApi.get('/admin/stats/revenue/monthly');
      setMonthlyRevenue(response.data);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
    } finally {
      setLoadingMonthlyData(false);
    }
  };

  const fetchLowStockItems = async () => {
    setLoadingLowStock(true);
    try {
      const response = await adminApi.get('/admin/stats/inventory/low-stock');
      setLowStockItems(response.data);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
    } finally {
      setLoadingLowStock(false);
    }
  };

  const fetchPerformanceStats = async () => {
    setLoadingPerformance(true);
    try {
      const response = await adminApi.get('/admin/stats/performance');
      setPerformanceStats(response.data);
    } catch (error) {
      console.error("Error fetching performance stats:", error);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await adminApi.get("/admin/menu");
      if (
        response.status === 401 ||
        response.request.responseURL.includes("/login")
      ) {
        console.warn("Session expired, redirecting to login...");
        logout(navigate);
        return;
      }
      setMenuItems(response.data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      logout(navigate);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleModalChange = (e) => {
    setModalForm({ ...modalForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.post("/admin/menu", form);
      toast.success("Item successfully added!");
      setForm({
        name: "",
        description: "",
        price: "",
        stockQuantity: "",
        isFeatured: false,
      });
      fetchMenuItems();
    } catch (error) {
      toast.error("Failed to add item.");
      console.error("Error adding item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClick = (item) => {
    setSelectedItem(item);
    setModalForm({
      name: item.name,
      description: item.description,
      price: item.price,
      stockQuantity: item.stockQuantity,
      isFeatured: item.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      await adminApi.put(`/admin/menu/${selectedItem.id}`, modalForm);
      toast.success("Item successfully updated!");
      setIsModalOpen(false);
      fetchMenuItems();
    } catch (error) {
      toast.error("Failed to update item.");
      console.error("Error updating item:", error);
    } finally {
      setUpdateLoading(false);
      setModalForm({
        name: "",
        description: "",
        price: "",
        stockQuantity: "",
        isFeatured: false,
      });
    }
  };

  const confirmDelete = async (item) => {
    toast(
      (t) => (
        <div>
          <p>
            Are you sure you want to delete <strong>{item.name}</strong>?
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => {
                toast.dismiss(t.id);
                deleteItem(item);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Yes, Delete
            </Button>
            <Button
              onClick={() => toast.dismiss(t.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              Cancel
            </Button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: "top-center",
      }
    );
  };

  const deleteItem = async (item) => {
    try {
      await adminApi.delete(`/admin/menu/${item.id}`);
      toast.success(`${item.name} has been deleted successfully!`);
      fetchMenuItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete the item.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Restaurant Dashboard</h1>
          <Button
            onClick={() => logout(navigate)}
            variant="outline"
            className="border-red-400 text-red-500 hover:bg-red-50"
          >
            Logout
          </Button>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today's Orders</p>
                {loadingStats ? (
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">{dashboardStats.todayOrders}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                {loadingStats ? (
                  <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">
                    ${parseFloat(dashboardStats.totalRevenue || 0).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Popular Item</p>
                {loadingStats ? (
                  <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-xl font-bold truncate">
                    {dashboardStats.popularItems && dashboardStats.popularItems.length > 0
                      ? dashboardStats.popularItems[0].name
                      : "No data"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                {loadingStats ? (
                  <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <p className="text-2xl font-bold">{dashboardStats.totalCustomers}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link to="/admin/orders" className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all border-l-4 border-primary">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Manage Orders</h3>
            <p className="text-gray-600 mb-4">View and process customer orders, mark as ready or completed.</p>
            <Button className="bg-primary text-white hover:bg-primary/90">
              View Orders
            </Button>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all border-l-4 border-amber-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Inventory Alerts</h3>
                <p className="text-gray-600">Items running low on stock</p>
              </div>
              <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-sm font-medium">
                {loadingLowStock ? "..." : `${lowStockItems.length} items`}
              </div>
            </div>

            <div className="mb-4">
              {loadingLowStock ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : lowStockItems.length > 0 ? (
                <div className="max-h-40 overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-2">Item</th>
                        <th className="pb-2">Current Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lowStockItems.slice(0, 5).map(item => (
                        <tr key={item.id}>
                          <td className="py-2 font-medium">{item.name}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.stockQuantity <= 5 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {item.stockQuantity} left
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {lowStockItems.length > 5 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      +{lowStockItems.length - 5} more items running low
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-600">
                  All items are well-stocked!
                </p>
              )}
            </div>

            <Button
              onClick={() => {
                menuSectionRef.current.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
                // Add a subtle highlight effect to draw attention
                menuSectionRef.current.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
                // Remove the highlight after a few seconds
                setTimeout(() => {
                  menuSectionRef.current.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
                }, 2000);
              }}
              className="w-full bg-primary text-white"
            >
              Manage Inventory
            </Button>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Revenue</h2>

          {loadingMonthlyData ? (
            <div className="h-64 flex items-center justify-center">
              <ClipLoader color="#4F46E5" size={40} />
            </div>
          ) : monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No monthly revenue data available</p>
            </div>
          )}
        </div>

        {/* Sales Performance Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Overview Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Sales Overview</h2>

            {loadingPerformance ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
                  <p className="text-2xl font-bold text-primary">
                    ${parseFloat(performanceStats.averageOrderValue || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Orders by Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(performanceStats.ordersByStatus || {}).map(([status, count]) => (
                      <div key={status} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                        <span className="text-sm font-medium">{status}</span>
                        <span className="text-lg font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Category Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Category Performance</h2>

            {loadingPerformance ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : performanceStats.categoryPerformance?.length > 0 ? (
              <div className="space-y-4">
                {performanceStats.categoryPerformance.map((category, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-32 mr-4">
                      <p className="font-medium truncate">{category.name}</p>
                    </div>
                    <div className="flex-1">
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-4 text-xs flex rounded bg-gray-100">
                          <div
                            style={{ width: `${category.percentage}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 w-16 text-right">
                      <p className="font-semibold">${parseFloat(category.revenue).toFixed(0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No category data available</p>
            )}
          </div>
        </div>

        {/* Menu Management */}
        <div ref={menuSectionRef} className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 pb-2 border-b">Menu Management</h2>

          {/* New Item Form */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
              <Plus size={18} className="mr-2" />
              Add New Menu Item
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Item Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <Input
                    type="number"
                    name="price"
                    placeholder="Price"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea
                  name="description"
                  placeholder="Description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <Input
                    type="number"
                    name="stockQuantity"
                    placeholder="Stock Quantity"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center h-full pt-6">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="h-4 w-4 text-primary rounded"
                  />
                  <label htmlFor="isFeatured" className="ml-2 text-gray-700">Featured Item</label>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 transition-colors"
                >
                  {loading ? <ClipLoader color="#ffffff" size={20} /> : "Add Item"}
                </Button>
              </div>
            </form>
          </div>

          {/* Menu Items List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Current Menu Items</h3>
            {Array.isArray(menuItems) && menuItems.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-800 mb-1">{item.name}</h4>
                      <span className="font-medium text-primary">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="mr-3">Stock: {item.stockQuantity}</span>
                      {item.isFeatured && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateClick(item)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Edit size={16} className="mr-1" /> Edit
                      </Button>
                      <Button
                        onClick={() => confirmDelete(item)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No menu items found. Add your first item above!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Update Item"
        className="relative bg-white w-full sm:max-w-md mx-auto mt-10 p-6 rounded shadow focus:outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50"
      >
        <h2 className="text-xl font-bold mb-4">Update Item</h2>
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <Input
              type="text"
              name="name"
              value={modalForm.name}
              onChange={handleModalChange}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              name="description"
              rows="4"
              value={modalForm.description}
              onChange={handleModalChange}
              className="w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <Input
                type="number"
                name="price"
                step="0.01"
                value={modalForm.price}
                onChange={handleModalChange}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <Input
                type="number"
                name="stockQuantity"
                value={modalForm.stockQuantity}
                onChange={handleModalChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="modal-isFeatured"
              name="isFeatured"
              checked={modalForm.isFeatured}
              onChange={(e) =>
                setModalForm({ ...modalForm, isFeatured: e.target.checked })
              }
              className="h-4 w-4 text-primary rounded"
            />
            <label htmlFor="modal-isFeatured" className="ml-2 text-gray-700">Featured Item</label>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 pt-4">
            <Button
              type="submit"
              disabled={updateLoading}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded w-full sm:w-auto"
            >
              {updateLoading ? (
                <ClipLoader color="#FAF5E4" size={20} />
              ) : (
                "Update Item"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setModalForm({
                  name: "",
                  description: "",
                  price: "",
                  stockQuantity: "",
                  isFeatured: false,
                });
                setIsModalOpen(false);
              }}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminDashboard;