import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Login from "./Login";
import Register from "./Register";
/* =====================================================
   CONFIG
===================================================== */

const API_BASE_URL = "http://localhost:8080";

/* =====================================================
   SAMPLE FALLBACK DATA
===================================================== */

const FALLBACK_FUNDS = [
  {
    id: 1,
    name: "HDFC Flexi Cap Fund",
    category: "Equity",
    risk: "High",
    nav: 185.42,
    minimumInvestment: 500,
    oneYearReturn: 18.5,
    threeYearReturn: 16.2,
    description:
      "A diversified equity fund investing across large, mid and small-cap companies.",
  },
  {
    id: 2,
    name: "SBI Bluechip Fund",
    category: "Equity",
    risk: "Moderate",
    nav: 92.31,
    minimumInvestment: 500,
    oneYearReturn: 14.8,
    threeYearReturn: 13.4,
    description:
      "A large-cap equity fund focused on established and financially strong companies.",
  },
  {
    id: 3,
    name: "ICICI Prudential Balanced Advantage Fund",
    category: "Hybrid",
    risk: "Moderate",
    nav: 68.74,
    minimumInvestment: 1000,
    oneYearReturn: 12.6,
    threeYearReturn: 11.8,
    description:
      "A dynamic asset allocation fund balancing equity and debt based on market conditions.",
  },
  {
    id: 4,
    name: "Axis Small Cap Fund",
    category: "Equity",
    risk: "Very High",
    nav: 74.25,
    minimumInvestment: 500,
    oneYearReturn: 21.2,
    threeYearReturn: 19.1,
    description:
      "A small-cap focused fund targeting long-term capital appreciation.",
  },
];

/* =====================================================
   HELPERS
===================================================== */

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* =====================================================
   RAZORPAY LOADER
===================================================== */

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

/* =====================================================
   APP
===================================================== */

export default function App() {
  /* =====================================================
     LOGIN STATE
  ===================================================== */

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("jwt"),
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [showRegister, setShowRegister] = useState(false);
  /* =====================================================
     HANDLE GOOGLE OAUTH SUCCESS
  ===================================================== */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");

    if (token) {
      console.log("Google login successful");

      localStorage.setItem("jwt", token);

      setIsLoggedIn(true);

      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  /* =====================================================
     PAGE STATE
  ===================================================== */

  const [currentPage, setCurrentPage] = useState("funds");

  const [funds, setFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  /* =====================================================
     PAGINATION
  ===================================================== */

  const [currentFundPage, setCurrentFundPage] = useState(1);

  const FUNDS_PER_PAGE = 8;

  /* =====================================================
     LOAD FUNDS
  ===================================================== */

  useEffect(() => {
    loadFunds();
  }, []);

  async function loadFunds() {
    setLoading(true);
    setApiError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/funds?page=0&size=100`);

      if (!response.ok) {
        throw new Error("Unable to fetch funds");
      }

      const data = await response.json();

      const rawFunds = Array.isArray(data)
        ? data
        : data.content || data.funds || [];

      const normalized = rawFunds.map((fund) => ({
        ...fund,
        risk: fund.risk ?? fund.riskLevel ?? "",
      }));

      setFunds(normalized.length ? normalized : FALLBACK_FUNDS);
    } catch (error) {
      console.log("Using fallback fund data:", error.message);

      setFunds(FALLBACK_FUNDS);

      setApiError(
        "Unable to connect to the fund service. Showing sample data.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories = useMemo(() => {
    const values = funds.map((fund) => fund.category).filter(Boolean);

    return ["All", ...new Set(values)];
  }, [funds]);

  /* =====================================================
     FILTER + SORT
  ===================================================== */

  const filteredFunds = useMemo(() => {
    let result = [...funds];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter((fund) =>
        `${fund.name} ${fund.category} ${fund.risk}`
          .toLowerCase()
          .includes(query),
      );
    }

    if (category !== "All") {
      result = result.filter((fund) => fund.category === category);
    }

    result.sort((a, b) => {
      if (sortBy === "return") {
        return Number(b.oneYearReturn || 0) - Number(a.oneYearReturn || 0);
      }

      if (sortBy === "nav") {
        return Number(a.nav || 0) - Number(b.nav || 0);
      }

      return String(a.name || "").localeCompare(String(b.name || ""));
    });

    return result;
  }, [funds, search, category, sortBy]);

  /* =====================================================
     RESET PAGINATION
  ===================================================== */

  useEffect(() => {
    setCurrentFundPage(1);
  }, [search, category, sortBy]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.ceil(filteredFunds.length / FUNDS_PER_PAGE);

  const startIndex = (currentFundPage - 1) * FUNDS_PER_PAGE;

  const endIndex = startIndex + FUNDS_PER_PAGE;

  const paginatedFunds = filteredFunds.slice(startIndex, endIndex);

  const showingStart = filteredFunds.length === 0 ? 0 : startIndex + 1;

  const showingEnd = Math.min(endIndex, filteredFunds.length);

  function goToFundPage(page) {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentFundPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     NAVIGATION
  ===================================================== */

  function goToFunds() {
    setCurrentPage("funds");
    setSelectedFund(null);
    setProfileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openFund(fund) {
    setSelectedFund(fund);
    setCurrentPage("details");
    setProfileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openInvestment(fund) {
    setSelectedFund(fund);
    setCurrentPage("payment");
    setProfileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     OPEN ORDERS
  ===================================================== */

  function openOrders() {
    setCurrentPage("orders");
    setProfileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openOrderDetails(order) {
    setSelectedOrder(order);
    setCurrentPage("orderDetails");
    setProfileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     HEADER
  ===================================================== */

  function Header() {
    return (
      <header className="app-header">
        <div className="header-inner">
          <button className="brand" onClick={goToFunds}>
            <div className="brand-logo">I</div>

            <div className="brand-text">
              <strong>Investra</strong>
              <span>Investment Platform</span>
            </div>
          </button>

          <nav className="main-nav">
            <button
              className={`nav-link ${
                currentPage === "funds" ||
                currentPage === "details" ||
                currentPage === "payment"
                  ? "active"
                  : ""
              }`}
              onClick={goToFunds}
            >
              Explore Funds
            </button>

            <button
              className={`nav-link ${
                currentPage === "portfolio" ? "active" : ""
              }`}
              onClick={() => {
                setCurrentPage("portfolio");
                setProfileOpen(false);
              }}
            >
              My Portfolio
            </button>

            <button
              className={`nav-link ${currentPage === "orders" ? "active" : ""}`}
              onClick={openOrders}
            >
              My Orders
            </button>
          </nav>

          <div className="header-actions">
            <button
              className="theme-button"
              onClick={() => setDarkMode((value) => !value)}
              title="Toggle theme"
            >
              {darkMode ? "☀" : "☾"}
            </button>

            <div className="profile-wrapper">
              <button
                className={`profile-button ${
                  profileOpen ? "profile-active" : ""
                }`}
                onClick={() => setProfileOpen((value) => !value)}
              >
                {getInitials(currentUser?.name || currentUser?.email || "User")}
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-title">ACCOUNT</div>

                  <button
                    onClick={() => {
                      setCurrentPage("profile");
                      setProfileOpen(false);
                    }}
                  >
                    <span className="menu-icon">👤</span>
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentPage("settings");
                      setProfileOpen(false);
                    }}
                  >
                    <span className="menu-icon">⚙</span>
                    <span>Settings</span>
                  </button>

                  <div className="menu-divider" />

                  <button
                    className="signout-button"
                    onClick={() => {
                      localStorage.removeItem("jwt");
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");

                      setCurrentUser(null);
                      setIsLoggedIn(false);
                      setProfileOpen(false);
                    }}
                  >
                    <span className="menu-icon">🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  /* =====================================================
     HERO
  ===================================================== */

  function Hero() {
    return (
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-copy">
            <div className="hero-label">SMARTER INVESTING</div>

            <h1>
              Invest with
              <br />
              confidence.
            </h1>

            <p>
              Discover carefully selected mutual funds, understand their
              performance and make informed investment decisions.
            </p>
          </div>

          <div className="hero-visual">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />

            <div className="hero-chart">
              <svg viewBox="0 0 420 210">
                <defs>
                  <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7ecbff" stopOpacity="0.35" />

                    <stop offset="100%" stopColor="#7ecbff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  className="hero-area"
                  d="
                    M0 180
                    L45 165
                    L85 175
                    L125 135
                    L165 150
                    L205 110
                    L245 125
                    L285 82
                    L325 96
                    L365 55
                    L420 25
                    L420 210
                    L0 210
                    Z
                  "
                />

                <path
                  className="hero-line"
                  d="
                    M0 180
                    L45 165
                    L85 175
                    L125 135
                    L165 150
                    L205 110
                    L245 125
                    L285 82
                    L325 96
                    L365 55
                    L420 25
                  "
                />

                <circle className="hero-point" cx="420" cy="25" r="5" />
              </svg>
            </div>

            <div className="hero-floating-card">
              <span>1 YEAR RETURN</span>
              <strong>18.50%</strong>
              <small>Top performing funds</small>
            </div>

            <div className="hero-floating-dot" />
          </div>
        </div>
      </section>
    );
  }

  /* =====================================================
     FUNDS PAGE
  ===================================================== */

  function FundsPage() {
    return (
      <>
        <Hero />

        <main className="funds-section">
          <div className="section-heading">
            <div>
              <h2>Explore Funds</h2>
              <p>Choose from a range of investment opportunities.</p>
            </div>

            <div className="fund-count">{filteredFunds.length} funds</div>
          </div>

          {apiError && <div className="api-error-banner">{apiError}</div>}

          <div className="fund-controls">
            <div className="search-box">
              <span className="search-icon">⌕</span>

              <input
                type="text"
                placeholder="Search funds..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="return">Highest Return</option>
              <option value="nav">Lowest NAV</option>
            </select>
          </div>

          {loading ? (
            <div className="page-loading">
              <div className="loading-spinner" />
              <span>Loading funds...</span>
            </div>
          ) : filteredFunds.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⌕</div>

              <h3>No funds found</h3>

              <p>Try changing your search or filter.</p>
            </div>
          ) : (
            <>
              <div className="fund-grid">
                {paginatedFunds.map((fund) => (
                  <FundCard
                    key={fund.id}
                    fund={fund}
                    onView={() => openFund(fund)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination-controls">
                    <button
                      className="pagination-button"
                      disabled={currentFundPage === 1}
                      onClick={() => goToFundPage(currentFundPage - 1)}
                    >
                      ← Previous
                    </button>

                    <div className="page-numbers">
                      {Array.from(
                        {
                          length: totalPages,
                        },
                        (_, index) => index + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          className={`page-number ${
                            currentFundPage === page ? "active" : ""
                          }`}
                          onClick={() => goToFundPage(page)}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      className="pagination-button"
                      disabled={currentFundPage === totalPages}
                      onClick={() => goToFundPage(currentFundPage + 1)}
                    >
                      Next →
                    </button>
                  </div>

                  <div className="pagination-info">
                    Showing {showingStart}–{showingEnd} of{" "}
                    {filteredFunds.length} funds
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </>
    );
  }

  /* =====================================================
     FUND CARD
  ===================================================== */

  function FundCard({ fund, onView }) {
    return (
      <article className="fund-card">
        <div className="fund-card-top">
          <div className="fund-avatar">{getInitials(fund.name)}</div>

          <div className="category-badge">{fund.category || "Mutual Fund"}</div>
        </div>

        <div className="fund-name">{fund.name}</div>

        <div className="fund-meta">
          <div>
            <span>Current NAV</span>
            <strong>{formatCurrency(fund.nav)}</strong>
          </div>

          <div>
            <span>1 Year Return</span>

            <strong className="positive">
              {Number(fund.oneYearReturn || 0).toFixed(2)}%
            </strong>
          </div>
        </div>

        <button className="view-details-button" onClick={onView}>
          <span>View Details</span>
          <span className="button-arrow">→</span>
        </button>
      </article>
    );
  }

  /* =====================================================
     FUND DETAILS
  ===================================================== */

  function DetailsPage() {
    if (!selectedFund) {
      return (
        <PlaceholderPage
          icon="!"
          title="No fund selected"
          text="Please select a fund from Explore Funds."
        />
      );
    }

    const fund = selectedFund;

    return (
      <main className="details-page">
        <button className="back-button" onClick={goToFunds}>
          ← Back to Funds
        </button>

        <div className="fund-detail-header">
          <div className="fund-detail-title">
            <div className="large-fund-avatar">{getInitials(fund.name)}</div>

            <div>
              <div className="fund-detail-category">
                {fund.category} • {fund.risk || fund.riskLevel}
              </div>

              <h1>{fund.name}</h1>

              <p>
                {fund.description ||
                  "Explore the fund details and historical performance."}
              </p>
            </div>
          </div>

          <button
            className="invest-button"
            onClick={() => openInvestment(fund)}
          >
            Invest Now →
          </button>
        </div>

        <div className="detail-stats">
          <div className="stat-card">
            <span>Current NAV</span>
            <strong>{formatCurrency(fund.nav)}</strong>
          </div>

          <div className="stat-card">
            <span>Minimum Investment</span>
            <strong>
              {formatCurrency(Number(fund.minimumInvestment) || 500)}
            </strong>
          </div>

          <div className="stat-card">
            <span>1 Year Return</span>

            <strong className="positive">
              {fund.oneYearReturn != null
                ? Number(fund.oneYearReturn).toFixed(2)
                : "—"}
              %
            </strong>
          </div>

          <div className="stat-card">
            <span>Risk Level</span>
            <strong>{fund.risk || fund.riskLevel || "Moderate"}</strong>
          </div>
        </div>

        <PerformanceGraph fund={fund} />

        <div className="additional-details">
          <div>
            <span>Fund Category</span>
            <strong>{fund.category}</strong>
          </div>

          <div>
            <span>Risk Level</span>
            <strong>{fund.risk || fund.riskLevel || "Moderate"}</strong>
          </div>

          <div>
            <span>Minimum Investment</span>
            <strong>
              {formatCurrency(Number(fund.minimumInvestment) || 500)}
            </strong>
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     PERFORMANCE GRAPH
  ===================================================== */
  function PerformanceGraph({ fund }) {
    const [period, setPeriod] = useState("1Y");
    const [navHistory, setNavHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");
    const [hoverData, setHoverData] = useState(null);

    const width = 1000;
    const height = 360;

    function getDateRange(selectedPeriod) {
      const endDate = new Date();
      const startDate = new Date(endDate);

      if (selectedPeriod === "1M") {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (selectedPeriod === "6M") {
        startDate.setMonth(startDate.getMonth() - 6);
      } else if (selectedPeriod === "3Y") {
        startDate.setFullYear(startDate.getFullYear() - 3);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      return {
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      };
    }

    useEffect(() => {
      let cancelled = false;

      async function loadNavHistory() {
        if (!fund?.id) {
          setNavHistory([]);
          setHistoryError("No fund selected.");
          setHistoryLoading(false);
          return;
        }

        setHistoryLoading(true);
        setHistoryError("");
        setHoverData(null);

        try {
          const { startDate, endDate } = getDateRange(period);

          const response = await fetch(
            `${API_BASE_URL}/api/funds/${fund.id}/nav-history?startDate=${startDate}&endDate=${endDate}`,
          );

          if (!response.ok) {
            throw new Error("Unable to fetch NAV history.");
          }

          const data = await response.json();

          const rawHistory = Array.isArray(data)
            ? data
            : data.content || data.navHistory || data.history || [];

          const normalizedHistory = rawHistory
            .map((item) => ({
              date: item.navDate || item.date || item.nav_date,
              nav: Number(item.nav ?? item.value ?? item.NAV ?? 0),
            }))
            .filter((item) => item.date && Number.isFinite(item.nav))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          if (!cancelled) {
            setNavHistory(normalizedHistory);
          }
        } catch (error) {
          console.error("NAV history error:", error);

          if (!cancelled) {
            setNavHistory([]);
            setHistoryError(error.message || "Unable to load NAV history.");
          }
        } finally {
          if (!cancelled) {
            setHistoryLoading(false);
          }
        }
      }

      loadNavHistory();

      // Automatically refresh NAV history every 1 hour
      const refreshInterval = setInterval(
        () => {
          loadNavHistory();
        },
        60 * 60 * 1000,
      );

      return () => {
        cancelled = true;
        clearInterval(refreshInterval);
      };
    }, [fund?.id, period]);

    const points = navHistory.map((item) => item.nav);

    const labels = useMemo(() => {
      if (!navHistory.length) {
        return [];
      }

      const labelCount =
        period === "1M" ? 5 : period === "3Y" ? 7 : period === "1Y" ? 7 : 6;

      if (navHistory.length <= labelCount) {
        return navHistory.map((item) =>
          new Date(`${item.date}T00:00:00`).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
        );
      }

      return Array.from(
        {
          length: labelCount,
        },
        (_, index) => {
          const pointIndex = Math.round(
            index * ((navHistory.length - 1) / (labelCount - 1)),
          );

          return new Date(
            `${navHistory[pointIndex].date}T00:00:00`,
          ).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          });
        },
      );
    }, [navHistory, period]);

    if (historyLoading) {
      return (
        <section className="performance-card">
          <div className="performance-heading">
            <div>
              <div className="performance-label">PERFORMANCE</div>

              <h2>NAV Performance</h2>

              <p>Track how the fund's NAV has changed over time.</p>
            </div>

            <div className="period-buttons">
              {["1M", "6M", "1Y", "3Y"].map((item) => (
                <button
                  key={item}
                  className={`period-button ${period === item ? "active" : ""}`}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="graph-loading">
            <div className="loading-spinner" />
            <span>Loading NAV history...</span>
          </div>
        </section>
      );
    }

    if (historyError || !navHistory.length) {
      return (
        <section className="performance-card">
          <div className="performance-heading">
            <div>
              <div className="performance-label">PERFORMANCE</div>

              <h2>NAV Performance</h2>

              <p>Track how the fund's NAV has changed over time.</p>
            </div>

            <div className="period-buttons">
              {["1M", "6M", "1Y", "3Y"].map((item) => (
                <button
                  key={item}
                  className={`period-button ${period === item ? "active" : ""}`}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="graph-empty-state">
            <div className="graph-empty-icon">—</div>

            <strong>No NAV history available</strong>

            <span>
              {historyError ||
                `No NAV data is available for the selected ${period} period.`}
            </span>
          </div>
        </section>
      );
    }

    const minRaw = Math.min(...points);
    const maxRaw = Math.max(...points);

    let minValue = Math.floor((minRaw * 0.95) / 10) * 10;

    let maxValue = Math.ceil((maxRaw * 1.05) / 10) * 10;

    if (minValue === maxValue) {
      minValue = Math.floor(minRaw - 10);

      maxValue = Math.ceil(maxRaw + 10);
    }

    const valueRange = maxValue - minValue || 1;

    const coordinates = points.map((value, index) => {
      const x =
        points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;

      const y = height - ((value - minValue) / valueRange) * (height - 20);

      return {
        x,
        y,
        value,
        date: navHistory[index].date,
      };
    });

    function createSmoothPath(values) {
      if (!values.length) {
        return "";
      }

      if (values.length === 1) {
        return `M ${values[0].x} ${values[0].y}`;
      }

      let path = `M ${values[0].x} ${values[0].y}`;

      for (let i = 0; i < values.length - 1; i++) {
        const current = values[i];
        const next = values[i + 1];

        const controlX = (current.x + next.x) / 2;

        path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
      }

      return path;
    }

    const linePath = createSmoothPath(coordinates);

    const areaPath = `
    ${linePath}
    L ${coordinates[coordinates.length - 1].x} ${height}
    L ${coordinates[0].x} ${height}
    Z
  `;

    const gridValues = [
      maxValue,
      maxValue - valueRange * 0.25,
      maxValue - valueRange * 0.5,
      maxValue - valueRange * 0.75,
      minValue,
    ];

    function formatGraphCurrency(value) {
      return `₹${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    const labelIndexes = labels.map((_, index) =>
      Math.round(index * ((navHistory.length - 1) / (labels.length - 1))),
    );

    function formatGraphDate(date) {
      return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    function handleGraphMouseMove(event) {
      const svg = event.currentTarget;
      const rect = svg.getBoundingClientRect();

      const mouseX = ((event.clientX - rect.left) / rect.width) * width;

      const clampedX = Math.max(0, Math.min(width, mouseX));

      const ratio = clampedX / width;

      const exactIndex = ratio * (coordinates.length - 1);

      const nearestIndex = Math.round(exactIndex);

      const nearestPoint = coordinates[nearestIndex];

      if (!nearestPoint) {
        return;
      }

      setHoverData({
        x: nearestPoint.x,
        y: nearestPoint.y,
        value: nearestPoint.value,
        label: formatGraphDate(nearestPoint.date),
      });
    }

    function handleGraphMouseLeave() {
      setHoverData(null);
    }

    return (
      <section className="performance-card">
        <div className="performance-heading">
          <div>
            <div className="performance-label">PERFORMANCE</div>

            <h2>NAV Performance</h2>

            <p>Track how the fund's NAV has changed over time.</p>
          </div>

          <div className="period-buttons">
            {["1M", "6M", "1Y", "3Y"].map((item) => (
              <button
                key={item}
                className={`period-button ${period === item ? "active" : ""}`}
                onClick={() => setPeriod(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="graph-wrapper">
          <div className="graph-y-labels">
            {gridValues.map((value, index) => (
              <span key={index}>{formatGraphCurrency(value)}</span>
            ))}
          </div>

          <svg
            className="nav-graph"
            viewBox={`0 0 ${width} ${height + 40}`}
            preserveAspectRatio="none"
            onMouseMove={handleGraphMouseMove}
            onMouseLeave={handleGraphMouseLeave}
          >
            {gridValues.map((_, index) => {
              const y = (index / 4) * (height - 20);

              return (
                <line
                  key={index}
                  className="graph-grid-line"
                  x1="0"
                  y1={y}
                  x2={width}
                  y2={y}
                />
              );
            })}

            <path className="graph-area" d={areaPath} />

            <path className="graph-line" d={linePath} />

            {hoverData && (
              <>
                <line
                  className="graph-hover-line"
                  x1={hoverData.x}
                  y1="0"
                  x2={hoverData.x}
                  y2={height}
                />

                <circle
                  className="graph-hover-point"
                  cx={hoverData.x}
                  cy={hoverData.y}
                  r="6"
                />

                <circle
                  className="graph-hover-point-inner"
                  cx={hoverData.x}
                  cy={hoverData.y}
                  r="2.5"
                />
              </>
            )}
          </svg>

          {hoverData && (
            <div
              className="graph-tooltip"
              style={{
                left: `${Math.min(
                  Math.max((hoverData.x / width) * 100, 8),
                  92,
                )}%`,
                top: `${Math.max(8, (hoverData.y / height) * 100 - 12)}%`,
              }}
            >
              <span>{hoverData.label}</span>

              <strong>{formatGraphCurrency(hoverData.value)}</strong>
            </div>
          )}

          <div className="graph-x-labels">
            {labels.map((label, index) => {
              const pointIndex = labelIndexes[index];

              const percentage =
                navHistory.length === 1
                  ? 50
                  : (pointIndex / (navHistory.length - 1)) * 100;

              return (
                <span
                  key={`${label}-${index}`}
                  style={{
                    left: `${percentage}%`,
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="graph-help">
          Move your cursor over the graph to see the exact NAV
        </div>
      </section>
    );
  }

  /* =====================================================
     PAYMENT PAGE
  ===================================================== */

  function PaymentPage() {
    const fund = selectedFund;

    const [amount, setAmount] = useState("");
    const [paymentState, setPaymentState] = useState("idle");
    const [paymentMessage, setPaymentMessage] = useState("");

    if (!fund) {
      return (
        <PlaceholderPage
          icon="!"
          title="No investment selected"
          text="Please select a fund before investing."
        />
      );
    }

    const numericAmount = Number(amount) || 0;

    const minimumInvestment = Number(fund.minimumInvestment) || 500;

    const validAmount = numericAmount >= minimumInvestment;

    function handleAmountChange(event) {
      const value = event.target.value;

      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setAmount(value);
        setPaymentState("idle");
        setPaymentMessage("");
      }
    }

    async function handlePayment() {
      if (!validAmount) {
        setPaymentState("error");

        setPaymentMessage(
          `Minimum investment is ${formatCurrency(minimumInvestment)}.`,
        );

        return;
      }

      setPaymentState("loading");
      setPaymentMessage("");

      try {
        const razorpayLoaded = await loadRazorpay();

        if (!razorpayLoaded || !window.Razorpay) {
          throw new Error("Secure payment checkout could not be loaded.");
        }

        const idempotencyKey = "INVEST-" + crypto.randomUUID();

        /* -------------------------------------------------
           CREATE INTERNAL ORDER
        ------------------------------------------------- */

        const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            userId: String(currentUser?.id),
            fundId: String(fund.id),
            fundName: fund.name,
            amount: numericAmount,
            idempotencyKey,
          }),
        });

        const orderText = await orderResponse.text();

        let orderData = {};

        try {
          orderData = orderText ? JSON.parse(orderText) : {};
        } catch {
          orderData = {
            message: orderText,
          };
        }

        if (!orderResponse.ok) {
          throw new Error(
            orderData.message || orderData.error || "Order creation failed.",
          );
        }

        const internalOrderId = orderData.orderId;

        const razorpayOrderId = orderData.razorpayOrderId;

        if (!internalOrderId) {
          throw new Error("Order Service did not return an internal Order ID.");
        }

        if (!razorpayOrderId) {
          throw new Error("Order Service did not return a Razorpay Order ID.");
        }

        console.log("INTERNAL ORDER ID:", internalOrderId);

        console.log("RAZORPAY ORDER ID:", razorpayOrderId);

        setPaymentState("opening");

        const options = {
          key: "rzp_test_TQL7WW3J6KMWr0",

          amount: Math.round(numericAmount * 100),

          currency: "INR",

          name: "Investra",

          description: `Investment in ${fund.name}`,

          order_id: razorpayOrderId,

          prefill: {
            name: currentUser?.name || "",
            email: currentUser?.email || "",
          },

          notes: {
            userId: String(currentUser?.id),
            fundId: String(fund.id),
            fundName: fund.name,
            orderId: internalOrderId,
          },

          theme: {
            color: "#2878ce",
          },

          handler: async function (razorpayResponse) {
            try {
              setPaymentState("verifying");

              setPaymentMessage(
                "Payment completed. Verifying your transaction...",
              );

              const verifyResponse = await fetch(
                `${API_BASE_URL}/api/payments/verify`,
                {
                  method: "POST",

                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },

                  body: JSON.stringify({
                    razorpayOrderId: razorpayResponse.razorpay_order_id,

                    razorpayPaymentId: razorpayResponse.razorpay_payment_id,

                    razorpaySignature: razorpayResponse.razorpay_signature,
                  }),
                },
              );

              const verifyText = await verifyResponse.text();

              let verifyData = {};

              try {
                verifyData = verifyText ? JSON.parse(verifyText) : {};
              } catch {
                verifyData = {
                  message: verifyText,
                };
              }

              if (!verifyResponse.ok) {
                throw new Error(
                  verifyData.message ||
                    verifyData.error ||
                    "Payment verification failed.",
                );
              }

              setPaymentState("success");

              setPaymentMessage(
                `Your payment of ${formatCurrency(
                  numericAmount,
                )} was completed successfully.`,
              );

              setTimeout(() => {
                setCurrentPage("orders");

                setProfileOpen(false);

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }, 800);
            } catch (error) {
              console.error("Payment verification error:", error);

              setPaymentState("error");

              setPaymentMessage(
                error.message || "Payment verification failed.",
              );
            }
          },

          modal: {
            ondismiss: function () {
              setPaymentState("idle");
              setPaymentMessage("");
            },
          },
        };

        const razorpay = new window.Razorpay(options);

        razorpay.on("payment.failed", function (response) {
          console.error("Razorpay payment failed:", response?.error);

          setPaymentState("error");

          setPaymentMessage(
            response?.error?.description || "Payment could not be completed.",
          );
        });

        razorpay.open();
      } catch (error) {
        console.error("Payment error:", error);

        setPaymentState("error");

        setPaymentMessage(error.message || "Payment could not be started.");
      }
    }

    return (
      <main className="payment-page">
        <div className="payment-container">
          <button
            className="back-button payment-back"
            onClick={() => openFund(fund)}
          >
            ← Back to Fund Details
          </button>

          <div className="payment-intro">
            Review your investment details before proceeding to payment.
          </div>

          <section className="selected-fund-section">
            <div className="selected-fund-label">SELECTED FUND</div>

            <div className="selected-fund-header">
              <div className="large-fund-avatar">{getInitials(fund.name)}</div>

              <div className="selected-fund-info">
                <h1>{fund.name}</h1>

                <p>
                  {fund.category} • {fund.risk || fund.riskLevel}
                </p>
              </div>
            </div>

            <div className="payment-fund-stats">
              <div>
                <span>Current NAV</span>
                <strong>{formatCurrency(fund.nav)}</strong>
              </div>

              <div>
                <span>Minimum Investment</span>
                <strong>{formatCurrency(minimumInvestment)}</strong>
              </div>

              <div>
                <span>1 Year Return</span>

                <strong className="positive">
                  {Number(fund.oneYearReturn || 0).toFixed(2)}%
                </strong>
              </div>
            </div>
          </section>

          <section className="investment-section">
            <h2>Investment Amount</h2>

            <p>Enter the amount you would like to invest in this fund.</p>

            <label className="amount-label">Enter Amount (₹)</label>

            <div
              className={`amount-input-wrapper ${
                amount && !validAmount ? "amount-invalid" : ""
              }`}
            >
              <span>₹</span>

              <input
                type="text"
                inputMode="decimal"
                placeholder="Enter amount"
                value={amount}
                onChange={handleAmountChange}
                disabled={["loading", "opening", "verifying"].includes(
                  paymentState,
                )}
              />
            </div>

            {amount && !validAmount && (
              <div className="amount-validation">
                Minimum investment is {formatCurrency(minimumInvestment)}
              </div>
            )}

            <div className="investment-summary">
              <div>
                <span>Minimum investment:</span>

                <strong>{formatCurrency(minimumInvestment)}</strong>
              </div>

              <div>
                <span>Total Investment:</span>

                <strong>{formatCurrency(numericAmount)}</strong>
              </div>
            </div>

            <button
              className="payment-proceed-button"
              onClick={handlePayment}
              disabled={
                !validAmount ||
                ["loading", "opening", "verifying"].includes(paymentState)
              }
            >
              <span>
                {paymentState === "loading"
                  ? "Creating Order..."
                  : paymentState === "opening"
                    ? "Opening Payment..."
                    : paymentState === "verifying"
                      ? "Verifying Payment..."
                      : paymentState === "success"
                        ? "Payment Successful"
                        : "Proceed to Payment"}
              </span>

              <span className="payment-arrow">→</span>
            </button>

            {paymentState !== "idle" && (
              <div className={`payment-message ${paymentState}`}>
                <div className="payment-message-icon">
                  {paymentState === "success"
                    ? "✓"
                    : paymentState === "error"
                      ? "!"
                      : "•"}
                </div>

                <div>
                  <strong>
                    {paymentState === "success"
                      ? "Payment Successful"
                      : paymentState === "error"
                        ? "Payment couldn't be started"
                        : paymentState === "verifying"
                          ? "Verifying Payment"
                          : "Opening Secure Payment"}
                  </strong>

                  <p>
                    {paymentMessage || "Creating your secure payment order..."}
                  </p>

                  {paymentState === "error" && (
                    <button
                      className="payment-retry-button"
                      onClick={() => {
                        setPaymentState("idle");

                        setPaymentMessage("");
                      }}
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="secure-payment">🔒 Secure payment</div>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
     MY ORDERS
  ===================================================== */

  function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState("");
    const [orderFilter, setOrderFilter] = useState("ALL");

    useEffect(() => {
      if (currentUser?.id) {
        loadOrders();
      }
    }, [currentUser?.id]);

    async function loadOrders() {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/orders/user/${encodeURIComponent(
            String(currentUser?.id),
          )}`,
        );

        const text = await response.text();

        let data = {};

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.message || data.error || text || "Unable to load orders.",
          );
        }

        const orderList = Array.isArray(data) ? data : data.content || [];

        const enrichedOrders = await Promise.all(
          orderList.map(async (order) => {
            let payment = null;

            try {
              const paymentResponse = await fetch(
                `${API_BASE_URL}/api/payments/order/${encodeURIComponent(
                  order.orderId,
                )}`,
              );

              if (paymentResponse.ok) {
                payment = await paymentResponse.json();
              }
            } catch (error) {
              console.warn("Payment details unavailable:", error);
            }

            return {
              ...order,
              payment,
            };
          }),
        );

        enrichedOrders.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );

        setOrders(enrichedOrders);
      } catch (error) {
        console.error("Failed to load orders:", error);

        setOrdersError(error.message || "Unable to load orders.");
      } finally {
        setOrdersLoading(false);
      }
    }

    function getStatusClass(status) {
      const value = String(status || "").toUpperCase();

      if (value === "PAID" || value === "COMPLETED" || value === "SUCCESS") {
        return "order-status paid";
      }

      if (
        value === "FAILED" ||
        value === "PAYMENT_FAILED" ||
        value === "CANCELLED" ||
        value === "EXPIRED"
      ) {
        return "order-status failed";
      }

      return "order-status pending";
    }

    function getDisplayStatus(order) {
      const orderStatus = String(order.status || "").toUpperCase();

      const paymentStatus = String(order.payment?.status || "").toUpperCase();

      if (orderStatus === "COMPLETED") {
        return "COMPLETED";
      }

      if (
        orderStatus === "PAID" ||
        paymentStatus === "PAID" ||
        paymentStatus === "VERIFIED" ||
        paymentStatus === "CAPTURED"
      ) {
        return "PAID";
      }

      if (
        orderStatus === "PAYMENT_FAILED" ||
        paymentStatus === "PAYMENT_FAILED" ||
        paymentStatus === "FAILED" ||
        paymentStatus === "EXPIRED"
      ) {
        return "PAYMENT_FAILED";
      }

      if (orderStatus === "PAYMENT_CREATED" || paymentStatus === "CREATED") {
        return "PENDING";
      }

      return order.status || "PENDING";
    }

    function formatOrderDate(value) {
      if (!value) {
        return "—";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString("en-IN");
    }

    function getInvestmentName(order) {
      return order.fundName || order.fund?.name || order.fundId || "Investment";
    }

    function getFilteredOrders() {
      if (orderFilter === "ALL") {
        return orders;
      }

      return orders.filter((order) => {
        const status = getDisplayStatus(order);

        if (orderFilter === "FAILED") {
          return status === "PAYMENT_FAILED";
        }

        return status === orderFilter;
      });
    }

    const filteredOrders = getFilteredOrders();

    return (
      <main className="orders-page">
        <div className="orders-container">
          <div className="orders-page-heading">
            <div>
              <h1>My Orders</h1>

              <p>Track your investment orders</p>
            </div>
          </div>

          <div className="orders-filter-bar">
            {[
              ["ALL", "All"],
              ["PENDING", "Pending"],
              ["PAYMENT_CREATED", "Payment Created"],
              ["PAID", "Paid"],
              ["COMPLETED", "Completed"],
              ["FAILED", "Failed"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`orders-filter-button ${
                  orderFilter === value ? "active" : ""
                }`}
                onClick={() => setOrderFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {ordersLoading && (
            <div className="page-loading">
              <div className="loading-spinner" />
              <span>Loading orders...</span>
            </div>
          )}

          {!ordersLoading && ordersError && (
            <div className="empty-state">
              <div className="empty-icon">!</div>

              <h3>Unable to load orders</h3>

              <p>{ordersError}</p>

              <button className="payment-retry-button" onClick={loadOrders}>
                Try Again
              </button>
            </div>
          )}

          {!ordersLoading && !ordersError && orders.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◈</div>

              <h3>No orders yet</h3>

              <p>
                Your investment orders will appear here after you make an
                investment.
              </p>
            </div>
          )}

          {!ordersLoading &&
            !ordersError &&
            orders.length > 0 &&
            filteredOrders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">◈</div>

                <h3>No matching orders</h3>

                <p>There are no orders with the selected status.</p>
              </div>
            )}

          {!ordersLoading && !ordersError && filteredOrders.length > 0 && (
            <div className="orders-list">
              {filteredOrders.map((order) => {
                const displayStatus = getDisplayStatus(order);

                return (
                  <article
                    className="order-card"
                    key={order.id || order.orderId}
                  >
                    <div className="order-card-header">
                      <div className="order-card-title">
                        <h2>{getInvestmentName(order)}</h2>
                      </div>

                      <span className={getStatusClass(displayStatus)}>
                        {displayStatus === "PAYMENT_FAILED"
                          ? "FAILED"
                          : displayStatus}
                      </span>
                    </div>

                    <div className="order-card-details">
                      <div className="order-detail">
                        <span>Amount</span>

                        <strong>{formatCurrency(order.amount)}</strong>
                      </div>

                      <div className="order-detail">
                        <span>Order ID</span>

                        <strong>{order.orderId || "—"}</strong>
                      </div>

                      <div className="order-detail">
                        <span>Payment ID</span>

                        <strong>
                          {order.payment?.razorpayPaymentId ||
                            order.paymentId ||
                            "—"}
                        </strong>
                      </div>

                      <div className="order-detail">
                        <span>Created</span>

                        <strong>{formatOrderDate(order.createdAt)}</strong>
                      </div>
                    </div>

                    <button
                      className="order-view-link"
                      onClick={() => openOrderDetails(order)}
                    >
                      View order details
                      <span>→</span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    );
  }

  /* =====================================================
     ORDER DETAILS
  ===================================================== */

  function OrderDetailsPage() {
    const initialOrder = selectedOrder;

    const [order, setOrder] = useState(initialOrder);

    const [payment, setPayment] = useState(initialOrder?.payment || null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!initialOrder?.orderId) {
        setLoading(false);
        return;
      }

      let cancelled = false;

      const fetchLatestOrder = async () => {
        try {
          const orderResponse = await fetch(
            `${API_BASE_URL}/api/orders/${encodeURIComponent(
              initialOrder.orderId,
            )}`,
          );

          if (orderResponse.ok) {
            const latestOrder = await orderResponse.json();

            if (!cancelled) {
              setOrder(latestOrder);
            }
          }

          const paymentResponse = await fetch(
            `${API_BASE_URL}/api/payments/order/${encodeURIComponent(
              initialOrder.orderId,
            )}`,
          );

          if (paymentResponse.ok) {
            const latestPayment = await paymentResponse.json();

            if (!cancelled) {
              setPayment(latestPayment);
            }
          }
        } catch (error) {
          console.log("Failed to refresh order:", error);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

      fetchLatestOrder();

      const interval = setInterval(fetchLatestOrder, 3000);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [initialOrder?.orderId]);

    if (!order) {
      return (
        <PlaceholderPage
          icon="!"
          title="No order selected"
          text="Please select an order from My Orders."
        />
      );
    }

    const formatDate = (value) => {
      if (!value) {
        return "—";
      }

      const date = new Date(value);

      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("en-IN");
    };

    const status = String(order.status || "PENDING").toUpperCase();

    const isPaid = status === "PAID" || status === "COMPLETED";

    const isCompleted = status === "COMPLETED";

    const isVerified =
      String(payment?.status || "").toUpperCase() === "VERIFIED" || isPaid;

    return (
      <main className="order-details-page">
        <button className="back-button" onClick={openOrders}>
          ← Back to My Orders
        </button>

        <section className="order-detail-hero">
          <div>
            <h1>{order.fundName || order.fundId || "Investment"}</h1>

            <p>{order.fundId ? `Fund ID: ${order.fundId}` : ""}</p>
          </div>

          <span
            className={isPaid ? "order-status paid" : "order-status pending"}
          >
            {status}
          </span>
        </section>

        <section className="order-summary-grid">
          <div>
            <span>Amount</span>

            <strong>{formatCurrency(order.amount)}</strong>
          </div>

          <div>
            <span>Order ID</span>

            <strong>{order.orderId}</strong>
          </div>

          <div>
            <span>Payment ID</span>

            <strong>
              {payment?.razorpayPaymentId || order.paymentId || "—"}
            </strong>
          </div>

          <div>
            <span>Created</span>

            <strong>{formatDate(order.createdAt)}</strong>
          </div>
        </section>

        {isCompleted && (
          <section className="order-timeline-card">
            <div className="performance-label">INVESTMENT COMPLETED</div>

            <h2>Investment Completed ✓</h2>

            <div className="order-summary-grid">
              <div>
                <span>Fund</span>

                <strong>{order.fundName || order.fundId || "—"}</strong>
              </div>

              <div>
                <span>Investment Amount</span>

                <strong>{formatCurrency(order.amount)}</strong>
              </div>

              <div>
                <span>NAV at Execution</span>

                <strong>
                  {order.nav != null ? `₹${Number(order.nav).toFixed(2)}` : "—"}
                </strong>
              </div>

              <div>
                <span>Units Allocated</span>

                <strong>
                  {order.units != null ? Number(order.units).toFixed(6) : "—"}
                </strong>
              </div>
            </div>
          </section>
        )}

        {isPaid && !isCompleted && (
          <section className="order-timeline-card">
            <div className="performance-label">INVESTMENT PROCESSING</div>

            <h2>Your payment was successful</h2>

            <p>
              Your investment is being processed. Please wait while we allocate
              your units.
            </p>

            <div className="graph-loading">
              <div className="loading-spinner" />

              <span>Processing investment...</span>
            </div>
          </section>
        )}

        <section className="order-timeline-card">
          <div className="performance-label">ORDER HISTORY</div>

          <h2>Payment & Order Timeline</h2>

          {loading ? (
            <div className="graph-loading">
              <div className="loading-spinner" />

              <span>Loading order history...</span>
            </div>
          ) : (
            <div className="order-timeline">
              <TimelineItem
                done
                title="Order Created"
                time={formatDate(order.createdAt)}
              />

              <TimelineItem
                done={!!payment}
                title="Payment Created"
                time={formatDate(payment?.createdAt)}
              />

              <TimelineItem
                done={isVerified}
                title="Payment Verified"
                time={formatDate(payment?.verifiedAt)}
              />

              <TimelineItem
                done={isPaid}
                title="Order Paid"
                time={formatDate(order.paidAt)}
              />

              <TimelineItem
                done={isCompleted}
                title="Investment Completed"
                time={formatDate(order.completedAt || order.processedAt)}
              />
            </div>
          )}
        </section>
      </main>
    );
  }

  /* =====================================================
     TIMELINE ITEM
  ===================================================== */

  function TimelineItem({ done, title, time }) {
    return (
      <div className={`timeline-item ${done ? "done" : ""}`}>
        <div className="timeline-dot">{done ? "✓" : ""}</div>

        <div>
          <strong>{title}</strong>

          <span>{time || "Waiting"}</span>
        </div>
      </div>
    );
  }

  /* =====================================================
     PORTFOLIO
  ===================================================== */

  function PortfolioPage() {
    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
      if (currentUser?.id) {
        loadPortfolio();
      }
    }, [currentUser?.id]);

    async function loadPortfolio() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/orders/user/${encodeURIComponent(
            String(currentUser?.id),
          )}`,
        );

        const text = await response.text();

        let data = {};

        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.message || data.error || text || "Unable to load portfolio.",
          );
        }

        const orderList = Array.isArray(data) ? data : data.content || [];

        const completedOrders = orderList.filter(
          (order) => String(order.status || "").toUpperCase() === "COMPLETED",
        );

        setOrders(completedOrders);
      } catch (error) {
        console.error("Failed to load portfolio:", error);

        setError(error.message || "Unable to load portfolio.");
      } finally {
        setLoading(false);
      }
    }

    const totalInvested = orders.reduce(
      (total, order) => total + Number(order.amount || 0),
      0,
    );

    const totalUnits = orders.reduce(
      (total, order) => total + Number(order.units || 0),
      0,
    );

    const currentValue = orders.reduce(
      (total, order) =>
        total + Number(order.units || 0) * Number(order.nav || 0),
      0,
    );

    return (
      <main className="portfolio-page">
        <div className="portfolio-container">
          <div className="portfolio-page-heading">
            <div>
              <div className="performance-label">INVESTMENTS</div>

              <h1>My Portfolio</h1>

              <p>View your completed investments and holdings.</p>
            </div>
          </div>

          {loading && (
            <div className="page-loading">
              <div className="loading-spinner" />

              <span>Loading portfolio...</span>
            </div>
          )}

          {!loading && error && (
            <div className="empty-state">
              <div className="empty-icon">!</div>

              <h3>Unable to load portfolio</h3>

              <p>{error}</p>

              <button className="payment-retry-button" onClick={loadPortfolio}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◈</div>

              <h3>Your portfolio is empty</h3>

              <p>Completed investments will appear here.</p>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <>
              <section className="portfolio-summary-grid">
                <div className="portfolio-summary-card">
                  <span>Total Invested</span>

                  <strong>{formatCurrency(totalInvested)}</strong>
                </div>

                <div className="portfolio-summary-card">
                  <span>Current Value</span>

                  <strong>{formatCurrency(currentValue)}</strong>
                </div>

                <div className="portfolio-summary-card">
                  <span>Total Units</span>

                  <strong>{totalUnits.toFixed(4)}</strong>
                </div>

                <div className="portfolio-summary-card">
                  <span>Investments</span>

                  <strong>{orders.length}</strong>
                </div>
              </section>

              <section className="portfolio-holdings-section">
                <div className="performance-label">HOLDINGS</div>

                <h2>Your Investments</h2>

                <div className="portfolio-holdings-list">
                  {orders.map((order) => {
                    const invested = Number(order.amount || 0);

                    const units = Number(order.units || 0);

                    const nav = Number(order.nav || 0);

                    const value = units * nav;

                    return (
                      <article
                        className="portfolio-holding-card"
                        key={order.id || order.orderId}
                      >
                        <div className="portfolio-holding-header">
                          <div>
                            <h3>
                              {order.fundName || order.fundId || "Investment"}
                            </h3>

                            <p>Fund ID: {order.fundId || "—"}</p>
                          </div>

                          <span className="order-status paid">COMPLETED</span>
                        </div>

                        <div className="portfolio-holding-details">
                          <div>
                            <span>Invested</span>

                            <strong>{formatCurrency(invested)}</strong>
                          </div>

                          <div>
                            <span>Units</span>

                            <strong>{units.toFixed(4)}</strong>
                          </div>

                          <div>
                            <span>NAV</span>

                            <strong>{formatCurrency(nav)}</strong>
                          </div>

                          <div>
                            <span>Current Value</span>

                            <strong>{formatCurrency(value)}</strong>
                          </div>
                        </div>

                        <div className="portfolio-holding-footer">
                          <span>Order ID: {order.orderId || "—"}</span>

                          <span>
                            Completed:{" "}
                            {order.completedAt
                              ? new Date(order.completedAt).toLocaleString(
                                  "en-IN",
                                )
                              : "—"}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    );
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  function ProfilePage() {
    const profileKey = `profileData_${currentUser?.id}`;

    const savedProfile = JSON.parse(localStorage.getItem(profileKey) || "{}");

    const [isEditing, setIsEditing] = useState(false);

    const [profile, setProfile] = useState({
      name: savedProfile.name || currentUser?.name || "User",

      email: savedProfile.email || currentUser?.email || "user@example.com",

      phone: savedProfile.phone || "+91 XXXXX XXXXX",
    });

    const [editProfile, setEditProfile] = useState(profile);

    function handleEdit() {
      setEditProfile(profile);
      setIsEditing(true);
    }

    function handleCancel() {
      setEditProfile(profile);
      setIsEditing(false);
    }

    function handleChange(event) {
      const { name, value } = event.target;

      setEditProfile((previous) => ({
        ...previous,
        [name]: value,
      }));
    }

    function handleSave() {
      setProfile(editProfile);

      localStorage.setItem(profileKey, JSON.stringify(editProfile));

      setIsEditing(false);
    }
    return (
      <main className="profile-page">
        <div className="profile-container">
          <div className="profile-page-heading">
            <div>
              <div className="performance-label">ACCOUNT</div>

              <h1>My Profile</h1>

              <p>Manage your personal account information.</p>
            </div>
          </div>

          <section className="profile-card">
            <div className="profile-avatar">👤</div>

            <div className="profile-main-info">
              <h2>{profile.name}</h2>

              <span className="profile-account-status">Active Account</span>
            </div>

            {!isEditing && (
              <button className="profile-edit-button" onClick={handleEdit}>
                ✎ Edit Profile
              </button>
            )}
          </section>

          <section className="profile-details-card">
            <div className="profile-section-title">
              <div>
                <h2>Personal Information</h2>

                <p>Your registered account details</p>
              </div>

              {!isEditing && (
                <button
                  className="profile-edit-button secondary"
                  onClick={handleEdit}
                >
                  Edit
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="profile-details-grid">
                <div className="profile-detail-item">
                  <span>Full Name</span>

                  <strong>{profile.name}</strong>
                </div>

                <div className="profile-detail-item">
                  <span>User ID</span>

                  <strong>{currentUser?.id || "—"}</strong>
                </div>

                <div className="profile-detail-item">
                  <span>Email</span>

                  <strong>{profile.email}</strong>
                </div>

                <div className="profile-detail-item">
                  <span>Phone Number</span>

                  <strong>{profile.phone}</strong>
                </div>

                <div className="profile-detail-item">
                  <span>Account Status</span>

                  <strong>Active</strong>
                </div>

                <div className="profile-detail-item">
                  <span>Member Since</span>

                  <strong>2026</strong>
                </div>
              </div>
            ) : (
              <div className="profile-edit-form">
                <div className="profile-form-group">
                  <label>Full Name</label>

                  <input
                    type="text"
                    name="name"
                    value={editProfile.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="profile-form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={editProfile.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="profile-form-group">
                  <label>Phone Number</label>

                  <input
                    type="tel"
                    name="phone"
                    value={editProfile.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="profile-form-group">
                  <label>User ID</label>

                  <input type="text" value={currentUser?.id || ""} disabled />

                  <small>User ID cannot be changed.</small>
                </div>

                <div className="profile-form-actions">
                  <button
                    className="profile-cancel-button"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>

                  <button className="profile-save-button" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="profile-security-card">
            <div>
              <h2>Account Security</h2>

              <p>Your account is protected with secure authentication.</p>
            </div>

            <span className="security-badge">🔒 Secure</span>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
     SETTINGS
  ===================================================== */

  function SettingsPage() {
    const [emailNotifications, setEmailNotifications] = useState(true);

    const [investmentNotifications, setInvestmentNotifications] =
      useState(true);

    const [paymentNotifications, setPaymentNotifications] = useState(true);

    function handleSignOut() {
      localStorage.removeItem("jwt");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setCurrentUser(null);
      setIsLoggedIn(false);
    }

    return (
      <main className="settings-page">
        <div className="settings-container">
          <div className="settings-page-heading">
            <div>
              <div className="performance-label">ACCOUNT</div>

              <h1>Settings</h1>

              <p>Manage your account preferences.</p>
            </div>
          </div>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <h2>Notifications</h2>

                <p>Choose which notifications you want to receive.</p>
              </div>

              <span className="settings-icon">🔔</span>
            </div>

            <div className="settings-option">
              <div>
                <strong>Email Notifications</strong>

                <p>Receive important account updates through email.</p>
              </div>

              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(event) =>
                    setEmailNotifications(event.target.checked)
                  }
                />

                <span className="settings-slider" />
              </label>
            </div>

            <div className="settings-option">
              <div>
                <strong>Investment Updates</strong>

                <p>Get updates about your investments and portfolio.</p>
              </div>

              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={investmentNotifications}
                  onChange={(event) =>
                    setInvestmentNotifications(event.target.checked)
                  }
                />

                <span className="settings-slider" />
              </label>
            </div>

            <div className="settings-option">
              <div>
                <strong>Payment Notifications</strong>

                <p>Receive payment and transaction notifications.</p>
              </div>

              <label className="settings-switch">
                <input
                  type="checkbox"
                  checked={paymentNotifications}
                  onChange={(event) =>
                    setPaymentNotifications(event.target.checked)
                  }
                />

                <span className="settings-slider" />
              </label>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <h2>Security</h2>

                <p>Manage your account security.</p>
              </div>

              <span className="settings-icon">🔒</span>
            </div>

            <div className="settings-action-row">
              <div>
                <strong>Password</strong>

                <p>Keep your account protected with a strong password.</p>
              </div>

              <button className="settings-action-button">
                Change Password
              </button>
            </div>

            <div className="settings-action-row">
              <div>
                <strong>Two-Factor Authentication</strong>

                <p>Add an extra layer of security to your account.</p>
              </div>

              <span className="settings-coming-soon">Coming Soon</span>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <h2>Payment Preferences</h2>

                <p>Manage your payment preferences.</p>
              </div>

              <span className="settings-icon">₹</span>
            </div>

            <div className="settings-info-row">
              <span>Default Currency</span>

              <strong>INR (₹)</strong>
            </div>

            <div className="settings-info-row">
              <span>Payment Gateway</span>

              <strong>Razorpay</strong>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <div>
                <h2>Account</h2>

                <p>Account management options.</p>
              </div>

              <span className="settings-icon">⚙</span>
            </div>

            <div className="settings-action-row">
              <div>
                <strong>User ID</strong>

                <p>{currentUser?.id || "—"}</p>
              </div>
            </div>

            <div className="settings-action-row">
              <div>
                <strong>Sign Out</strong>

                <p>Sign out from your current account.</p>
              </div>

              <button
                className="settings-logout-button"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </section>

          <div className="settings-footer">
            Investment Platform · Version 1.0.0
          </div>
        </div>
      </main>
    );
  }

  /* =====================================================
     PLACEHOLDER
  ===================================================== */

  function PlaceholderPage({ icon, title, text }) {
    return (
      <div className="placeholder-page">
        <div className="placeholder-card">
          <div className="placeholder-icon">{icon}</div>

          <h1>{title}</h1>

          <p>{text}</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE ROUTER
  ===================================================== */

  function renderPage() {
    switch (currentPage) {
      case "details":
        return <DetailsPage />;

      case "payment":
        return <PaymentPage />;

      case "portfolio":
        return <PortfolioPage />;

      case "orders":
        return <OrdersPage />;

      case "orderDetails":
        return <OrderDetailsPage />;

      case "profile":
        return <ProfilePage />;

      case "settings":
        return <SettingsPage />;

      case "funds":
      default:
        return <FundsPage />;
    }
  }

  /* =====================================================
     LOGIN CHECK
  ===================================================== */

  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <Register
          onRegister={(token, user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            setShowRegister(false);
          }}
          onBackToLogin={() => {
            setShowRegister(false);
          }}
        />
      );
    }

    return (
      <Login
        onLogin={(token, user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }}
        onCreateAccount={() => {
          setShowRegister(true);
        }}
      />
    );
  }

  /* =====================================================
     FINAL APP
  ===================================================== */

  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      <Header />

      {renderPage()}
    </div>
  );
}
