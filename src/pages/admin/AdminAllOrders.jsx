import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import AdminOrders from "./AdminOrders";
import AdminReadyForPickup from "./AdminReadyForPickup";

const AdminAllOrders = () => {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <div className="p-4">
      <div className="flex space-x-4 border-b pb-2 mb-4 justify-around items-center">
        <p
          className={
            activeTab === "orders"
              ? "font-bold bg-secondary px-[2%] rounded-xl"
              : "px-[2%]"
          }
          onClick={() => setActiveTab("orders")}
        >
          Pending Orders
        </p>
        <p
          className={
            activeTab === "pickup"
              ? "font-bold font-bold bg-secondary px-[2%] rounded-xl"
              : "px-[2%]"
          }
          onClick={() => setActiveTab("pickup")}
        >
          Ready For Pickup
        </p>
      </div>

      {activeTab === "orders" && (
        <div>
          <AdminOrders />
        </div>
      )}
      {activeTab === "pickup" && (
        <div>
          <AdminReadyForPickup />
        </div>
      )}
    </div>
  );
};

export default AdminAllOrders;
