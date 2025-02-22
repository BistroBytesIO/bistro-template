import React, { useState, useEffect } from "react";
import { getMenuItemCustomizations } from "../services/menuService";
import { Button } from "./ui/button";

const CustomizationModal = ({ menuItemId, isOpen, onClose, onAddToCart }) => {
  const [menuItem, setMenuItem] = useState(null);
  const [customizations, setCustomizations] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCustomizations();
    }
  }, [isOpen]);

  const fetchCustomizations = async () => {
    try {
      const data = await getMenuItemCustomizations(menuItemId);
      setMenuItem(data.menuItem);
      setCustomizations(data.customizations);

      const initialSelections = {};
      data.customizations.forEach((c) => {
        if (c.isDefault) {
          initialSelections[c.group] = c.id;
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
        return {
          ...prev,
          [customization.groupName]: customization.id,
        };
      }
      const selectedGroup = prev[customization.groupName] || [];
      const isSelected = selectedGroup.includes(customization.id);
      return {
        ...prev,
        [customization.groupName]: isSelected
          ? selectedGroup.filter((optId) => optId !== customization.id)
          : [...selectedGroup, customization.id],
      };
    });
  };

  const handleAddToCart = () => {
    if (!menuItem) return;

    const selectedAddOnIds = Object.values(selectedOptions).flat();
    const selectedAddOns = customizations.filter((c) =>
      selectedAddOnIds.includes(c.id)
    );

    const totalAddOnsCost = selectedAddOns.reduce(
      (sum, addOn) => sum + parseFloat(addOn.price || 0),
      0
    );

    const customizedItem = {
      id: menuItem.id,
      name: menuItem.name,
      basePrice: parseFloat(menuItem.price || 0),
      customizations: selectedAddOns,
      totalPrice: parseFloat(menuItem.price || 0) + totalAddOnsCost,
    };

    onAddToCart(customizedItem);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded shadow p-6 relative w-full max-w-md mx-2">
        <Button
          onClick={onClose}
          variant="ghost"
          className="absolute top-2 right-2"
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
                ${menuItem.price.toFixed(2)}
              </span>
            </p>

            <h3 className="text-lg font-semibold mb-2">Customizations:</h3>
            <div className="flex flex-col space-y-2 mb-4">
              {customizations.map((customization) => {
                const isSingle = customization.choiceType === "single";
                const groupSelections =
                  selectedOptions[customization.groupName] || [];

                const isChecked = isSingle
                  ? groupSelections === customization.id
                  : groupSelections.includes(customization.id);

                return (
                  <label
                    key={customization.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type={isSingle ? "radio" : "checkbox"}
                      name={
                        isSingle
                          ? `group-${customization.groupName}`
                          : undefined
                      }
                      checked={isChecked}
                      onChange={() => handleOptionSelect(customization)}
                    />
                    <span className="text-gray-800">
                      {customization.name}
                      {customization.price > 0 && (
                        <span className="text-sm text-gray-600 ml-1">
                          (+ ${customization.price.toFixed(2)})
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            <Button
              onClick={handleAddToCart}
              className="w-full bg-primary text-primary-foreground hover:opacity-90"
            >
              Add to Cart
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomizationModal;
