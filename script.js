const revealItems = document.querySelectorAll(".reveal");
const parallaxItems = document.querySelectorAll(".hero-copy, .hero-visual, .feature-band");
const tiltCards = document.querySelectorAll(".tilt-card");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -10% 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const updateParallax = () => {
  const viewportHeight = window.innerHeight;

  parallaxItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const progress = (midpoint - viewportHeight / 2) / viewportHeight;
    const shift = progress * -28;
    item.style.setProperty("--parallax-shift", `${shift}px`);
    item.classList.add("parallax");
  });
};

updateParallax();
window.addEventListener("scroll", updateParallax, { passive: true });
window.addEventListener("resize", updateParallax);

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const rotateY = ((x / bounds.width) - 0.5) * 10;
    const rotateX = ((y / bounds.height) - 0.5) * -10;

    card.style.setProperty("--rotateX", `${rotateX}deg`);
    card.style.setProperty("--rotateY", `${rotateY}deg`);
    card.style.setProperty("--pointer-x", `${(x / bounds.width) * 100}%`);
    card.style.setProperty("--pointer-y", `${(y / bounds.height) * 100}%`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--rotateX", "0deg");
    card.style.setProperty("--rotateY", "0deg");
    card.style.setProperty("--pointer-x", "50%");
    card.style.setProperty("--pointer-y", "50%");
  });
});
