import React, { useState, useEffect } from "react";
import { getMenuItemCustomizations } from "../services/menuService";
import { Button } from "./ui/button";

const CustomizationModal = ({ menuItemId, isOpen, onClose, onAddToCart, existingCustomizations = [] }) => {
  const [menuItem, setMenuItem] = useState(null);
  const [customizations, setCustomizations] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [error, setError] = useState("");

  // For debugging
  useEffect(() => {
    console.log("Selected options updated:", selectedOptions);
  }, [selectedOptions]);

  useEffect(() => {
    if (isOpen) {
      fetchCustomizations();
    }
  }, [isOpen, menuItemId]);

  const fetchCustomizations = async () => {
    try {
      const data = await getMenuItemCustomizations(menuItemId);
      setMenuItem(data.menuItem);
      setCustomizations(data.customizations);

      // Create a map to organize customizations by group
      const customizationsByGroup = {};
      data.customizations.forEach(c => {
        if (!customizationsByGroup[c.groupName]) {
          customizationsByGroup[c.groupName] = [];
        }
        customizationsByGroup[c.groupName].push(c);
      });

      // Initialize selections based on existing customizations if editing
      const initialSelections = {};
      Object.entries(customizationsByGroup).forEach(([groupName, groupItems]) => {
        const firstItem = groupItems[0];

        if (firstItem.choiceType === 'single') {
          // For single choice, find the existing selection or use default
          const existingOption = existingCustomizations.find(ec =>
            groupItems.some(gi => gi.id === ec.id && gi.groupName === groupName)
          );

          if (existingOption) {
            initialSelections[groupName] = existingOption.id;
          } else {
            // If no existing selection, find default or use first
            const defaultOption = groupItems.find(item => item.isDefault);
            initialSelections[groupName] = defaultOption ? defaultOption.id : groupItems[0].id;
          }
        } else if (firstItem.choiceType === 'multiple') {
          // For multiple choice, initialize with existing selections
          initialSelections[groupName] = existingCustomizations
            .filter(ec => groupItems.some(gi => gi.id === ec.id && gi.groupName === groupName))
            .map(ec => ec.id);
        }
      });

      setSelectedOptions(initialSelections);
    } catch (err) {
      console.error("Failed to fetch customizations:", err);
      setError("Failed to load customizations. Please try again.");
    }
  };

  const handleOptionSelect = (customization) => {
    setSelectedOptions((prev) => {
      if (customization.choiceType === "single") {
        // For single choice items, simply replace the selection
        return {
          ...prev,
          [customization.groupName]: customization.id,
        };
      } else {
        // For multiple choice items, toggle selection
        const selectedGroup = Array.isArray(prev[customization.groupName])
          ? [...prev[customization.groupName]]
          : [];

        const isSelected = selectedGroup.includes(customization.id);

        if (isSelected) {
          // Remove if already selected
          return {
            ...prev,
            [customization.groupName]: selectedGroup.filter(id => id !== customization.id)
          };
        } else {
          // Add if not selected
          return {
            ...prev,
            [customization.groupName]: [...selectedGroup, customization.id]
          };
        }
      }
    });
  };

  const handleAddToCart = () => {
    if (!menuItem) return;

    // Gather all selected customization IDs from all groups
    let selectedCustomizationIds = [];

    // Process different groups and their selections
    Object.entries(selectedOptions).forEach(([groupName, selection]) => {
      if (Array.isArray(selection)) {
        // Multiple choice selections
        selectedCustomizationIds = [...selectedCustomizationIds, ...selection];
      } else if (selection) {
        // Single choice selection
        selectedCustomizationIds.push(selection);
      }
    });

    // Find the actual customization objects based on selected IDs
    const selectedCustomizations = customizations.filter(c =>
      selectedCustomizationIds.includes(c.id)
    );

    // Calculate total price including customizations
    const customizationsTotal = selectedCustomizations.reduce(
      (sum, c) => sum + parseFloat(c.price || 0),
      0
    );

    const totalPrice = parseFloat(menuItem.price || 0) + customizationsTotal;

    // Create the customized item
    const customizedItem = {
      id: menuItem.id,
      name: menuItem.name,
      basePrice: parseFloat(menuItem.price || 0),
      customizations: selectedCustomizations,
      totalPrice: totalPrice
    };

    // Add to cart and close the modal
    onAddToCart(customizedItem);
    onClose();
  };

  if (!isOpen) return null;

  // Group customizations by groupName for display
  const groupedCustomizations = {};
  customizations.forEach(c => {
    if (!groupedCustomizations[c.groupName]) {
      groupedCustomizations[c.groupName] = [];
    }
    groupedCustomizations[c.groupName].push(c);
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 relative w-full max-w-md mx-2 max-h-[90vh] overflow-y-auto">
        <Button
          onClick={onClose}
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
        >
          &times;
        </Button>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {menuItem && (
          <>
            <h2 className="text-xl font-bold mb-2">{menuItem.name}</h2>
            <p className="text-gray-700 mb-2">{menuItem.description}</p>
            <p className="mb-4">
              Base Price:{" "}
              <span className="font-semibold">
                ${parseFloat(menuItem.price).toFixed(2)}
              </span>
            </p>

            <div className="space-y-6 mb-6">
              {Object.entries(groupedCustomizations).map(([groupName, items]) => (
                <div key={groupName} className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">{groupName}:</h3>
                  <div className="space-y-2 pl-2">
                    {items.map((customization) => {
                      const isSingle = customization.choiceType === "single";
                      const groupSelections = selectedOptions[customization.groupName];

                      const isChecked = isSingle
                        ? groupSelections === customization.id
                        : Array.isArray(groupSelections) && groupSelections.includes(customization.id);

                      return (
                        <label
                          key={customization.id}
                          className="flex items-center space-x-3 py-1 px-2 rounded hover:bg-gray-100"
                        >
                          <input
                            type={isSingle ? "radio" : "checkbox"}
                            name={isSingle ? `group-${customization.groupName}` : undefined}
                            checked={isChecked}
                            onChange={() => handleOptionSelect(customization)}
                            className="h-5 w-5"
                          />
                          <span className="text-gray-800 flex-1">
                            {customization.name}
                            {parseFloat(customization.price) > 0 && (
                              <span className="text-sm text-primary ml-1">
                                (+ ${parseFloat(customization.price).toFixed(2)})
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              {existingCustomizations.length > 0 ? "Update Item" : "Add to Cart"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomizationModal;