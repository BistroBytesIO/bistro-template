import React, { useEffect, useState, useContext } from "react";
import { getMenuItems } from "../../services/menuService";
import { MiniCartContext } from "@/context/MiniCartContext";
import { CartContext } from "../../CartContext";
import CustomizationModal from "../../components/CustomizationModal";
import MiniCart from "../../components/MiniCart";
import { getCategories } from "../../services/CategoryService";
import { Button } from "@/components/ui/button";

const MenuPage = () => {
  const [allMenuItems, setAllMenuItems] = useState([]); // Renamed for clarity
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { addToCart, cart } = useContext(CartContext);
  const { openCart } = useContext(MiniCartContext);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch all menu items on mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const data = await getMenuItems(); // No params needed
        setAllMenuItems(data);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
      }
    };

    fetchMenuItems();
  }, []); // Empty dependency array = runs once on mount

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value || "");
  };

  const handleOpenModal = (itemId) => {
    setSelectedItemId(itemId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItemId(null);
  };

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Filter menu items locally based on selectedCategory
  const filteredMenuItems = selectedCategory
    ? allMenuItems.filter((item) => item.categoryId === parseInt(selectedCategory))
    : allMenuItems;

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-3xl font-bold mb-4 md:mb-0 text-gray-800">
            Our Menu
          </h2>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="border border-gray-300 rounded p-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded shadow p-4 flex flex-col"
            >
              {item.imageUrl && (
                <img
                  className="w-full h-48 object-cover rounded mb-4"
                  src={item.imageUrl}
                  alt={item.name}
                  onError={(e) => (e.target.src = "/images/placeholder.png")}
                />
              )}
              <h4 className="text-lg font-semibold text-gray-900">
                {item.name}
              </h4>
              <p className="text-gray-700">{item.description}</p>
              <p className="font-semibold text-primary mb-4">
                Price: ${item.price.toFixed(2)}
              </p>
              <Button
                onClick={() =>
                  item.complexItem
                    ? handleOpenModal(item.id)
                    : handleAddToCart(item)
                }
                className="mt-auto font-semibold bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                {item.complexItem ? "Customize" : "Add to Cart"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <CustomizationModal
          menuItemId={selectedItemId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default MenuPage;
