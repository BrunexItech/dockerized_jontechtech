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

  // NEW: query state for both desktop + mobile
  const [query, setQuery] = useState("");

  // Auth state
  const [isAuthed, setIsAuthed] = useState(Boolean(getAccessToken()));
  const [user, setUser] = useState(getUser());

  // Cart state
  const [cartCount, setCartCount] = useState(0);

  // Dropdown state
  const [showDropdownLinks, setShowDropdownLinks] = useState(false);

  // Refs
  const mobileSearchRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileMenuPanelRef = useRef(null);
  const firstMenuLinkRef = useRef(null);
  const dropdownRef = useRef(null);

  // Navigation links
  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Smartphones", to: "/smartphones" },
    { label: "M-Kopa Phones", to: "/mkopa" },
    { label: "Televisions", to: "/televisions" },
    { label: "Mobile Accessories", to: "/mobile-accessories" },
    { label: "Laptops", to: "/reallaptops" },
    { label: "Tablets", to: "/tablets" },
    { label: "Audio", to: "/audio" },
    { label: "Storage Devices", to: "/storage" },
  ];

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

    const onCartUpdated = (e) => {
      const count = e?.detail?.count;
      if (typeof count === "number") {
        setCartCount(count);
      } else {
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

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdownLinks(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  const handleMenuLinkClick = (to) => {
    setMobile((m) => ({ ...m, menuOpen: false }));
    navigate(to);
  };

  // NEW: central search submit
  const goSearch = () => {
    const q = (query || "").trim();
    if (!q) return;
    setMobile((m) => ({ ...m, menuOpen: false, searchOpen: false }));
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // NEW: Centralized cart click handler with login redirection
  const handleCartClick = () => {
    if (isAuthed) {
      navigate("/cart");
    } else {
      const next = encodeURIComponent("/cart");
      navigate(`/login?next=${next}`);
    }
  };

  return (
    // 👇 Made sticky on both desktop & mobile; z-40 keeps it above content (overlay is z-50)
    <header className="sticky top-0 z-40 w-full shadow-sm border-b bg-white">
      {/* Desktop Header */}
      <div className="hidden md:flex container mx-auto px-3 pt-1 pb-0 items-center justify-between bg-white">
        <img src={logo} alt="Jontech logo" className="h-40 w-auto" />

        {/* Search Bar */}
        <div className="flex flex-1 max-w-2xl mx-8 relative">
          {/* Custom dropdown button */}
          <button
            onClick={() => setShowDropdownLinks(!showDropdownLinks)}
            className="border border-blue-700 text-sm py-2 px-4 rounded-l-md focus:outline-none flex items-center justify-between w-40"
          >
            All Categories
            <span className="ml-2">▾</span>
          </button>

          <input
            type="text"
            placeholder="Search for products..."
            className="flex-1 border-t border-b border-blue-600 px-4 py-2 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
          />
          <button
            className="bg-blue-700 text-white px-4 py-2 rounded-r-md hover:bg-blue-800 transition"
            onClick={goSearch}
          >
            Search
          </button>

          {/* Dropdown links for "All Categories" */}
          {showDropdownLinks && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-50"
            >
              {navLinks.map((link) => (
                <button
                  key={link.to}
                  className="block w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => {
                    navigate(link.to);
                    setShowDropdownLinks(false);
                  }}
                >
                  {link.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top right area (Help, Account, Cart) */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <MdHeadsetMic className="text-2xl text-blue-600" />
            <div>
              <p className="text-gray-500">Need Help?</p>
              <p className="text-blue-600 font-semibold">0795299451</p>
            </div>
          </div>

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
          <button
            type="button"
            className="relative cursor-pointer"
            onClick={handleCartClick}
            aria-label="Open cart"
            title="My Cart"
          >
            <div className="relative pr-1 flex items-center space-x-2 hover:text-blue-800 transition">
              <BsCart3 className="text-2xl" />
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
          </button>
        </div>
      </div>

      {/* Desktop Navigation Menu */}
      <nav className="hidden md:block w-full border-t shadow-sm bg-white">
        <div className="container mx-auto px-4 py-2 flex flex-wrap gap-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-gray-900 hover:text-blue-600 font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Header */}
      <div className="md:hidden bg-gray-100 flex items-center justify-between px-4 py-2">
        <img src={logo} alt="Jontech Logo" className="h-10" />

        <div className="flex items-center gap-4 text-xl">
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goSearch()}
            />
            <button
              aria-label="Toggle search"
              aria-expanded={mobile.searchOpen}
              className="cursor-pointer text-blue-500 ml-auto"
              onClick={() =>
                mobile.searchOpen && query.trim()
                  ? goSearch()
                  : setMobile((m) => ({ ...m, searchOpen: !m.searchOpen }))
              }
            >
              <AiOutlineSearch />
            </button>
          </div>

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
          <button
            type="button"
            className="relative cursor-pointer"
            onClick={handleCartClick}
            aria-label="Open cart"
            title="My Cart"
          >
            <BsCart3 />
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full">
              {cartCount ?? 0}
            </span>
          </button>
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
            {navLinks.map((link, index) => (
              <PanelLink
                key={link.to}
                to={link.to}
                onSelect={handleMenuLinkClick}
                innerRef={index === 0 ? firstMenuLinkRef : null}
              >
                {link.label}
              </PanelLink>
            ))}

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
