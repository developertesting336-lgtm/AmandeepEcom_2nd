import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import image1 from "../../assets/front-view-shopping-bags-cart-cyber-monday.jpg";
import image2 from "../../assets/composition-black-friday-shopping-cart-with-copy-space.jpg";
import image3 from "../../assets/electronics.jpg";

import "./ScrollStory.css";

gsap.registerPlugin(ScrollTrigger);

const ScrollStory = () => {
  const sectionRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const images = gsap.utils.toArray<HTMLElement>(".story-image");
      const texts = gsap.utils.toArray<HTMLElement>(".story-text");

      if (images.length < 3) return;

      // Initial state — images
      gsap.set(images[0], {
        scale: 1,
        opacity: 1,
      });

      gsap.set(images[1], {
        scale: 1.3,
        opacity: 0,
        x: 150,
      });

      gsap.set(images[2], {
        scale: 1.3,
        opacity: 0,
        x: -150,
      });

      // Initial state — text
      gsap.set(texts[0], { opacity: 1 });
      gsap.set(texts[1], { opacity: 0 });
      gsap.set(texts[2], { opacity: 0 });

      // Timeline
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1500",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // IMAGE 1
      timeline.to(images[0], {
        scale: 1.15,
        duration: 1,
        ease: "none",
      });

      // IMAGE 1 disappears
      timeline.to(images[0], {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
      });

      // TEXT 1 fades out
      timeline.to(
        texts[0],
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.8"
      );

      // IMAGE 2 enters
      timeline.to(images[1], {
        scale: 1,
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power2.out",
      });

      // TEXT 2 fades in
      timeline.to(
        texts[1],
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.8"
      );

      // IMAGE 2 zoom
      timeline.to(images[1], {
        scale: 1.12,
        duration: 1,
        ease: "none",
      });

      // IMAGE 2 disappears
      timeline.to(images[1], {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
      });

      // TEXT 2 fades out
      timeline.to(
        texts[1],
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.8"
      );

      // IMAGE 3 enters
      timeline.to(images[2], {
        scale: 1,
        opacity: 1,
        x: 0,
        duration: 1,
        ease: "power2.out",
      });

      // TEXT 3 fades in
      timeline.to(
        texts[2],
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.8"
      );

      // IMAGE 3 final zoom
      timeline.to(images[2], {
        scale: 1.1,
        duration: 1,
        ease: "none",
      });
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section className="scroll-story" ref={sectionRef}>
      <div className="story-images">
        <img
          src={image1}
          className="story-image"
          alt="Shopping bags and cart - cyber monday"
        />

        <img
          src={image2}
          className="story-image"
          alt="Black friday shopping cart"
        />

        <img
          src={image3}
          className="story-image"
          alt="Electronics collection"
        />
      </div>

      <div className="story-content">
        <div className="story-text text-one">
          <span>01</span>

          <h2>The Future of Shopping</h2>

          <p>
            Discover a smarter and more engaging shopping experience.
          </p>
        </div>

        <div className="story-text text-two">
          <span>02</span>

          <h2>Digital Commerce</h2>

          <p>
            Connected experiences built around modern customers.
          </p>
        </div>

        <div className="story-text text-three">
          <span>03</span>

          <h2>One Complete Ecosystem</h2>

          <p>
            Everything your business needs in one powerful platform.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ScrollStory;
