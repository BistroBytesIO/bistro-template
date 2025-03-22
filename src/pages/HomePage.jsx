import React, { useEffect, useState } from "react";
import { getFeaturedItems } from "../services/menuService";
import HeroSection from "../components/HeroSection";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin, Phone, ExternalLink, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const HomePage = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [testimonials] = useState([
    {
      id: 1,
      name: "Michael S.",
      rating: 5,
      comment: "The pizza crust is perfectly crispy, and their custom toppings are amazing."
    },
    {
      id: 2,
      name: "Sarah J.",
      rating: 5,
      comment: "My family orders from Bullpen Pizza every Friday night. It's become our tradition!"
    },
    {
      id: 3,
      name: "David T.",
      rating: 4,
      comment: "Fast service and always hot on arrival. Love the specialty pies!"
    }
  ]);
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
    
    // Scroll to top on page load
    window.scrollTo(0, 0);
  }, []);

  // Auto-rotate featured items
  useEffect(() => {
    if (featuredItems.length > 0) {
      const interval = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % featuredItems.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredItems.length]);

  const nextSlide = () => {
    if (featuredItems.length > 0) {
      setActiveSlide(prev => (prev + 1) % featuredItems.length);
    }
  };

  const prevSlide = () => {
    if (featuredItems.length > 0) {
      setActiveSlide(prev => (prev - 1 + featuredItems.length) % featuredItems.length);
    }
  };

  const businessHours = [
    { day: "Monday - Thursday", hours: "11:00 AM - 9:00 PM" },
    { day: "Friday - Saturday", hours: "11:00 AM - 10:00 PM" },
    { day: "Sunday", hours: "12:00 PM - 8:00 PM" }
  ];

  const renderRatingStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} 
      />
    ));
  };

  return (
    <div className="bg-background w-full min-h-screen">
      <HeroSection />

      {/* Featured Items Carousel */}
      <section className="py-16 px-4 bg-gradient-to-b from-secondary/50 to-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center text-foreground relative">
            <span className="relative z-10">Featured Menu Items</span>
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-primary rounded"></span>
          </h2>
          
          <div className="relative">
            {/* Carousel Controls */}
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
              <button 
                onClick={prevSlide}
                className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-primary" />
              </button>
            </div>
            
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
              <button 
                onClick={nextSlide}
                className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-primary" />
              </button>
            </div>
            
            <div className="overflow-hidden rounded-lg">
              <div 
                className="flex transition-transform duration-500 ease-in-out" 
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {featuredItems.map((item) => (
                  <div key={item.id} className="min-w-full px-4">
                    <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">
                      <div className="md:w-1/2 relative">
                        <img
                          className="w-full h-64 md:h-full object-cover"
                          src={item.imageUrl || "/images/placeholder.png"}
                          alt={item.name}
                        />
                        <div className="absolute top-4 left-4 bg-primary text-white text-sm font-bold px-3 py-1 rounded-full">
                          Featured
                        </div>
                      </div>
                      
                      <div className="md:w-1/2 p-8 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-3 text-gray-800">{item.name}</h3>
                        <p className="text-gray-600 mb-6">{item.description}</p>
                        <div className="flex items-center mb-6">
                          <span className="text-3xl font-bold text-primary mr-2">${item.price.toFixed(2)}</span>
                        </div>
                        <Button
                          onClick={() => navigate("/menu")}
                          className="group bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300"
                        >
                          Order Now
                          <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {featuredItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-3 h-3 rounded-full ${
                    activeSlide === index ? "bg-primary" : "bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section with Parallax */}
      <section className="py-20 px-4 bg-fixed bg-center bg-cover" style={{ backgroundImage: "url('/pizza-bg.jpg')" }}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
              <div className="md:w-1/2 mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">About Bullpen Pizza</h2>
                <p className="mb-4 text-gray-600 leading-relaxed">
                  Bullpen Pizza has been serving up delicious, handcrafted pizzas to
                  the local community since 2010. Our passion for quality and flavor means 
                  we use only the freshest ingredients and traditional techniques.
                </p>
                <p className="mb-6 text-gray-600 leading-relaxed">
                  Our chefs ensure every slice has the perfect balance of crispy crust, tangy sauce, 
                  and mouthwatering toppings. From our cozy dining area to our friendly staff,
                  everything we do is designed to make you feel right at home.
                </p>
                <Button
                  onClick={() => navigate("/menu")}
                  className="bg-primary text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Explore Our Menu
                </Button>
              </div>
              
              <div className="md:w-1/2">
                {/* Testimonials */}
                <div className="bg-secondary/70 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-800">What Our Customers Say</h3>
                  <div className="space-y-4">
                    {testimonials.map(testimonial => (
                      <div key={testimonial.id} className="bg-white rounded-lg p-4 shadow">
                        <div className="flex mb-2">
                          {renderRatingStars(testimonial.rating)}
                        </div>
                        <p className="text-gray-600 italic">"{testimonial.comment}"</p>
                        <p className="text-gray-800 font-medium mt-2">- {testimonial.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section className="bg-primary text-primary-foreground py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Visit Us Today</h2>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Map Section */}
            <div className="lg:w-3/5 bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="h-64 md:h-80 rounded-lg overflow-hidden shadow-lg mb-4">
                {/* Replace with actual Google Maps embed */}
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3467.7655685831847!2d-95.5968!3d29.6256!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDM3JzMyLjIiTiA5NcKwMzUnNDguNSJX!5e0!3m2!1sen!2sus!4v1615824458367!5m2!1sen!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                  title="Restaurant Location"
                ></iframe>
              </div>
              <div className="flex items-center mb-3">
                <MapPin className="mr-2" size={20} />
                <p>14019 Southwest Fwy, Ste 204, Sugar Land, TX 77478</p>
              </div>
              <div className="flex items-center">
                <Phone className="mr-2" size={20} />
                <a href="tel:2812420190" className="underline hover:opacity-80">
                  (281) 242-0190
                </a>
              </div>
            </div>
            
            {/* Hours & CTA Section */}
            <div className="lg:w-2/5 flex flex-col justify-between">
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm mb-4">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="mr-2" size={20} />
                  Business Hours
                </h3>
                <ul className="space-y-2">
                  {businessHours.map((schedule, index) => (
                    <li key={index} className="flex justify-between pb-2 border-b border-white/20 last:border-0">
                      <span>{schedule.day}</span>
                      <span className="font-semibold">{schedule.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-4">Ready to Order?</h3>
                <p className="mb-6">Experience our delicious menu from the comfort of your home.</p>
                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={() => navigate("/menu")}
                    className="bg-white text-primary hover:bg-secondary hover:text-primary w-full"
                  >
                    Order Online
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-white text-primary hover:bg-secondary hover:text-primary w-full"
                  >
                    Make a Reservation
                    <ExternalLink className="ml-2" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;