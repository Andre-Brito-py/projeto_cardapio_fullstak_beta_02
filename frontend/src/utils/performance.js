// Performance utilities for optimizing user interactions

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle function to limit function execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Lazy loading utility for images
 * @param {HTMLImageElement} img - Image element
 * @param {string} src - Image source URL
 */
export const lazyLoadImage = (img, src) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const image = entry.target;
        image.src = src;
        image.classList.add('loaded');
        observer.unobserve(image);
      }
    });
  });
  
  observer.observe(img);
};

/**
 * Smooth scroll utility
 * @param {HTMLElement} element - Target element
 * @param {number} duration - Animation duration in milliseconds
 */
export const smoothScrollTo = (element, duration = 500) => {
  const targetPosition = element.offsetTop;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  const animation = (currentTime) => {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  };

  const ease = (t, b, c, d) => {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  };

  requestAnimationFrame(animation);
};

/**
 * Animation frame utility for smooth animations
 * @param {Function} callback - Animation callback
 * @param {number} duration - Animation duration in milliseconds
 */
export const animateWithRAF = (callback, duration = 300) => {
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    callback(progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

/**
 * Form validation utility with debounced validation
 * @param {HTMLFormElement} form - Form element
 * @param {Object} validators - Validation rules
 * @param {number} delay - Debounce delay
 */
export const createFormValidator = (form, validators, delay = 300) => {
  const debouncedValidate = debounce((field, value) => {
    const validator = validators[field];
    if (validator) {
      const isValid = validator(value);
      const fieldElement = form.querySelector(`[name="${field}"]`);
      const errorElement = form.querySelector(`[data-error="${field}"]`);
      
      if (fieldElement) {
        fieldElement.classList.toggle('error', !isValid);
        fieldElement.classList.toggle('valid', isValid);
      }
      
      if (errorElement) {
        errorElement.style.display = isValid ? 'none' : 'block';
      }
    }
  }, delay);
  
  return debouncedValidate;
};

/**
 * Performance monitoring utility
 */
export const performanceMonitor = {
  marks: new Map(),
  
  start(name) {
    this.marks.set(name, performance.now());
  },
  
  end(name) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
    // Performance tracking: ${name} took ${duration.toFixed(2)}ms
    this.marks.delete(name);
    return duration;
    }
    return null;
  }
};

/**
 * Memory-efficient event listener manager
 */
export class EventManager {
  constructor() {
    this.listeners = new Map();
  }
  
  add(element, event, handler, options = {}) {
    const key = `${element}_${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key).push({ handler, options });
    element.addEventListener(event, handler, options);
  }
  
  remove(element, event, handler) {
    const key = `${element}_${event}`;
    const handlers = this.listeners.get(key);
    
    if (handlers) {
      const index = handlers.findIndex(h => h.handler === handler);
      if (index > -1) {
        handlers.splice(index, 1);
        element.removeEventListener(event, handler);
      }
    }
  }
  
  removeAll() {
    this.listeners.forEach((handlers, key) => {
      const [element, event] = key.split('_');
      handlers.forEach(({ handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.listeners.clear();
  }
}

/**
 * Viewport utilities for responsive behavior
 */
export const viewport = {
  isMobile: () => window.innerWidth <= 768,
  isTablet: () => window.innerWidth > 768 && window.innerWidth <= 1024,
  isDesktop: () => window.innerWidth > 1024,
  
  onResize: throttle((callback) => {
    callback({
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: viewport.isMobile(),
      isTablet: viewport.isTablet(),
      isDesktop: viewport.isDesktop()
    });
  }, 100)
};

/**
 * Local storage utility with error handling
 */
export const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }
};

export default {
  debounce,
  throttle,
  lazyLoadImage,
  smoothScrollTo,
  animateWithRAF,
  createFormValidator,
  performanceMonitor,
  EventManager,
  viewport,
  storage
};