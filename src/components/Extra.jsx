import React, { useEffect, useRef, useState } from "react";
import { MdHeadsetMic } from "react-icons/md";
import { BsCart3 } from "react-icons/bs";
import { FaRegUser } from "react-icons/fa";
import { AiOutlineSearch } from "react-icons/ai";
import { GiHamburgerMenu } from "react-icons/gi";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { getAccessToken, getUser, clearAuth } from "../api";
import api from "../api";

const Header = () => {
  const navigate = useNavigate();

  // UI state (mobile menu/search)
  const [mobile, setMobile] = useState({ menuOpen: false, searchOpen: false });

  // Auth state
  const [isAuthed, setIsAuthed] = useState(Boolean(getAccessToken()));
  const [user, setUser] = useState(getUser());

  // Cart state
  const [cartCount, setCartCount] = useState(0);

  // Refs
  const mobileSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileMenuPanelRef = useRef(null);
  const firstMenuLinkRef = useRef(null);

  // Fetch cart items
  const fetchCartCount = async () => {
    if (!isAuthed) return setCartCount(0);
    try {
      const data = await api.cart.get();
      const totalItems = (data.items || []).reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(totalItems);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [isAuthed]);

  // Sync auth from localStorage + custom event
  useEffect(() => {
    const sync = () => {
      setIsAuthed(Boolean(getAccessToken()));
      setUser(getUser());
      fetchCartCount();
    };
    sync();
    window.addEventListener("auth-changed", sync);

    // NEW: react to immediate cart updates from other pages
    const onCartUpdated = (e) => {
      const count = e?.detail?.count;
      if (typeof count === "number") {
        setCartCount(count);
      } else {
        // fallback: if event didn't include a count, refetch
        fetchCartCount();
      }
    };
    window.addEventListener("cart-updated", onCartUpdated);

    return () => {
      window.removeEventListener("auth-changed", sync);
      window.removeEventListener("cart-updated", onCartUpdated);
    };
  }, []);

  // Auto-focus the mobile search input when opened
  useEffect(() => {
    if (mobile.searchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobile.searchOpen]);

  // Prevent body scroll when mobile menu is open + focus first link
  useEffect(() => {
    if (mobile.menuOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => firstMenuLinkRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile.menuOpen]);

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  const handleMenuLinkClick = (to) => {
    setMobile((m) => ({ ...m, menuOpen: false }));
    navigate(to);
  };

  return (
    <header className="w-full shadow-sm border-b">
      {/* Desktop Header */}
      <div className="hidden md:flex container mx-auto px-3 pt-1 pb-0 items-center justify-between bg-white">
        <img src={logo} alt="Jontech logo" className="h-40 w-auto" />

        {/* Search Bar */}
        <div className="flex flex-1 max-w-2xl mx-8">
          <select className="border border-blue-700 text-sm py-2 rounded-l-md focus:outline-none">
            <option>All Categories</option>
            <option>Smartphones</option>
            <option>Airpods</option>
            <option>Headphones</option>
            <option>Chargers</option>
            <option>Television</option>
            <option>Screen Protectors</option>
            <option>Phone Covers</option>
            <option>Speakers</option>
          </select>
          <input
            type="text"
            placeholder="Search for products..."
            className="flex-1 border-t border-b border-blue-600 px-4 py-2 focus:outline-none"
          />
          <button className="bg-blue-700 text-white px-4 py-2 rounded-r-md hover:bg-blue-800 transition">
            Search
          </button>
        </div>

        {/* Top right area (Help, Account, Cart) */}
        <div className="flex items-center space-x-6 text-sm">
          {/* Help */}
          <div className="flex items-center space-x-2">
            <MdHeadsetMic className="text-2xl text-blue-600" />
            <div>
              <p className="text-gray-500">Need Help?</p>
              <p className="text-blue-600 font-semibold">0795299451</p>
            </div>
          </div>

          {/* Account (Desktop) */}
          <div className="flex items-center space-x-3">
            <FaRegUser className="text-2xl" />
            {isAuthed ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline text-gray-700">
                  {user?.username ? `Hello, ${user.username}` : user?.email ? `Hello, ${user.email}` : "Account"}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          {/* Cart (Desktop) */}
          <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
            <div className="relative pr-1 flex items-center space-x-2 hover:text-blue-800 transition">
              <BsCart3 className="text-2xl" />
              {/* Always show a numeric badge, default 0 */}
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
                {cartCount ?? 0}
              </span>
              <div className="text-sm pl-1 text-left">
                <p className="text-gray-600">My Cart</p>
                <p className="font-semibold">
                  {cartCount ?? 0} {(cartCount ?? 0) === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Menu */}
      <nav className="hidden md:block w-full border-t shadow-sm bg-white">
        <div className="container mx-auto px-4 py-2 flex flex-wrap gap-x-6">
          <Link to="" className="text-gray-900 hover:text-blue-600 font-medium">
            Home
          </Link>
          <Link to="/smartphones" className="text-gray-900 hover:text-blue-600 font-medium">
            Smart Phones
          </Link>
          <Link to="/mkopa" className="text-gray-900 hover:text-blue-600 font-medium">
            M-Kopa Phones
          </Link>
          <Link to="/televisions" className="text-gray-900 hover:text-blue-600 font-medium">
            Televisions
          </Link>
          <Link to="/mobile-accessories" className="text-gray-900 hover:text-blue-600 font-medium">
            Mobile Accessories
          </Link>

          <Link to="/reallaptops" className="text-gray-900 hover:text-blue-600 font-medium">
            Laptops
          </Link>
          <Link to="/tablets" className="text-gray-900 hover:text-blue-600 font-medium">
            Tablets
          </Link>
          <Link to="/audio" className="text-gray-900 hover:text-blue-600 font-medium">
            Audio
          </Link>
          <Link to="/storage" className="text-gray-900 hover:text-blue-600 font-medium">
            Storage Devices
          </Link>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-100 flex items-center justify-between px-4 py-2">
        <img src={logo} alt="Jontech Logo" className="h-10" />

        <div className="flex items-center gap-4 text-xl">
          {/* Search (Mobile) */}
          <div className="flex items-center relative" ref={mobileSearchRef}>
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Search..."
              aria-hidden={!mobile.searchOpen}
              className={[
                "bg-white border border-gray-300 rounded px-3 py-1 text-sm",
                "focus:outline-none focus:ring focus:border-blue-500",
                "transition-all duration-300 ease-out overflow-hidden",
                !mobile.searchOpen ? "w-0 opacity-0 pointer-events-none" : "w-36 opacity-100 mr-2",
              ].join(" ")}
            />
            <button
              aria-label="Toggle search"
              aria-expanded={mobile.searchOpen}
              className="cursor-pointer text-blue-500 ml-auto"
              onClick={() => setMobile((m) => ({ ...m, searchOpen: !m.searchOpen }))}
            >
              <AiOutlineSearch />
            </button>
          </div>

          {/* Hamburger (opens nav) */}
          <button
            className="cursor-pointer text-blue-500"
            aria-expanded={mobile.menuOpen}
            aria-controls="mobile-nav"
            onClick={() =>
              setMobile((m) => ({
                ...m,
                menuOpen: !m.menuOpen,
                searchOpen: false,
              }))
            }
          >
            <GiHamburgerMenu />
          </button>

          {/* Account (Mobile) */}
          <button
            className="cursor-pointer text-blue-500"
            onClick={() => (isAuthed ? navigate("/") : navigate("/login"))}
            aria-label="Account"
            title={isAuthed ? (user?.username || user?.email || "Account") : "Login"}
          >
            <FaRegUser />
          </button>
          {isAuthed && (
            <button
              className="text-xs px-2 py-1 border rounded-lg border-gray-300 hover:bg-gray-50"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}

          {/* Cart (Mobile) */}
          <div className="relative cursor-pointer" onClick={() => navigate("/cart")}>
            <BsCart3 />
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
              {cartCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={[
          "md:hidden fixed inset-0 z-50 transition-opacity duration-300",
          mobile.menuOpen ? "bg-black/40 opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobile.menuOpen}
      >
        <aside
          ref={mobileMenuPanelRef}
          role="dialog"
          aria-modal="true"
          className={[
            "absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-xl",
            "transition-transform duration-300 ease-out",
            mobile.menuOpen ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Jontech Logo" className="h-8" />
              <span className="text-base font-semibold">Menu</span>
            </div>
            <button
              className="text-gray-500 text-2xl leading-none hover:text-gray-700"
              aria-label="Close menu"
              onClick={() => setMobile((m) => ({ ...m, menuOpen: false }))}
            >
              ×
            </button>
          </div>

          <nav id="mobile-nav" className="px-6 py-5 space-y-1 overflow-y-auto h-[calc(100%-56px)]">
            <PanelLink to="" onSelect={handleMenuLinkClick} innerRef={firstMenuLinkRef}>
              Home
            </PanelLink>
            <PanelLink to="/smartphones" onSelect={handleMenuLinkClick}>
              Smart Phones
            </PanelLink>
            <PanelLink to="/mkopa" onSelect={handleMenuLinkClick}>
              M-Kopa Phones
            </PanelLink>
            <PanelLink to="/televisions" onSelect={handleMenuLinkClick}>
              Televisions
            </PanelLink>
            <PanelLink to="/mobile-accessories" onSelect={handleMenuLinkClick}>
              Mobile Accessories
            </PanelLink>
            <Link to="/reallaptops" className="text-gray-900 hover:text-blue-600 font-medium">
            Laptops
          </Link>
            <PanelLink to="/tablets" onSelect={handleMenuLinkClick}>
              Tablets
            </PanelLink>
            <PanelLink to="/audio" onSelect={handleMenuLinkClick}>
              Audio
            </PanelLink>
            <PanelLink to="/storage" onSelect={handleMenuLinkClick}>
              Storage Devices
            </PanelLink>

            {/* Auth shortcuts */}
            <div className="mt-6 grid grid-cols-2 gap-2">
              {isAuthed ? (
                <>
                  <button
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    onClick={() => handleMenuLinkClick("/")}
                  >
                    Account
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50"
                    onClick={() => handleMenuLinkClick("/login")}
                  >
                    Login
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => handleMenuLinkClick("/register")}
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </nav>
        </aside>
      </div>
    </header>
  );
};

const PanelLink = ({ to, onSelect, children, innerRef }) => (
  <Link
    ref={innerRef}
    to={to}
    className="block rounded-xl px-4 py-3 text-gray-900 hover:bg-blue-50 hover:text-blue-700 font-medium"
    onClick={(e) => {
      e.preventDefault();
      onSelect(to);
    }}
  >
    {children}
  </Link>
);

export default Header;


