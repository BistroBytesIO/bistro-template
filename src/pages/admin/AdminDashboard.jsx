import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import adminApi from "../../services/adminApi";
import { AuthContext } from "../../AuthContext";
import Modal from "react-modal";
import ClipLoader from "react-spinners/ClipLoader";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

function AdminDashboard() {
  const [menuItems, setMenuItems] = useState([]);
  const [form, setForm] = useState({
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

  useEffect(() => {
    fetchMenuItems();
    // eslint-disable-next-line
  }, []);

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
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      stockQuantity: item.stockQuantity,
      isFeatured: item.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    setUpdateLoading(true);
    try {
      await adminApi.put(`/admin/menu/${selectedItem.id}`, form);
      toast.success("Item successfully updated!");
      setIsModalOpen(false);
      fetchMenuItems();
    } catch (error) {
      toast.error("Failed to update item.");
      console.error("Error updating item:", error);
    } finally {
      setUpdateLoading(false);
      setForm({
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
    <div className="min-h-screen bg-background text-foreground px-2 py-4 sm:px-6">
      <div className="max-w-xl sm:max-w-4xl mx-auto bg-white rounded shadow p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

        {/* New Item Form */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Item Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary"
          />
          <textarea
            name="description"
            placeholder="Description"
            rows="4"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary resize-none"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            name="stockQuantity"
            placeholder="Stock Quantity"
            value={form.stockQuantity}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
            />
            <label>Featured Item</label>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 w-full sm:w-auto"
          >
            {loading ? <ClipLoader color="#FAF5E4" size={20} /> : "Add Item"}
          </Button>
        </form>

        {/* Menu Items List */}
        <ul className="space-y-2 mb-6">
          {Array.isArray(menuItems) && menuItems.length > 0 ? (
            menuItems.map((item) => (
              <li
                key={item.id}
                className="border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0"
              >
                <div>
                  <span className="font-semibold mr-2">{item.name}</span>- $
                  {item.price} (Stock: {item.stockQuantity})
                  {item.isFeatured && (
                    <span className="ml-2 text-sm text-yellow-600">
                      Featured
                    </span>
                  )}
                </div>
                <div className="space-x-2">
                  <Button
                    onClick={() => handleUpdateClick(item)}
                    className="bg-primary text-white px-3 py-1 rounded"
                  >
                    Update
                  </Button>
                  <Button
                    onClick={() => confirmDelete(item)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))
          ) : (
            <p>No menu items found.</p>
          )}
        </ul>

        <Button
          onClick={() => logout(navigate)}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 w-full sm:w-auto"
        >
          Logout
        </Button>
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
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary"
          />
          <textarea
            name="description"
            rows="4"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary resize-none"
          />
          <input
            type="number"
            name="price"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            name="stockQuantity"
            value={form.stockQuantity}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-primary"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={(e) =>
                setForm({ ...form, isFeatured: e.target.checked })
              }
            />
            <label>Featured Item</label>
          </div>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <Button
              type="submit"
              disabled={updateLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto"
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
                setForm({
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
