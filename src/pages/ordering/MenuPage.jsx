import React, { useEffect, useState, useContext, useRef } from "react";
import { getMenuItems } from "../../services/menuService";
import { MiniCartContext } from "@/context/MiniCartContext";
import { CartContext } from "../../CartContext";
import CustomizationModal from "../../components/CustomizationModal";
import { getCategories } from "../../services/CategoryService";
import { Button } from "@/components/ui/button";
import { Search, Filter, ShoppingCart, Plus, Info, ChevronLeft, ChevronRight, Star, Clock, Leaf, Wheat } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

// Badge components for menu items
const SpicyBadge = () => (
  <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
    Spicy
  </span>
);

const VegetarianBadge = () => (
  <span className="bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
    <Leaf className="h-3 w-3 mr-1" />
    Vegetarian
  </span>
);

const GlutenFreeBadge = () => (
  <span className="bg-amber-100 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
    <Wheat className="h-3 w-3 mr-1" />
    Gluten-Free
  </span>
);

const MenuPage = () => {
  // Force initial scroll left on first render
  useEffect(() => {
    if (categoryScrollRef.current) {
      // Set initial scroll immediately on first render
      categoryScrollRef.current.scrollLeft = 25;

      // Also set it after a slight delay to ensure it persists
      setTimeout(() => {
        if (categoryScrollRef.current) {
          categoryScrollRef.current.scrollLeft = 25;
        }
      }, 200);
    }
  }, []);

  const [allMenuItems, setAllMenuItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    glutenFree: false,
    spicy: false,
  });

  const categoryScrollRef = useRef(null);

  const { addToCart } = useContext(CartContext);
  const { openCart } = useContext(MiniCartContext);

  // Handle horizontal category scroll
  const scrollCategory = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Fetch categories and menu items on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [categoriesData, menuItemsData] = await Promise.all([
          getCategories(),
          getMenuItems()
        ]);

        setCategories(categoriesData);
        setAllMenuItems(menuItemsData);
        setDisplayedItems(menuItemsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load menu. Please try again.");
      } finally {
        // Simulate a minimum loading time for better UX
        setTimeout(() => {
          setIsLoading(false);

          // Force a slight delay after loading to ensure DOM is fully rendered
          setTimeout(() => {
            // Reset category scroll position with a larger offset to prevent the overlap
            if (categoryScrollRef.current) {
              categoryScrollRef.current.scrollLeft = 25; // Increased initial offset
            }
          }, 50);
        }, 800);
      }
    };

    fetchData();

    // Scroll to top of page when component mounts
    window.scrollTo(0, 0);
  }, []);

  // Handle category selection scrolling
  useEffect(() => {
    if (categoryScrollRef.current && selectedCategory) {
      // Find the selected category element
      const selectedElement = categoryScrollRef.current.querySelector(
        `[data-category-id="${selectedCategory}"]`
      );

      if (selectedElement) {
        // Calculate the scroll position to center the element
        const containerWidth = categoryScrollRef.current.offsetWidth;
        const elementLeft = selectedElement.offsetLeft;
        const elementWidth = selectedElement.offsetWidth;

        // Center the element in the container
        const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);

        // Scroll to the element with a minimum value to prevent overlap
        categoryScrollRef.current.scrollTo({
          left: Math.max(25, scrollLeft), // Ensure at least 25px from the left edge
          behavior: 'smooth'
        });
      }
    }
  }, [selectedCategory]);

  // Use a resize observer to ensure proper layout after rendering
  useEffect(() => {
    // Skip if the ref isn't available yet
    if (!categoryScrollRef.current) return;

    // Create a resize observer to detect when the component dimensions change
    const resizeObserver = new ResizeObserver(() => {
      // Apply a larger initial scroll to prevent the arrow from overlapping text
      if (categoryScrollRef.current) {
        categoryScrollRef.current.scrollLeft = 25;
      }
    });

    // Start observing
    resizeObserver.observe(categoryScrollRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [categories, isLoading]); // Re-run this when categories load or loading state changes

  // Apply all filters and search
  useEffect(() => {
    if (allMenuItems.length === 0) return;

    let filtered = [...allMenuItems];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.categoryId === parseInt(selectedCategory));
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    // Apply price range
    filtered = filtered.filter(item => {
      const price = parseFloat(item.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply dietary filters (this is mock functionality - you would need real data attributes)
    if (dietaryFilters.vegetarian || dietaryFilters.glutenFree || dietaryFilters.spicy) {
      // This is just a simulation since we don't have these attributes in the data
      // In a real app, you would filter based on actual item attributes
      filtered = filtered.filter(item => {
        // Randomly assign attributes for demo purposes
        const isVegetarian = item.id % 3 === 0;
        const isGlutenFree = item.id % 4 === 0;
        const isSpicy = item.id % 5 === 0;

        if (dietaryFilters.vegetarian && !isVegetarian) return false;
        if (dietaryFilters.glutenFree && !isGlutenFree) return false;
        if (dietaryFilters.spicy && !isSpicy) return false;

        return true;
      });
    }

    setDisplayedItems(filtered);
  }, [allMenuItems, selectedCategory, searchQuery, priceRange, dietaryFilters]);

  const handleCategoryChange = (categoryId) => {
    // Convert categoryId to string to ensure consistent comparison
    setSelectedCategory(categoryId.toString());
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
    toast.success(`${item.name} added to cart!`);
  };

  const handleQuickAdd = (item) => {
    // For simple items without customization
    addToCart(item);
    toast.success(`${item.name} added to cart!`, {
      icon: '🍕',
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setPriceRange([0, 50]);
    setDietaryFilters({
      vegetarian: false,
      glutenFree: false,
      spicy: false,
    });
  };

  // Loading skeleton
  const renderSkeletons = () => {
    return Array(8).fill(0).map((_, idx) => (
      <div key={idx} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    ));
  };

  // Function to determine which badges to show (for demo)
  const getBadgesForItem = (itemId) => {
    const badges = [];
    if (itemId % 3 === 0) badges.push(<VegetarianBadge key="veg" />);
    if (itemId % 4 === 0) badges.push(<GlutenFreeBadge key="gf" />);
    if (itemId % 5 === 0) badges.push(<SpicyBadge key="spicy" />);
    return badges;
  };

  // Estimated prep time based on item complexity (mock data)
  const getEstimatedPrepTime = (item) => {
    return item.complexItem ? "20-25 min" : "15-20 min";
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with search and filters */}
      <div className="sticky top-[64px] z-30 bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search our menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-gray-300"
              >
                <Filter size={16} />
                Filters
              </Button>

              {(searchQuery || selectedCategory || dietaryFilters.vegetarian ||
                dietaryFilters.glutenFree || dietaryFilters.spicy ||
                priceRange[0] > 0 || priceRange[1] < 50) && (
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="text-primary hover:text-primary-foreground hover:bg-primary"
                  >
                    Reset
                  </Button>
                )}
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md animate-slideDown">
              <h3 className="font-medium mb-3">Filters</h3>

              <div className="flex flex-wrap gap-6">
                {/* Price Range */}
                <div className="mb-4 w-full md:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-24 accent-primary"
                    />
                    <span className="text-xs text-gray-500">to</span>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-24 accent-primary"
                    />
                  </div>
                </div>

                {/* Dietary Restrictions */}
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.vegetarian}
                      onChange={() => setDietaryFilters({ ...dietaryFilters, vegetarian: !dietaryFilters.vegetarian })}
                      className="form-checkbox rounded text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.glutenFree}
                      onChange={() => setDietaryFilters({ ...dietaryFilters, glutenFree: !dietaryFilters.glutenFree })}
                      className="form-checkbox rounded text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">Gluten-Free</span>
                  </label>

                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={dietaryFilters.spicy}
                      onChange={() => setDietaryFilters({ ...dietaryFilters, spicy: !dietaryFilters.spicy })}
                      className="form-checkbox rounded text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">Spicy</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Category scrollable menu */}
          <div className="relative mt-4">
            <button
              onClick={() => scrollCategory('left')}
              className="absolute left-2 md:left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1"
            >
              <ChevronLeft className="text-gray-600" size={20} />
            </button>

            <button
              onClick={() => scrollCategory('right')}
              className="absolute right-1 md:right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1"
            >
              <ChevronRight className="text-gray-600" size={20} />
            </button>

            <div
              ref={categoryScrollRef}
              className="flex overflow-x-auto py-2 px-14 scrollbar-hide snap-x"
            >
              <div
                onClick={() => handleCategoryChange("")}
                data-category-id=""
                className={`flex-shrink-0 px-4 py-2 ml-6 mr-1 rounded-full cursor-pointer snap-start transition-colors ${selectedCategory === "" ? "bg-red-600 text-white" : "bg-white hover:bg-gray-100"
                  }`}
              >
                All Items
              </div>

              {categories.map((category) => (
                <div
                  key={category.id}
                  data-category-id={category.id}
                  onClick={() => handleCategoryChange(category.id.toString())}
                  className={`flex-shrink-0 px-4 py-2 mx-1 rounded-full cursor-pointer snap-start transition-colors ${selectedCategory === category.id.toString() ? "bg-red-600 text-white" : "bg-white hover:bg-gray-100"
                    }`}
                >
                  {category.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-10 px-4">
        {/* Results summary & sorting */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedCategory
              ? `${categories.find(c => c.id.toString() === selectedCategory)?.name || 'Category'}`
              : 'Our Menu'
            }
            {searchQuery && <span className="text-lg font-normal ml-2 text-gray-500">results for "{searchQuery}"</span>}
          </h2>

          <div className="text-sm text-gray-500">
            {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'} found
          </div>
        </div>

        {/* Menu grid */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            renderSkeletons()
          ) : displayedItems.length > 0 ? (
            displayedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transform transition duration-200 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative">
                  <img
                    className="w-full h-48 object-cover"
                    src={item.imageUrl || "/images/placeholder.png"}
                    alt={item.name}
                    onError={(e) => (e.target.src = "/images/placeholder.png")}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    {getBadgesForItem(item.id)}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h4>
                    <div className="flex items-center text-yellow-500">
                      <Star className="fill-yellow-400 h-4 w-4" />
                      <span className="ml-1 text-sm font-medium">
                        {(4 + (item.id % 10) / 10).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-primary text-lg">
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                    <div className="flex items-center text-gray-500 text-xs">
                      <Clock size={14} className="mr-1" />
                      {getEstimatedPrepTime(item)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => item.complexItem ? handleOpenModal(item.id) : handleQuickAdd(item)}
                      className="flex-1 font-semibold bg-primary text-white hover:bg-primary-foreground hover:text-primary flex items-center justify-center gap-1.5"
                    >
                      {item.complexItem ? (
                        <>
                          Customize
                          <Info size={16} />
                        </>
                      ) : (
                        <>
                          Add to Cart
                          <Plus size={16} />
                        </>
                      )}
                    </Button>

                    {item.complexItem && (
                      <Button
                        onClick={() => handleQuickAdd(item)}
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white"
                      >
                        <ShoppingCart size={18} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-gray-500 max-w-md mb-6">
                We couldn't find any menu items that match your current filters.
                Try adjusting your search or filters to see more items.
              </p>
              <Button onClick={resetFilters} className="bg-primary text-white">
                Reset Filters
              </Button>
            </div>
          )}
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