import { useEffect, useRef, useState } from "react";

const INTERVAL = 3000;
const ANIMATION_MS = 500;
const SWIPE_THRESHOLD = 40;

const clients = [
  { id: "1", name: "Online Fees" },
  { id: "2", name: "Sem Registration" },
  { id: "3", name: "GBU Academics" },
  { id: "4", name: "No Dues Slip" },
  { id: "5", name: "Admit Card" },
  { id: "6", name: "Timetable" }
];

const getVisibleCount = () => {
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 1024) return 2;
  return 3;
};

type Props = {
  dir?: "ltr" | "rtl"; // optional override
};

const ClientCarousel = ({ dir }: Props) => {
  const [visible, setVisible] = useState(3);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const timerRef = useRef<number | null>(null);

  // swipe tracking
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  const isRTL =
    dir === "rtl" ||
    (typeof document !== "undefined" &&
      document.documentElement.dir === "rtl");

  /** Build infinite items */
  const items = [
    ...clients.slice(-visible),
    ...clients,
    ...clients.slice(0, visible),
  ];

  /** Resize */
  useEffect(() => {
    const handleResize = () => {
      const v = getVisibleCount();
      setVisible(v);
      setIndex(v);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /** Autoplay */
  const startAuto = () => {
    stopAuto();
    timerRef.current = window.setInterval(() => {
      setIndex((i) => i + (isRTL ? -1 : 1));
    }, INTERVAL);
  };

  const stopAuto = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [isRTL]);

  /** Infinite jump */
  useEffect(() => {
    if (index === clients.length + visible) {
      setTimeout(() => {
        setAnimate(false);
        setIndex(visible);
      }, ANIMATION_MS);
    }
    if (index === 0) {
      setTimeout(() => {
        setAnimate(false);
        setIndex(clients.length);
      }, ANIMATION_MS);
    }
  }, [index, visible]);

  useEffect(() => {
    if (!animate) requestAnimationFrame(() => setAnimate(true));
  }, [animate]);

  /** Controls */
  const next = () => setIndex((i) => i + (isRTL ? -1 : 1));
  const prev = () => setIndex((i) => i - (isRTL ? -1 : 1));

  /** Momentum swipe */
  const onTouchStart = (e: React.TouchEvent) => {
    stopAuto();
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = performance.now();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dt = performance.now() - touchStartTime.current;
    const velocity = Math.abs(dx / dt); // px per ms

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      const slides = Math.min(3, Math.max(1, Math.round(velocity * 10)));
      const direction = dx < 0 ? 1 : -1;
      setIndex((i) => i + direction * slides * (isRTL ? -1 : 1));
    }

    startAuto();
  };

  /** Keyboard */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") isRTL ? prev() : next();
    if (e.key === "ArrowLeft") isRTL ? next() : prev();
    if (e.key === "Home") setIndex(visible);
    if (e.key === "End") setIndex(clients.length);
  };

  /** Dots */
  const activeDot =
    ((index - visible) % clients.length + clients.length) %
    clients.length;

  return (
    <section
      className="w-full bg-[#f6eef2] py-10 "
      aria-roledescription="carousel"
      aria-label="Important links"
    >
      <div className="max-w-[75%] mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-12">
          Important Links
        </h2>

        <div
          className="overflow-hidden outline-none"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onMouseEnter={stopAuto}
          onMouseLeave={startAuto}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            className={`flex ${animate ? "transition-transform batch-500 ease-in-out" : ""
              }`}
            style={{
              transform: `translateX(${(isRTL ? 1 : -1) * index * (100 / visible)
                }%)`,
            }}
          >
            {items.map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className="shrink-0 p-4"
                style={{ width: `${100 / visible}%` }}
                role="group"
                aria-roledescription="slide"
                aria-label={item.name}
              >
                <div className="bg-white cursor-not-allowed rounded-2xl p-6 shadow-sm text-center text-lg text-gray-700">
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls (outside content) */}
        <div className="mt-6 flex items-center justify-between gap-6">
          <div className="flex gap-2">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="rounded-full bg-white cursor-pointer shadow px-4 py-2"
            >
              {isRTL ? "›" : "‹"}
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="rounded-full bg-white cursor-pointer shadow px-4 py-2"
            >
              {isRTL ? "‹" : "›"}
            </button>
          </div>

          {/* Dots */}
          <div className="flex gap-2" role="tablist" aria-label="Slide dots">
            {clients.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeDot}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i + visible)}
                className={`h-2 w-2 rounded-full ${i === activeDot ? "bg-gray-800" : "bg-gray-400"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClientCarousel;