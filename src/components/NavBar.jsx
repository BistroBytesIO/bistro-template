import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { CartContext } from "../CartContext";
import { MiniCartContext } from "@/context/MiniCartContext";
import { HandPlatter, ScrollText, ShoppingCart, Utensils } from "lucide-react";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useContext(CartContext);
  const { openCart } = useContext(MiniCartContext);

  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const [isShrunk, setIsShrunk] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth > 768) {
        if (window.scrollY > 80) {
          setIsShrunk(true);
        } else {
          setIsShrunk(false);
        }
      } else {
        setIsShrunk(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <nav
      className={`fixed top-0 left-0 w-full bg-primary border-b border-black z-50
        transition-all duration-300 flex items-center justify-between
        ${isShrunk ? "h-16" : "h-[150px]"}`}
    >
      <div className="flex items-center pl-4">
        <Link to={isAdminRoute ? "/admin/dashboard" : "/"}>
          <img
            src="bistroLogo.png"
            alt="Bistro Logo"
            className={`transition-all duration-300
              ${isShrunk ? "h-12" : "h-[100px]"}`}
          />
        </Link>
      </div>

      <div className="flex items-center space-x-2 pr-4">
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
    </nav>
  );
};

export default NavBar;
