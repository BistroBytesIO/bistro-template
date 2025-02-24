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
            Taste the Best Pizza in Town
          </h1>
          <p className="text-gray-700 leading-relaxed">
            At BullPen Pizza, we believe every pizza should be a
            masterpiece—hand-tossed dough, zesty sauce made from scratch, and
            only the freshest toppings. Whether you’re craving a classic
            Margherita or something a little more adventurous, we’ve got you
            covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Button
              onClick={() => navigate("/menu")}
              className="text-background font-semibold hover:bg-primary-foreground hover:text-primary"
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

        <div className="md:w-1/2 flex flex-col md:flex-row items-center gap-6 md:gap-4 mx-4">
          <img
            className="w-full md:w-1/2 object-cover rounded shadow"
            src="pizza1.jpg"
            alt="pizza"
          />
          <img
            className="w-full md:w-1/2 object-cover rounded shadow"
            src="pizza2.jpg"
            alt="pizza"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
