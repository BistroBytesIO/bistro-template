import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-secondary w-full py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl font-extrabold text-gray-900">Hero Title</h1>
          <p className="text-gray-700 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
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
              href="/#"
            >
              View Full Menu
            </a>
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col md:flex-row items-center gap-6 md:gap-4">
          <img
            className="w-full md:w-1/2 object-cover rounded shadow"
            src="bistroLogo.png"
            alt="(CHANGE)"
          />
          <img
            className="w-full md:w-1/2 object-cover rounded shadow"
            src="bistroLogo.png"
            alt="(CHANGE)"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
