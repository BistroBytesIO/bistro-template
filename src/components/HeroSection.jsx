import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ChevronRight, Clock, Star, MapPin } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();
  const [currentBg, setCurrentBg] = useState(0);

  // Background images for the hero carousel
  const backgrounds = [
    "/taqueria-hero-bg-1.jpg",
    "/taqueria-hero-bg-2.jpg",
    "/taqueria-hero-bg-3.jpg"
  ];

  // Auto rotate backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgrounds.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Quick info items for badges
  const quickInfo = [
    { icon: <Clock className="w-4 h-4" />, text: "Open Today: 6am - 10pm" },
    { icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />, text: "4.8 Rating" },
    { icon: <MapPin className="w-4 h-4" />, text: "15267 Southwest Fwy" }
  ];

  return (
    <section className="relative h-[90vh] flex items-center overflow-hidden">
      {/* Background Image Carousel */}
      {backgrounds.map((bg, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out bg-cover bg-no-repeat ${currentBg === index ? "opacity-100" : "opacity-0"
            }`}
          style={{
            backgroundImage: `url(${bg})`,
            backgroundPosition: '50% 75%' // Adjusts to show more of the bottom portion
          }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-10"></div>

      {/* Content */}
      <div className="container mx-auto px-4 z-20 relative">
        <div className="max-w-3xl">
          {/* Quick info badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {quickInfo.map((info, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm"
              >
                {info.icon}
                <span>{info.text}</span>
              </div>
            ))}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight leading-tight animate-fade-in">
            Authentic <span className="text-primary">Mexican Flavors</span> Since 2005
          </h1>

          <p className="text-white/90 text-xl md:text-2xl mb-8 max-w-2xl leading-relaxed animate-fade-in-delay">
            Savor traditional recipes made with fresh ingredients, handcrafted salsas, and the passion of our family kitchen
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/menu")}
              className="bg-primary hover:bg-primary/90 text-white text-lg px-8 py-6 rounded-md group transition-all duration-300 animate-fade-in-delay-2"
            >
              View Our Menu
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 text-lg px-8 py-6 rounded-md animate-fade-in-delay-3"
              onClick={() => window.open("tel:+12813251028")}
            >
              Make a Reservation
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-background to-transparent z-10"></div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-8 flex gap-2 z-20">
        {backgrounds.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBg(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${currentBg === index ? "bg-primary w-8" : "bg-white/50 hover:bg-white/80"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;