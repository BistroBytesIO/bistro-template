import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { CartContext } from "../CartContext";
import { MiniCartContext } from "@/context/MiniCartContext";
import { HandPlatter, ScrollText, ShoppingCart, Utensils, Menu, X } from "lucide-react";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useContext(CartContext);
  const { openCart } = useContext(MiniCartContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Use state to track if we're on mobile vs desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Always shrink on mobile, handle dynamic shrinking on desktop
  const [isShrunk, setIsShrunk] = useState(isMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, always shrink the header
      if (mobile) {
        setIsShrunk(true);
      }
    };

    const handleScroll = () => {
      // Only do dynamic shrinking on desktop
      if (!isMobile) {
        if (window.scrollY > 80) {
          setIsShrunk(true);
        } else {
          setIsShrunk(false);
        }
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    
    // Initialize on mount
    handleResize();
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isMobile]);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Close mobile menu when changing routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full bg-primary border-b border-black z-50
        transition-all duration-300 ${isShrunk ? "h-16" : "h-28 md:h-[150px]"}`}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to={isAdminRoute ? "/admin/dashboard" : "/"} className="flex items-center">
          <img
            src="taqueria-logo.png"
            alt="Taqueria Mexicano Logo"
            className={`transition-all duration-300 rounded-2xl
              ${isShrunk ? "h-12" : "h-16 md:h-[100px]"}`}
          />
        </Link>

        {/* Mobile menu button */}
        <button 
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="text-white" size={24} />
          ) : (
            <Menu className="text-white" size={24} />
          )}
        </button>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-2">
          {isAdminRoute ? (
            <>
              <Button
                onClick={() => navigate("/admin/dashboard")}
                className="bg-secondary hover:bg-background text-black flex items-center gap-2"
              >
                Admin Dashboard
              </Button>
              <Button
                onClick={() => navigate("/admin/orders")}
                className="bg-black text-secondary hover:bg-foreground"
              >
                Manage Orders
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => navigate("/menu")}
                className="bg-secondary hover:bg-accent text-black flex items-center gap-2"
              >
                <HandPlatter />
                <span className="hidden md:inline">Order Online</span>
              </Button>

              <Button className="flex items-center gap-2 bg-black text-secondary hover:bg-black hover:text-accent">
                <Link to="/#" target="_blank" className="flex items-center gap-2">
                  <ScrollText />
                  <span className="hidden md:inline">Menu</span>
                </Link>
              </Button>

              <Button
                onClick={openCart}
                className="flex items-center gap-2 bg-black text-secondary hover:bg-black hover:text-accent"
              >
                <ShoppingCart />
                <span className="hidden md:inline">Cart</span>
                {cartCount > 0 && <p>({cartCount})</p>}
              </Button>

              <Button
                onClick={() => navigate("/checkout")}
                className="flex items-center gap-2 bg-black text-secondary hover:bg-black hover:text-accent"
              >
                <Utensils />
                <span className="hidden md:inline">Checkout</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-primary border-t border-black py-2 z-50">
          {isAdminRoute ? (
            <div className="flex flex-col gap-2 p-4">
              <Button
                onClick={() => navigate("/admin/dashboard")}
                className="bg-secondary hover:bg-background text-black w-full"
              >
                Admin Dashboard
              </Button>
              <Button
                onClick={() => navigate("/admin/orders")}
                className="bg-black text-secondary hover:bg-foreground w-full"
              >
                Manage Orders
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-4">
              <Button
                onClick={() => navigate("/menu")}
                className="bg-secondary hover:bg-accent text-black w-full"
              >
                <HandPlatter className="mr-2" />
                Order Online
              </Button>
              
              <Button 
                className="bg-black text-secondary hover:bg-black hover:text-accent w-full"
                onClick={() => window.open("/#", "_blank")}
              >
                <ScrollText className="mr-2" />
                Menu
              </Button>
              
              <Button
                onClick={openCart}
                className="bg-black text-secondary hover:bg-black hover:text-accent w-full"
              >
                <ShoppingCart className="mr-2" />
                Cart {cartCount > 0 && `(${cartCount})`}
              </Button>
              
              <Button
                onClick={() => navigate("/checkout")}
                className="bg-black text-secondary hover:bg-black hover:text-accent w-full"
              >
                <Utensils className="mr-2" />
                Checkout
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default NavBar;