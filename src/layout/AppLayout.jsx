import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { MiniCartContext } from "@/context/MiniCartContext";
import MiniCart from "@/components/MiniCart";
import { AnimatePresence, motion } from "framer-motion";

const AppLayout = () => {
  const { isCartOpen, closeCart } = useContext(MiniCartContext);

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      {/* Update padding to be responsive: smaller on mobile, larger on desktop */}
      <main className="flex-1 pt-20 md:pt-28 lg:pt-[150px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />

      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={closeCart}
        />
      )}
      <MiniCart isOpen={isCartOpen} onClose={closeCart} />
    </div>
  );
};

export default AppLayout;
