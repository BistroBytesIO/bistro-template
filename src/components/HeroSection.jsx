import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-secondary w-full py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Discover the Flavor of Mexico
          </h1>
          <p className="text-gray-700 leading-relaxed">
            Treat your taste buds to our famous Fiesta Platter! A hearty mix of
            charbroiled chicken, beef fajitas, and sides like Mexican rice,
            refried beans, and guacamole.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Button
              onClick={() => navigate("/menu")}
              className="text-background font-semibold"
            >
              Order Now
            </Button>
            <a
              className="text-primary underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
              href="https://lacocinarestaurant.com/wp-content/uploads/2024/11/LaCocina_takeout_menu02212024.pdf"
            >
              View Full Menu
            </a>
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col md:flex-row items-center gap-6 md:gap-4">
          <img
            className="w-full md:w-1/2 object-cover rounded shadow"
            src="https://res.cloudinary.com/dsjo25xrv/image/upload/v1736985616/award-winning-fajitas-for-2_tpackk.png"
            alt="Fiesta Platter"
          />
          <img
            className="w-full md:w-1/2 object-cover rounded shadow"
            src="https://res.cloudinary.com/dsjo25xrv/image/upload/v1737062552/fiesta-fajita-packs_clm7x6.png"
            alt="Guacamole"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
