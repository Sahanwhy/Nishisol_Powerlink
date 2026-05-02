/**
 * NISHISOL POWERLINK - Main Script
 * Version: 1.0.0
 * Features: Preloader, Scroll Animations, Navbar Toggle, Counter, Form Handling
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. PRELOADER
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
                document.body.style.overflow = 'auto'; // Re-enable scroll
            }, 1000); // Give it a second to show the cool animation
        });
    }

    // 2. NAVBAR SCROLL EFFECT
    const navbar = document.getElementById('navbar');
    const scrollThreshold = 50;

    const handleNavbarScroll = () => {
        if (window.scrollY > scrollThreshold) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleNavbarScroll);

    // 3. MOBILE MENU TOGGLE
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mob-link');

    const toggleMenu = () => {
        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.classList.toggle('no-scroll');
    };

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.classList.remove('no-scroll');
        });
    });

    // 4. COUNTER ANIMATION
    const stats = document.querySelectorAll('.stat-num');
    const counterOptions = {
        threshold: 0.5,
        rootMargin: "0px 0px -50px 0px"
    };

    const countUp = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = +entry.target.getAttribute('data-target');
                const count = +entry.target.innerText;
                const speed = 200; // The lower the slower
                const increment = target / speed;

                const updateCount = () => {
                    const currentCount = +entry.target.innerText;
                    if (currentCount < target) {
                        entry.target.innerText = Math.ceil(currentCount + increment);
                        setTimeout(updateCount, 1);
                    } else {
                        entry.target.innerText = target;
                    }
                };

                updateCount();
                observer.unobserve(entry.target);
            }
        });
    };

    const counterObserver = new IntersectionObserver(countUp, counterOptions);
    stats.forEach(stat => counterObserver.observe(stat));

    // 5. REVEAL ON SCROLL
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealOnScroll, revealOptions);
    revealElements.forEach(el => revealObserver.observe(el));

    // 6. FORM HANDLING (SIMULATION)
    const contactForm = document.getElementById('contactForm');
    const formMsg = document.getElementById('formMsg');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Basic animation for button
            const submitBtn = contactForm.querySelector('.form-submit');
            const originalBtnContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';
            submitBtn.disabled = true;

            // Simulate API Call
            setTimeout(() => {
                formMsg.innerHTML = '<i class="fas fa-check-circle"></i> Thank you! Your message has been sent.';
                formMsg.className = 'form-msg success'; // Use className to clear other classes
                
                contactForm.reset();
                submitBtn.innerHTML = originalBtnContent;
                submitBtn.disabled = false;

                // Clear message after 5 seconds
                setTimeout(() => {
                    formMsg.style.display = 'none';
                    formMsg.className = 'form-msg';
                }, 5000);
            }, 1500);
        });
    }

    // 7. BACK TO TOP BUTTON
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 8. ACTIVE NAV LINK ON SCROLL
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // 9. HERO SLIDER
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    let currentSlide = 0;
    let slideInterval;

    const showSlide = (index) => {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        if (slides[index]) slides[index].classList.add('active');
        if (dots[index]) dots[index].classList.add('active');
        currentSlide = index;
    };

    const nextSlide = () => {
        let index = (currentSlide + 1) % slides.length;
        showSlide(index);
    };

    const prevSlide = () => {
        let index = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(index);
    };

    const startAutoSlide = () => {
        slideInterval = setInterval(nextSlide, 5000);
    };

    const resetAutoSlide = () => {
        clearInterval(slideInterval);
        startAutoSlide();
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoSlide();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoSlide();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetAutoSlide();
        });
    });

    if (slides.length > 0) {
        startAutoSlide();
    }

    // 10. RE-INFORCE SMOOTH SCROLL (For browsers with limited support)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const navHeight = navbar.offsetHeight;
                const elementPosition = targetElement.offsetTop;
                const offsetPosition = elementPosition - navHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
