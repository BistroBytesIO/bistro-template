import React, { useEffect, useState } from "react";
import { getFeaturedItems } from "../services/menuService";
import HeroSection from "../components/HeroSection";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const data = await getFeaturedItems();
        setFeaturedItems(data);
      } catch (error) {
        console.error("Failed to fetch featured items:", error);
      }
    };
    fetchFeaturedItems();
  }, []);

  return (
    <div className="bg-background w-full min-h-screen">
      <HeroSection />

      <section className="py-10 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-foreground">
          Featured Items
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded shadow p-4 flex flex-col items-center"
            >
              <img
                className="w-full h-48 object-cover rounded mb-4"
                src={item.imageUrl || "/images/placeholder.png"}
                alt={item.name}
              />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {item.name}
              </h3>
              <p className="text-gray-700 text-center mb-2">
                {item.description}
              </p>
              <p className="text-primary font-semibold mb-4">
                ${item.price.toFixed(2)}
              </p>
              <Button
                onClick={() => navigate("/menu")}
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                Start Order
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10 px-4 max-w-7xl mx-auto text-foreground">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
          <div className="md:w-1/2 mb-6 md:mb-0">
            <h2 className="text-3xl font-bold mb-4">About Bullpen Pizza</h2>
            <p className="mb-4">
              Bullpen Pizza has been serving up delicious, handcrafted pizzas to
              the local community with a passion for quality and flavor. Our
              chefs use time-honored techniques to ensure every slice has the
              perfect balance of crispy crust, tangy sauce, and mouthwatering
              toppings. From our cozy dining area to our friendly staff,
              everything we do is designed to make you feel right at home. Come
              join us for a slice—or two—and discover why we’re the talk of the
              town.
            </p>
          </div>
          <div className="md:w-1/2">
            <img
              src="pizzaria.jpg"
              alt="Restaurant Interior"
              className="w-full h-auto rounded shadow"
            />
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
          <p className="mb-2">
            Phone:
            <a href="tel:2812380872" className="underline hover:opacity-80">
              (281) 242-0190
            </a>
          </p>
          <p className="mb-4">
            Address: 14019 Southwest Fwy, Ste 204, Sugar Land, TX 77478
          </p>
          <Button className="bg-secondary text-black hover:bg-accent">
            Make a Reservation
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
