/*
  Полноценная замена. Главное изменение — 5-й триггер (и его reverse):
  1) playFromZero(#sc-6-transition-video)
  2) ждём реального старта воспроизведения (playing / timeupdate > 0)
  3) затем el.click()
*/
(function () {
  /* ============================
       МГНОВЕННЫЙ СКРОЛЛ НАВЕРХ
       (при первой загрузке, обновлении, pageshow/bfcache)
     ============================ */
  (function forceTopOnLoad() {
    // Временный перевод восстановления скролла в manual, чтобы не возвращало позицию
    let hadScrollRestoration = false;
    let prevScrollRestoration = "auto";
    try {
      if ("scrollRestoration" in history) {
        hadScrollRestoration = true;
        prevScrollRestoration = history.scrollRestoration;
        history.scrollRestoration = "manual";
      }
    } catch {}

    const toTop = () => {
      try {
        document.documentElement.style.scrollBehavior = "auto";
      } catch {}
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        try {
          window.scrollTo(0, 0);
        } catch {}
      }
      try {
        document.body.scrollTop = 0;
      } catch {}
      try {
        document.documentElement.scrollTop = 0;
      } catch {}
    };

    // Синхронно — на случай раннего срабатывания скрипта
    toTop();

    // Дублируем на ключевых этапах жизненного цикла
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        toTop();
        requestAnimationFrame(toTop);
        setTimeout(toTop, 0);
      },
      { once: true }
    );

    window.addEventListener(
      "load",
      () => {
        toTop();
        requestAnimationFrame(toTop);
        setTimeout(toTop, 0);

        // Возвращаем scrollRestoration в исходное значение после полной загрузки
        try {
          if (hadScrollRestoration)
            history.scrollRestoration = prevScrollRestoration || "auto";
        } catch {}
      },
      { once: true }
    );

    // При возврате из BFCache (Safari/iOS и др.)
    window.addEventListener(
      "pageshow",
      (e) => {
        if (e && e.persisted) {
          toTop();
          requestAnimationFrame(toTop);
          setTimeout(toTop, 0);
        } else {
          toTop();
        }
      },
      { once: true }
    );
  })();

  /* ============================
       БАЗОВЫЕ ФЛАГИ / UA
     ============================ */
  const ua = navigator.userAgent;
  const isIOS = /iP(ad|hone|od)/.test(ua);
  const isMacSafari =
    /Safari/.test(ua) &&
    !/(Chrome|Chromium|CriOS|Edg|OPR|YaBrowser|Vivaldi|Brave)/.test(ua);
  const isSafariLike = isIOS || isMacSafari;
  const isSafari = isSafariLike;

  /* ============================
       МОБИЛЬНЫЕ SRC (≤ 991px)
     ============================ */
  const FIRST_VIDEO_MOBILE_SRC =
    "https://www.dl.dropboxusercontent.com/scl/fi/5ctme7b90n79l3b79txxg/sc-01-mobile-final.m4v?rlkey=r07v807g8ampa5tw21tlxkgr4&st=dyy411zj&dl=0";

  const SAFARI_MOB_WORK_SRC =
    "https://www.dl.dropboxusercontent.com/scl/fi/tht7mv271votew2lbrhrh/sc-02-mobile-final.m4v?rlkey=c7fu2z60s9reajbywebl802gh&st=w6xvk6f9&dl=0";
  const SAFARI_MOB_DATA_SRC =
    "https://www.dl.dropboxusercontent.com/scl/fi/ovpl25owve5th93x9ex47/sc-03-mobile-final.m4v?rlkey=b9rbvolka6c6w992hf59sdipq&st=525ecw1f&dl=0";

  function assignMediaSrc(mediaEl, src, { removeAutoplay = false } = {}) {
    try {
      if (!mediaEl) return;
      const source = mediaEl.querySelector && mediaEl.querySelector("source");
      if (source) source.setAttribute("src", src);
      mediaEl.setAttribute("src", src);
      if (removeAutoplay) mediaEl.removeAttribute("autoplay");
      if (typeof mediaEl.load === "function") mediaEl.load();
    } catch {}
  }

  function swapSourcesOn991AndBelow() {
    try {
      if (window.innerWidth > 991) return;

      const first = document.getElementById("new-first-video");
      if (first) assignMediaSrc(first, FIRST_VIDEO_MOBILE_SRC);

      const works = document.getElementById("new-video-works");
      if (works)
        assignMediaSrc(works, SAFARI_MOB_WORK_SRC, {
          removeAutoplay: isSafariLike,
        });

      // На мобилке НЕ загружаем data-video сразу - только при необходимости
      // const data = document.getElementById("new-video-data");
      // if (data) assignMediaSrc(data, SAFARI_MOB_DATA_SRC, { removeAutoplay: isSafariLike });
    } catch {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", swapSourcesOn991AndBelow, {
      once: true,
    });
  } else {
    swapSourcesOn991AndBelow();
  }

  // Предотвращаем загрузку всех видео на мобилке до нужного момента
  function preventMobileVideoLoading() {
    if (window.innerWidth > 991) return; // Только для мобилки

    const allVideos = document.querySelectorAll("video");
    allVideos.forEach((video) => {
      if (
        video.id !== "new-first-video" &&
        video.id !== "new-video-works" &&
        video.id !== "new-video-data" &&
        video.id !== "sc-6-transition-video"
      ) {
        // Убираем src чтобы предотвратить загрузку
        if (video.src) {
          video.setAttribute("data-original-src", video.src);
          video.removeAttribute("src");
          const source = video.querySelector("source");
          if (source && source.src) {
            source.setAttribute("data-original-src", source.src);
            source.removeAttribute("src");
          }
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", preventMobileVideoLoading, {
      once: true,
    });
  } else {
    preventMobileVideoLoading();
  }

  /* ============================
       РАННЯЯ ПОДМЕНА SRC ДЛЯ WEBM/VP9
     ============================ */
  const SC6_TRANSITION_WEBM_CHROME =
    "https://www.dl.dropboxusercontent.com/scl/fi/jn8lhn7l60rep0x2xep2q/tr-06-final-vp9-chrome.webm?rlkey=tke2aguzm86jo04xd9st3u8ep&st=3k49dew9&dl=0";
  const CARD_ERM_WEBM_CHROME =
    "https://www.dl.dropboxusercontent.com/scl/fi/o02dejark008okj1zbanc/sc-05-2k-final-vp9-chrome.webm?rlkey=u0ejneh64zyum0mdc3ofwtjtm&st=f01ht20l&dl=0";

  function canPlayWebMVP9() {
    try {
      const v = document.createElement("video");
      if (!v || !v.canPlayType) return false;
      const res =
        v.canPlayType('video/webm; codecs="vp9"') ||
        v.canPlayType("video/webm; codecs=vp9") ||
        v.canPlayType("video/webm");
      return /^(probably|maybe)$/i.test(res || "");
    } catch {
      return false;
    }
  }

  function setMediaSrcById(id, url) {
    const el = document.getElementById(id);
    if (!el) return;

    const tag = (el.tagName || "").toUpperCase();

    const assignToMedia = (mediaEl, src) => {
      try {
        const source = mediaEl.querySelector && mediaEl.querySelector("source");
        if (source) source.setAttribute("src", src);
        mediaEl.setAttribute("src", src);
        if (typeof mediaEl.load === "function") mediaEl.load();
      } catch {}
    };

    if (tag === "VIDEO" || tag === "AUDIO") {
      assignToMedia(el, url);
      return;
    }
    if (tag === "SOURCE") {
      try {
        el.setAttribute("src", url);
        const p = el.parentElement;
        if (p && typeof p.load === "function") p.load();
      } catch {}
      return;
    }
    try {
      el.setAttribute("src", url);
    } catch {}
  }

  function swapEarlyWebMSources() {
    if (isSafariLike) return;
    if (!canPlayWebMVP9()) return;
    setMediaSrcById("sc-6-transition-video", SC6_TRANSITION_WEBM_CHROME);
    setMediaSrcById("card_erm", CARD_ERM_WEBM_CHROME);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", swapEarlyWebMSources, {
      once: true,
    });
  } else {
    swapEarlyWebMSources();
  }

  /* ============================
       SELECTORS / BREAKPOINTS
     ============================ */
  const SEL = {
    wrapper: ".wrapper-load-video-safari",
    loaderWrapper: ".loader-wrapper",
    progressLine: ".loader-progress-line",
    loaderText: ".loader-text",
    preLeft: ".preloader-image.is-left",
    preRight: ".preloader-image.is-right",
    buttonLoadWrapper: ".button-load-wrapper",
    startBtn: "#start-btn",
    logo: ".logo",
    preloaderNav: ".preloader-nav",
    heading: ".heading_wrapper",
    left: ".hero_content-left",
    right: ".hero_content-right_up-content",
    btns: ".button-group",
    trigger: ".trigger_transtion-fisrt",
    reverseTrigger: ".trigger_transtion-fisrt_reverse",
    reverseTextAnim: ".trigger-first-reverse-text-anim",
    secondTrigger: ".trigger_transtion-second",
    secondReverseTrigger: ".trigger_transtion-second_reverse",
    video: "#new-video-works",
    videoData: "#new-video-data",

    thirdNav: ".trigger-3-navigation",
    thirdNavReverse: ".trigger-3-navigation-reverse",

    fourthTrigger: ".trigger-4-transiton, .trigger-4-transition",
    fourthTriggerReverse:
      ".trigger-4-transiton_reverse, .trigger-4-transition_reverse",

    /* 5-е переходы */
    fifthTrigger: ".trigger-5-transition",
    fifthTriggerReverse: ".trigger-5-transition_reverse",

    /* видео для 5-го перехода */
    sc6Video: "#sc-6-video",
    sc6Transition: "#sc-6-transition-video",

    /* навигационные точки */
    p1: "#p-1",
    p2: "#p-2",
    p3: "#p-3",
    p4: "#p-4",
    p5: "#p-5",
  };

  const TABLET_MAX = 991;
  const MOBILE_MAX = 479;

  const LOGO_DESKTOP = { top: "3.2vh", left: "10vh", duration: 1.2 };
  const LOGO_TABLET = { top: "2.86vw", left: "9vw", duration: 1.2 };
  const LOGO_MOBILE = { top: "3.4vw", left: "10vw", duration: 1.2 };

  const state = {
    els: {},
    tweens: {},
    busy: new WeakMap(),
    inView: new WeakSet(),
  };
  // Глобальные флаги для подавления автокликов
  let suppressFourthReverseAutoUntil = 0; // timestamp (performance.now()) до которого подавляем автоклик 4-го реверса
  let suppressFifthReverseAutoUntil = 0; // timestamp (performance.now()) до которого подавляем автоклик 5-го реверса
  let pt1FlowActive = false; // активен ли сценарий перехода через pt-1
  let pt2FlowActive = false; // активен ли сценарий перехода через pt-2
  let pt3FlowActive = false; // активен ли сценарий перехода через pt-3
  let pt4FlowActive = false; // активен ли сценарий перехода через pt-4
  let pt5FlowActive = false; // активен ли сценарий перехода через pt-5
  let ptDFlowActive = false; // активен ли сценарий перехода через pt-d
  const q = (s) => document.querySelector(s);

  function cache() {
    Object.keys(SEL).forEach((key) => {
      state.els[key] = q(SEL[key]);
    });
  }
  function currentBP() {
    const w = window.innerWidth;
    if (w <= MOBILE_MAX) return "mobile";
    if (w <= TABLET_MAX) return "tablet";
    return "desktop";
  }
  function logoVals() {
    const bp = currentBP();
    if (bp === "mobile") return LOGO_MOBILE;
    if (bp === "tablet") return LOGO_TABLET;
    return LOGO_DESKTOP;
  }

  function lockScroll() {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  function unlockScroll() {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  /* ===== ЖЁСТКИЙ ЛОК СКРОЛЛА (iOS-safe) ===== */
  const _scrollFreeze = {
    active: false,
    y: 0,
    timer: null,
    ios: false,
    rafId: null,
  };

  function get50vhTargetY() {
    const doc = document.scrollingElement || document.documentElement;
    const vh = window.innerHeight;
    const maxY = Math.max(0, doc.scrollHeight - vh);
    return Math.min(Math.round(vh * 0.5), maxY);
  }
  function get101vhTargetY() {
    const doc = document.scrollingElement || document.documentElement;
    const vh = window.innerHeight;
    const maxY = Math.max(0, doc.scrollHeight - vh);
    return Math.min(Math.round(vh * 1.01), maxY);
  }
  // Здесь get100vhTargetY уже возвращает 50vh по вашему прошлому запросу
  function get100vhTargetY() {
    const doc = document.scrollingElement || document.documentElement;
    const vh = window.innerHeight;
    const maxY = Math.max(0, doc.scrollHeight - vh);
    return Math.min(Math.round(vh * 0.5), maxY); // было 1.0
  }

  function lockScrollHardFor(ms = 4000, yOverride = null) {
    try {
      trapUserScrollInputs(ms);
    } catch {}

    const y =
      typeof yOverride === "number"
        ? yOverride
        : window.scrollY || window.pageYOffset || 0;
    _scrollFreeze.active = true;
    _scrollFreeze.y = y;
    _scrollFreeze.ios = !!isIOS;

    try {
      document.documentElement.style.scrollBehavior = "auto";
    } catch {}

    if (_scrollFreeze.ios) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      const pin = () => {
        if (!_scrollFreeze.active) return;
        const cur = window.scrollY || window.pageYOffset || 0;
        if (cur !== y) window.scrollTo(0, y);
        _scrollFreeze.rafId = requestAnimationFrame(pin);
      };
      _scrollFreeze.rafId = requestAnimationFrame(pin);
    } else {
      const b = document.body;
      b.style.position = "fixed";
      b.style.top = `-${y}px`;
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
      b.style.overscrollBehavior = "none";
      b.style.touchAction = "none";
      try {
        document.documentElement.style.overscrollBehavior = "none";
      } catch {}
    }

    if (_scrollFreeze.timer) clearTimeout(_scrollFreeze.timer);
    _scrollFreeze.timer = setTimeout(unlockScrollHard, ms);
  }

  function unlockScrollHard() {
    if (!_scrollFreeze.active) return;
    const y = _scrollFreeze.y || 0;

    try {
      document.documentElement.style.scrollBehavior = "";
    } catch {}

    if (_scrollFreeze.ios) {
      if (_scrollFreeze.rafId) {
        cancelAnimationFrame(_scrollFreeze.rafId);
        _scrollFreeze.rafId = null;
      }
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    } else {
      const b = document.body;
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      b.style.overscrollBehavior = "";
      b.style.touchAction = "";
      try {
        document.documentElement.style.overscrollBehavior = "";
      } catch {}
    }

    window.scrollTo(0, y);

    _scrollFreeze.active = false;
    _scrollFreeze.y = 0;
    if (_scrollFreeze.timer) {
      clearTimeout(_scrollFreeze.timer);
      _scrollFreeze.timer = null;
    }

    // Обновляем прогресс шкалы навигации после разблокировки скролла
    // Убираем этот вызов, так как он может конфликтовать с jumpTo
    // setTimeout(() => {
    //   if (window.updateNavigationProgress) {
    //     window.updateNavigationProgress();
    //   }
    // }, 150);
  }

  /* ============================
       TRAP ПОЛЬЗОВАТЕЛЬСКОГО СКРОЛЛА
     ============================ */
  function trapUserScrollInputs(ms = 3000) {
    const startX = window.scrollX || window.pageXOffset || 0;
    const startY = window.scrollY || window.pageYOffset || 0;

    const guard = document.createElement("div");
    guard.setAttribute("data-scroll-trap", "true");
    Object.assign(guard.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      background: "transparent",
      touchAction: "none",
      overscrollBehavior: "contain",
      cursor: "default",
    });

    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    guard.addEventListener("wheel", prevent, { passive: false });
    guard.addEventListener("touchmove", prevent, { passive: false });
    guard.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch" || e.pointerType === "pen") prevent(e);
      },
      { passive: false }
    );

    const keyHandler = (e) => {
      const k = e.key;
      if (
        k === "ArrowUp" ||
        k === "ArrowDown" ||
        k === "PageUp" ||
        k === "PageDown" ||
        k === "Home" ||
        k === "End" ||
        k === " " ||
        k === "Spacebar"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", keyHandler, {
      passive: false,
      capture: true,
    });

    const restore = () => {
      window.scrollTo(startX, startY);
    };
    const scrollHandler = () => {
      restore();
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });

    try {
      guard.addEventListener("gesturestart", prevent, { passive: false });
      guard.addEventListener("gesturechange", prevent, { passive: false });
      guard.addEventListener("gestureend", prevent, { passive: false });
    } catch {}

    document.body.appendChild(guard);

    const release = () => {
      try {
        window.removeEventListener("keydown", keyHandler, { capture: true });
      } catch {}
      try {
        window.removeEventListener("scroll", scrollHandler);
      } catch {}
      try {
        guard.remove();
      } catch {}
    };
    setTimeout(release, ms);
  }

  /* === Мягкий перехват инпутов без фикса позиции (разрешает программный скролл) === */
  function trapInputsOnly(ms = 1000) {
    const guard = document.createElement("div");
    guard.setAttribute("data-inputs-only", "true");
    Object.assign(guard.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      background: "transparent",
      touchAction: "none",
      overscrollBehavior: "contain",
      cursor: "default",
    });
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    guard.addEventListener("wheel", prevent, { passive: false });
    guard.addEventListener("touchmove", prevent, { passive: false });
    guard.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") prevent(e);
      },
      { passive: false }
    );
    const keyHandler = (e) => {
      const k = e.key;
      if (
        k === "ArrowUp" ||
        k === "ArrowDown" ||
        k === "PageUp" ||
        k === "PageDown" ||
        k === "Home" ||
        k === "End" ||
        k === " " ||
        k === "Spacebar"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", keyHandler, {
      passive: false,
      capture: true,
    });
    document.body.appendChild(guard);
    setTimeout(() => {
      try {
        window.removeEventListener("keydown", keyHandler, { capture: true });
      } catch {}
      try {
        guard.remove();
      } catch {}
    }, ms);
  }

  /* ============================
       ГЛОБАЛЬНАЯ ЗАЩИТА СКРОЛЛ-ТЕЛЕПОРТОВ
     ============================ */
  let teleportBusyUntil = 0;
  const TELEPORT_EPS = 50; // px
  const canTeleport = () => performance.now() > teleportBusyUntil;
  const occupyTeleport = (ms) => {
    teleportBusyUntil = performance.now() + (ms || 0);
  };

  function jumpTo(y, { smooth = false, lockMs = 1200 } = {}) {
    const doc = document.scrollingElement || document.documentElement;
    const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);
    const targetY = Math.min(Math.max(0, Math.round(y)), maxY);
    const curY = window.scrollY || window.pageYOffset || 0;

    if (!canTeleport()) return false;
    if (Math.abs(curY - targetY) <= TELEPORT_EPS) {
      occupyTeleport(lockMs);
      return true;
    }

    occupyTeleport(lockMs);
    try {
      window.scrollTo({ top: targetY, behavior: smooth ? "smooth" : "auto" });
    } catch {
      window.scrollTo(0, targetY);
    }

    // Обновляем прогресс шкалы навигации после телепорта
    setTimeout(() => {
      if (window.updateNavigationProgress) {
        window.updateNavigationProgress();
      }
    }, 100);

    return true;
  }
  function scrollTo50vhFromTop(opts) {
    const doc = document.scrollingElement || document.documentElement;
    const vh = window.innerHeight,
      maxY = Math.max(0, doc.scrollHeight - vh);
    const targetY = Math.min(Math.round(vh * 0.5), maxY);
    return jumpTo(targetY, opts || {});
  }
  function scrollTo101vhFromTop(opts) {
    const doc = document.scrollingElement || document.documentElement;
    const vh = window.innerHeight,
      maxY = Math.max(0, doc.scrollHeight - vh);
    const targetY = Math.min(Math.round(vh * 1.01), maxY);
    return jumpTo(targetY, opts || {});
  }

  /* ============================
       PRELOADER VISUALS
     ============================ */
  function showWrapper() {
    const w = state.els.wrapper;
    if (!w) return;
    w.style.display = "flex";
    w.style.opacity = "0";
    if (typeof gsap !== "undefined")
      gsap.to(w, { opacity: 1, duration: 1.2, ease: "power2.out" });
    else w.style.opacity = "1";
  }
  function pendulum() {
    const { preLeft, preRight, loaderText } = state.els;
    if (typeof gsap === "undefined") return;

    if (preLeft) {
      preLeft.style.opacity = "0";
      preLeft.style.display = "block";
      const run = () => {
        gsap.to(preLeft, { opacity: 1, duration: 0.9, ease: "power2.out" });
        state.tweens.left = gsap.to(preLeft, {
          scale: 1.1,
          duration: 1.85,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        });
      };
      preLeft.tagName === "IMG" && !preLeft.complete
        ? preLeft.addEventListener("load", run, { once: true })
        : run();
    }
    if (preRight) {
      preRight.style.opacity = "0";
      preRight.style.display = "block";
      const run = () => {
        gsap.to(preRight, { opacity: 1, duration: 0.9, ease: "power2.out" });
        state.tweens.right = gsap.to(preRight, {
          scale: 1.05,
          duration: 1.85,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        });
      };
      preRight.tagName === "IMG" && !preRight.complete
        ? preRight.addEventListener("load", run, { once: true })
        : run();
    }
    if (loaderText) {
      state.tweens.text = gsap.to(loaderText, {
        opacity: 0.4,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }
  }
  function fakeProgress() {
    const line = state.els.progressLine;
    if (!line || typeof gsap === "undefined") return;
    gsap.set(line, { width: "0%" });
    state.tweens.progress = gsap
      .timeline()
      .set(line, { width: "8%" })
      .to(line, { width: "24%", duration: 0.3, ease: "none" })
      .to(line, { width: "52%", duration: 0.5, ease: "none" })
      .to(line, { width: "87%", duration: 0.6, ease: "none" })
      .to(line, { width: "100%", duration: 0.4, ease: "none" });
  }
  function stopPreloaderTweens() {
    ["left", "right", "text", "progress"].forEach((k) => {
      if (state.tweens[k]) {
        state.tweens[k].kill();
        delete state.tweens[k];
      }
    });
  }
  function showStartButton() {
    const { buttonLoadWrapper, startBtn } = state.els;
    if (buttonLoadWrapper) {
      buttonLoadWrapper.style.display = "flex";
      if (typeof gsap !== "undefined")
        gsap.fromTo(
          buttonLoadWrapper,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      else buttonLoadWrapper.style.opacity = "1";
    }
    if (startBtn) {
      startBtn.style.display = "block";
      if (typeof gsap !== "undefined")
        gsap.fromTo(
          startBtn,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 }
        );
      else startBtn.style.opacity = "1";
      startBtn.addEventListener("click", startIntro, { once: true });
    }
  }
  function hideLoaderPanels() {
    const { loaderWrapper, buttonLoadWrapper, wrapper } = state.els;
    if (typeof gsap === "undefined") {
      if (loaderWrapper) loaderWrapper.style.display = "none";
      if (buttonLoadWrapper) buttonLoadWrapper.style.display = "none";
    } else {
      if (loaderWrapper)
        gsap.to(loaderWrapper, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            loaderWrapper.style.display = "none";
          },
        });
      if (buttonLoadWrapper)
        gsap.to(buttonLoadWrapper, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            buttonLoadWrapper.style.display = "none";
          },
        });
    }
    if (wrapper) wrapper.style.display = "none";
  }
  function slidePreloaderImagesAway(onDone) {
    const { preLeft, preRight } = state.els;
    stopPreloaderTweens();
    const bp = currentBP();
    if (typeof gsap === "undefined") {
      if (preLeft) preLeft.style.display = "none";
      if (preRight) preRight.style.display = "none";
      if (typeof onDone === "function") onDone();
      return;
    }
    const tl = gsap.timeline({
      onComplete: () => {
        if (preLeft) preLeft.style.display = "none";
        if (preRight) preRight.style.display = "none";
        if (typeof onDone === "function") onDone();
      },
    });
    if (bp === "desktop") {
      tl.to(preLeft, { x: "-100%", duration: 1.0, ease: "power2.out" }, 0).to(
        preRight,
        { x: "100%", duration: 1.0, ease: "power2.out" },
        0
      );
    } else {
      tl.to(preLeft, { y: "100%", duration: 1.0, ease: "power2.out" }, 0).to(
        preRight,
        { y: "-100%", duration: 1.0, ease: "power2.out" },
        0
      );
    }
  }
  function startIntro() {
    const { startBtn, logo } = state.els;
    if (typeof gsap === "undefined") {
      if (startBtn) startBtn.style.display = "none";
    } else {
      if (startBtn)
        gsap.to(startBtn, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            startBtn.style.display = "none";
          },
        });
    }
    slidePreloaderImagesAway(() => {
      hideLoaderPanels();
      if (logo) logo.style.display = "block";
      runIntroAnimation();
    });
  }
  function autoStartIntroIfNotSafari() {
    if (!isSafari) setTimeout(startIntro, 600);
    else showStartButton();
  }
  function runIntroAnimation() {
    const { heading, left, right, btns, logo } = state.els;
    if (typeof gsap === "undefined") return;
    [heading, left, right, btns].forEach(
      (el) => el && gsap.set(el, { opacity: 0, filter: "blur(20px)", y: "3em" })
    );
    if (logo) gsap.set(logo, { opacity: 1 });
    const L = logoVals();
    let split = null;
    if (typeof SplitText !== "undefined" && logo) {
      split = new SplitText(logo, { type: "chars", charsClass: "char" });
      gsap.set(split.chars, { opacity: 0, filter: "blur(6px)" });
    }
    gsap
      .timeline()
      .add(
        [
          logo
            ? gsap.to(logo, { scale: 1, duration: 1.0, ease: "power1.out" })
            : null,
          split
            ? gsap.to(split.chars, {
                opacity: 1,
                filter: "blur(0px)",
                duration: 0.8,
                stagger: 0.08,
                ease: "power2.out",
              })
            : null,
        ].filter(Boolean)
      )
      .to(
        logo,
        {
          scale: 0.2,
          top: L.top,
          left: L.left,
          x: 0,
          y: 0,
          transform: "scale(0.2)",
          duration: L.duration,
          transformOrigin: "0 0",
          ease: "power3.out",
          onComplete: () => {
            gsap.to(".logo_image, .burger-meni", {
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
            });
          },
        },
        "+=0.1"
      )
      .to(
        q(SEL.preloaderNav),
        {
          background: "rgba(0,0,0,0)",
          duration: 1,
          ease: "power1.out",
          onComplete: () => {
            setTimeout(() => {
              if (state.els.heading)
                gsap.to(state.els.heading, {
                  opacity: 1,
                  filter: "blur(0px)",
                  y: "0em",
                  duration: 1,
                });
              setTimeout(() => {
                if (state.els.left)
                  gsap.to(state.els.left, {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: "0em",
                    duration: 1,
                  });
                if (state.els.right)
                  setTimeout(
                    () =>
                      gsap.to(state.els.right, {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: "0em",
                        duration: 1,
                      }),
                    200
                  );
                if (state.els.btns)
                  setTimeout(
                    () =>
                      gsap.to(state.els.btns, {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: "0em",
                        duration: 1,
                      }),
                    400
                  );
              }, 400);
            }, 600);
          },
        },
        "-=0.6"
      );
  }

  /* ============================
       VIDEO CONST
     ============================ */
  const LOOP = { FPS: 30, START_FRAME: 121, END_FRAME: 181 };
  const LOOP_START_TIME = LOOP.START_FRAME / LOOP.FPS;
  const LOOP_END_TIME = LOOP.END_FRAME / LOOP.FPS;
  const LOOP_EPS = (1 / LOOP.FPS) * 0.5;

  const REV_INIT_FRAME = 51;
  const REV_INIT_TIME = REV_INIT_FRAME / LOOP.FPS;

  const CHAIN_FRAME = 182;
  const CHAIN_TIME = CHAIN_FRAME / LOOP.FPS;

  const DATA_FPS = 30;
  const DATA_JUMP_FRAME = 80;
  const DATA_JUMP_TIME = DATA_JUMP_FRAME / DATA_FPS;
  const DATA_EPS = (1 / DATA_FPS) * 0.5;
  const DATA_EPS_SOFT = 0.12;

  const DATA_REV_START_FRAME = 79;
  const DATA_REV_START_TIME = DATA_REV_START_FRAME / DATA_FPS;
  const DATA_REV_TRIGGER_FRAME = 90;
  const DATA_REV_TRIGGER_TIME = DATA_REV_TRIGGER_FRAME / DATA_FPS;

  const REVERSE_FPS = 24;

  function setTime(video, t) {
    if (video) {
      try {
        video.currentTime = Math.max(0, t || 0);
      } catch {}
    }
  }

  async function safePlay(video) {
    if (!video) return;
    try {
      await video.play();
      return { mutedApplied: false };
    } catch {
      const wasMuted = video.muted;
      try {
        video.muted = true;
      } catch {}
      try {
        await video.play();
        const unmute = () => {
          try {
            video.muted = wasMuted;
          } catch {}
          cleanup();
        };
        const cleanup = () => {
          video.removeEventListener("playing", unmute);
          video.removeEventListener("timeupdate", unmute);
        };
        video.addEventListener("playing", unmute, { once: true });
        video.addEventListener("timeupdate", unmute, { once: true });
        setTimeout(unmute, 800);
        return { mutedApplied: true };
      } catch {
        const tryOnUser = () => {
          video.play().catch(() => {});
          cleanup();
        };
        const cleanup = () => {
          window.removeEventListener("pointerdown", tryOnUser);
          window.removeEventListener("keydown", tryOnUser);
          window.removeEventListener("touchstart", tryOnUser);
        };
        window.addEventListener("pointerdown", tryOnUser, { once: true });
        window.addEventListener("keydown", tryOnUser, { once: true });
        window.addEventListener("touchstart", tryOnUser, { once: true });
        return { mutedApplied: video.muted };
      }
    }
  }

  /* ===== хелперы ===== */
  function playFromZero(video, { loop = false } = {}) {
    if (!video) return;
    try {
      video.loop = !!loop;
    } catch {}
    setTime(video, 0);
    safePlay(video);
  }

  function abortReverse(video) {
    if (!video) return;
    video.__revToken = (video.__revToken || 0) + 1;
    if (video.__revIntId) {
      try {
        clearInterval(video.__revIntId);
      } catch {}
      video.__revIntId = null;
    }
  }

  function reverseByTimer(
    video,
    { fps = 30, toTime = 0, maxDurationMs = 20000 } = {}
  ) {
    return new Promise((resolve) => {
      if (!video) return resolve();
      const token = (video.__revToken || 0) + 1;
      video.__revToken = token;
      const step = 1 / fps,
        period = 1000 / fps,
        floor = Math.max(0, toTime || 0),
        eps = step * 0.5;
      try {
        video.pause();
      } catch {}
      if (video.__revIntId) {
        try {
          clearInterval(video.__revIntId);
        } catch {}
        video.__revIntId = null;
      }

      const started = performance.now();
      const stop = () => {
        if (video.__revIntId) {
          clearInterval(video.__revIntId);
          video.__revIntId = null;
        }
        setTime(video, floor);
        try {
          video.pause();
        } catch {}
        resolve();
      };

      video.__revIntId = setInterval(() => {
        if ((video.__revToken || 0) !== token) {
          clearInterval(video.__revIntId);
          video.__revIntId = null;
          resolve();
          return;
        }
        if (performance.now() - started > maxDurationMs) {
          stop();
          return;
        }
        const cur = video.currentTime || 0;
        const next = Math.max(floor, cur - step);
        if (next <= floor + eps || cur <= floor + eps) {
          setTime(video, floor);
          stop();
          return;
        }
        setTime(video, next);
      }, period);

      setTimeout(() => {
        const cur = video.currentTime || 0;
        const first = Math.max(floor, cur - step);
        setTime(video, first);
      }, 0);
    });
  }

  /* ============ НОВОЕ: ждём фактический старт проигрывания видео ============ */
  function waitForPlaybackStart(
    video,
    { timeoutMs = 5000, minProgress = 0.02 } = {}
  ) {
    return new Promise((resolve) => {
      if (!video) return resolve(false);

      const done = (ok) => {
        cleanup();
        resolve(!!ok);
      };

      const checkNow = () => {
        try {
          if (!video.paused && !video.ended && (video.currentTime || 0) > 0)
            return true;
        } catch {}
        return false;
      };

      if (checkNow()) return done(true);

      let toId = null;
      const onPlaying = () => done(true);
      const onTimeupdate = () => {
        if ((video.currentTime || 0) > minProgress) done(true);
      };
      const onSeeked = () => {
        if (checkNow()) done(true);
      };

      const cleanup = () => {
        try {
          video.removeEventListener("playing", onPlaying);
        } catch {}
        try {
          video.removeEventListener("timeupdate", onTimeupdate);
        } catch {}
        try {
          video.removeEventListener("seeked", onSeeked);
        } catch {}
        if (toId) {
          clearTimeout(toId);
          toId = null;
        }
      };

      try {
        video.addEventListener("playing", onPlaying, { once: true });
        video.addEventListener("timeupdate", onTimeupdate);
        video.addEventListener("seeked", onSeeked, { once: true });
      } catch {}

      toId = setTimeout(() => done(false), timeoutMs);
    });
  }

  /* ============================
       ЛУПЫ ДЛЯ ВИДЕО (основные)
     ============================ */
  function ensureSegmentLoop(video) {
    if (!video) return;
    video.__loopDisabled = false;
    if (video.__loopRafId) cancelAnimationFrame(video.__loopRafId);

    function tick() {
      if (!video.__loopDisabled) {
        const t = video.currentTime || 0;
        if (t >= LOOP_END_TIME - LOOP_EPS) {
          const wasPlaying = !video.paused && !video.ended;
          try {
            video.pause();
          } catch {}
          setTime(video, LOOP_START_TIME);
          if (wasPlaying)
            setTimeout(() => {
              video.play().catch(() => {});
            }, 0);
        }
      }
      video.__loopRafId = requestAnimationFrame(tick);
    }
    video.__loopRafId = requestAnimationFrame(tick);
  }
  function disableSegmentLoop(video) {
    if (!video) return;
    video.__loopDisabled = true;
    if (video.__loopRafId) {
      cancelAnimationFrame(video.__loopRafId);
      video.__loopRafId = null;
    }
  }

  function ensureDataLoop(video) {
    if (!video) return;
    if (video.__dataLoopCleanup) video.__dataLoopCleanup();
    video.__dataLoopDisabled = false;

    function jumpBackTo140() {
      if (video.__dataLoopDisabled) return;
      const wasPlaying = !video.paused && !video.ended;
      try {
        video.pause();
      } catch {}
      setTime(video, DATA_JUMP_TIME);
      if (wasPlaying)
        setTimeout(() => {
          video.play().catch(() => {});
        }, 0);
    }

    const onEnded = () => {
      jumpBackTo140();
    };
    const onTimeUpdate = () => {
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        if ((video.currentTime || 0) >= dur - DATA_EPS_SOFT) jumpBackTo140();
      }
    };

    let rafId = null;
    const onRaf = () => {
      if (!video.__dataLoopDisabled) {
        const dur = video.duration;
        if (Number.isFinite(dur) && dur > 0) {
          if ((video.currentTime || 0) >= dur - DATA_EPS_SOFT) jumpBackTo140();
        }
        rafId = requestAnimationFrame(onRaf);
      }
    };
    rafId = requestAnimationFrame(onRaf);

    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);

    video.__dataLoopCleanup = () => {
      video.__dataLoopDisabled = true;
      try {
        video.removeEventListener("ended", onEnded);
      } catch {}
      try {
        video.removeEventListener("timeupdate", onTimeUpdate);
      } catch {}
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      video.__dataLoopCleanup = null;
    };
  }
  function disableDataLoop(video) {
    if (!video) return;
    if (video.__dataLoopCleanup) video.__dataLoopCleanup();
    video.__dataLoopDisabled = true;
  }

  function waitForTimeReverse(video, targetTime, eps = LOOP_EPS) {
    return new Promise((resolve) => {
      if (!video) return resolve();
      const target = Math.max(0, targetTime || 0);
      let rafId = null;
      const loop = () => {
        if ((video.currentTime || 0) <= target + eps) {
          if (rafId) cancelAnimationFrame(rafId);
          return resolve();
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    });
  }

  function markBusy(el, v) {
    state.busy.set(el, !!v);
  }
  function isBusy(el) {
    return !!state.busy.get(el);
  }

  /* ============================
       НАВИГАЦИОННЫЕ ТОЧКИ
     ============================ */
  // Хранилище таймеров для каждого элемента
  const textTimers = new Map();
  // Флаги активности для каждой навигационной точки
  const activeFlags = new Map();
  // Текущая активная навигационная точка
  let currentActivePoint = null;

  /* ============================
       ОБРАБОТЧИКИ КЛИКОВ ДЛЯ НАВИГАЦИОННЫХ ТОЧЕК
     ============================ */
  function initNavigationPointClickHandlers() {
    // Обработчики для мобильных навигационных точек
    const mobilePoints = [
      { mobile: "#pt-1-m", target: "#pt-1" },
      { mobile: "#pt-2-m", target: "#pt-2" },
      { mobile: "#pt-3-m", target: "#pt-3" },
      { mobile: "#pt-4-m", target: "#pt-4" },
      { mobile: "#pt-5-m", target: "#pt-5" },
      { mobile: "#m-pt-ds", target: "#pt-d" },
      { mobile: "#m-pt-1", target: "#pt-1" },
    ];

    mobilePoints.forEach(({ mobile, target }) => {
      const mobileElement = document.querySelector(mobile);
      const targetElement = document.querySelector(target);

      if (mobileElement && targetElement) {
        mobileElement.addEventListener(
          "click",
          (e) => {
            // НЕ предотвращаем стандартное поведение элемента
            // НЕ останавливаем всплытие события

            // Дополнительно кликаем на целевой элемент
            targetElement.click();
          },
          { passive: false }
        );
      }
    });
  }

  /* ============================
       ОБНОВЛЕНИЕ МОБИЛЬНОГО НАВИГАЦИОННОГО БЛОКА
     ============================ */
  function updateMobileNavigationBlock(activePointId) {
    const mobileWrapper = document.querySelector(
      ".navigation_point_wrapper_mobile"
    );
    if (!mobileWrapper) return;

    // Удаляем все активные классы
    mobileWrapper.classList.remove(
      "cc-active-p1",
      "cc-active-p2",
      "cc-active-p3",
      "cc-active-p4",
      "cc-active-p5"
    );

    // Добавляем соответствующий класс
    if (activePointId) {
      const pointNumber = activePointId.replace("p-", "");
      mobileWrapper.classList.add(`cc-active-p${pointNumber}`);
    }
  }

  /* ============================
       КОНФИГУРАЦИЯ ЗАДЕРЖЕК ТЕКСТА
       Настройка времени появления текста для каждой навигационной точки
       (в миллисекундах)
     ============================ */
  const TEXT_DELAYS = {
    // Прямые триггеры (движение вперед)
    forward: {
      "p-1": 3000, // 3 секунды
      "p-2": 4000, // 4 секунды
      "p-3": 1, // 1 миллисекунда
      "p-4": 1000, // 1 секунда
      "p-5": 1000, // 1 секунда
    },
    // Реверс триггеры (движение назад)
    reverse: {
      "p-1": 3000, // 3 секунды
      "p-2": 1, // 1 миллисекунда
      "p-3": 1, // 1 миллисекунда
      "p-4": 1000, // 1 секунда
      "p-5": 1000, // 1 секунда
    },
    // Тайминги из кликов (например, pt-1)
    click: {
      "p-1": 3000, // 0.5 секунды после клика
      "p-2": 800, // 0.8 секунды после клика
      "p-3": 600, // 0.6 секунды после клика
      "p-4": 700, // 0.7 секунды после клика
      "p-5": 900, // 0.9 секунды после клика
    },
  };

  function activateNavigationPoint(pointId, direction = "forward") {
    // Получаем ВСЕ элементы с данным ID (если их несколько)
    const points = document.querySelectorAll(`#${pointId}`);
    if (!points || points.length === 0) return;

    // Отменяем предыдущий таймер для этого элемента, если он существует
    if (textTimers.has(pointId)) {
      clearTimeout(textTimers.get(pointId));
      textTimers.delete(pointId);
    }

    // Устанавливаем флаг активности для этой точки
    activeFlags.set(pointId, true);

    // Обновляем текущую активную точку
    currentActivePoint = pointId;

    // Обновляем мобильный навигационный блок
    updateMobileNavigationBlock(pointId);

    // Получаем задержку для данного направления и точки
    const delay = TEXT_DELAYS[direction]?.[pointId] || 2000; // по умолчанию 2 секунды

    // Применяем логику ко ВСЕМ элементам с данным ID
    points.forEach((point) => {
      const image = point.querySelector(".navigation_point_image");
      const text = point.querySelector(".navigation_point_text");

      // Сначала активируем изображение
      if (image) {
        image.classList.add("cc-active");
        image.classList.add("cc-rotation-zero");
      }
    });

    // Активируем текст с индивидуальной задержкой (с проверкой флага)
    const timerId = setTimeout(() => {
      // Проверяем, что точка все еще активна
      if (activeFlags.get(pointId)) {
        points.forEach((point) => {
          const text = point.querySelector(".navigation_point_text");
          if (text) {
            text.classList.add("cc-active");
          }
        });
      }
      textTimers.delete(pointId); // Очищаем ссылку на таймер после выполнения
    }, delay);

    textTimers.set(pointId, timerId);
  }

  function deactivateNavigationPoint(pointId) {
    // Получаем ВСЕ элементы с данным ID (если их несколько)
    const points = document.querySelectorAll(`#${pointId}`);
    if (!points || points.length === 0) return;

    // Отменяем таймер для этого элемента, если он существует
    if (textTimers.has(pointId)) {
      clearTimeout(textTimers.get(pointId));
      textTimers.delete(pointId);
    }

    // Сбрасываем флаг активности для этой точки
    activeFlags.set(pointId, false);

    // Если деактивируем текущую активную точку, сбрасываем её
    if (currentActivePoint === pointId) {
      currentActivePoint = null;
      // Очищаем мобильный навигационный блок
      updateMobileNavigationBlock(null);
    }

    // Применяем логику ко ВСЕМ элементам с данным ID
    points.forEach((point) => {
      const image = point.querySelector(".navigation_point_image");
      const text = point.querySelector(".navigation_point_text");

      // Отключаем изображение
      if (image) {
        image.classList.remove("cc-active");
        image.classList.remove("cc-rotation-zero");
      }

      // Отключаем текст
      if (text) {
        text.classList.remove("cc-active");
      }
    });
  }

  function deactivateAllNavigationPoints() {
    // Деактивируем все навигационные точки p-1, p-2, p-3, p-4, p-5
    ["p-1", "p-2", "p-3", "p-4", "p-5"].forEach((pointId) => {
      deactivateNavigationPoint(pointId);
    });

    // Дополнительно убираем класс cc-rotation-zero у всех изображений
    const allImages = document.querySelectorAll(".navigation_point_image");
    allImages.forEach((img) => {
      img.classList.remove("cc-rotation-zero");
    });

    // Сбрасываем текущую активную точку и очищаем мобильный блок
    currentActivePoint = null;
    updateMobileNavigationBlock(null);
  }

  /* ============================
       ТРИГГЕР-ЛОГИКА + ЗАЩИТЫ
     ============================ */
  function initTriggerLogic() {
    const trigger = state.els.trigger;
    const reverse = state.els.reverseTrigger;
    const reverseText = state.els.reverseTextAnim;
    const second = state.els.secondTrigger;
    const secondReverse = state.els.secondReverseTrigger;
    const thirdNav = state.els.thirdNav;
    const thirdNavRev = state.els.thirdNavReverse;
    const fourth = state.els.fourthTrigger;
    const fourthRev = state.els.fourthTriggerReverse;
    const fifth = state.els.fifthTrigger;
    const fifthRev = state.els.fifthTriggerReverse;
    const video = state.els.video;
    const video2 = state.els.videoData;
    const sc6 = state.els.sc6Video;
    const sc6T = state.els.sc6Transition;

    if (!video) return;

    video.playsInline = true;
    if (sc6) {
      try {
        sc6.playsInline = true;
      } catch {}
    }
    if (sc6T) {
      try {
        sc6T.playsInline = true;
      } catch {}
    }

    video.addEventListener("loadedmetadata", () => {
      try {
        video.currentTime = 0;
      } catch {}
    });

    ensureSegmentLoop(video);

    if (trigger) {
      trigger.addEventListener(
        "click",
        () => {
          setTimeout(() => {
            if (!video) return;
            ensureSegmentLoop(video);
            try {
              video.pause();
              video.currentTime = 0;
            } catch {}
            if (video.paused) {
              video.play().catch(() => {});
            }
          }, 600);
        },
        { passive: true }
      );
    }

    if (second) {
      second.addEventListener(
        "click",
        async () => {
          if (!video2) return;
          abortReverse(video2);
          video2.__revActiveToken = 0;

          disableSegmentLoop(video);
          try {
            video2.playsInline = true;
          } catch {}
          setTime(video2, 0);
          ensureDataLoop(video2);
          await safePlay(video2);
        },
        { passive: true }
      );
    }

    if (secondReverse) {
      secondReverse.addEventListener(
        "click",
        async () => {
          if (!video2 || !video) return;

          const opToken = (video2.__revActiveToken || 0) + 1;
          video2.__revActiveToken = opToken;

          // Подавляем автоклик 4-го реверса в обычном сценарии second-reverse (не при pt-1)
          try {
            if (!pt1FlowActive)
              suppressFourthReverseAutoUntil = performance.now() + 4000;
          } catch {}
          // Подавляем автоклик 5-го реверса в обычном сценарии second-reverse (не при pt-1)
          try {
            if (!pt1FlowActive)
              suppressFifthReverseAutoUntil = performance.now() + 4000;
          } catch {}

          disableDataLoop(video2);
          try {
            video2.playsInline = true;
          } catch {}
          setTime(video2, DATA_REV_START_TIME);

          await reverseByTimer(video2, { fps: REVERSE_FPS, toTime: 0 });

          if (video2.__revActiveToken !== opToken) return;

          try {
            video2.pause();
          } catch {}
          try {
            video2.removeAttribute("autoplay");
          } catch {}
          try {
            video2.currentTime = 0;
          } catch {}

          disableSegmentLoop(video);
          await reverseByTimer(video, {
            fps: REVERSE_FPS,
            toTime: LOOP_START_TIME,
          });

          ensureSegmentLoop(video);
          try {
            await video.play();
          } catch {}
        },
        { passive: true }
      );
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target;

          /* === 3-я навигация (с защитой от повторов) === */
          if (el === thirdNav || el === thirdNavRev) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                state.inView.add(el);

                if (el === thirdNav) {
                  // Прямой триггер: отключаем p-2, активируем p-3
                  deactivateNavigationPoint("p-2");
                  activateNavigationPoint("p-3", "forward");
                } else {
                  // Реверс триггер: отключаем p-3, активируем p-2
                  deactivateNavigationPoint("p-3");
                  activateNavigationPoint("p-2", "reverse");
                }

                try {
                  el.click();
                } catch {}
              }
            } else {
              state.inView.delete(el);
            }
            return;
          }

          /* === 4-й триггер (без телепорта) === */
          if (el === fourth || el === fourthRev) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                // Если это 4-й реверс и действует подавление (и это не pt-1), не кликаем сейчас
                if (
                  el === fourthRev &&
                  performance.now() < suppressFourthReverseAutoUntil &&
                  !pt1FlowActive
                ) {
                  return;
                }
                // Если активен pt-3, не кликаем автоматически по 4-му реверс триггеру
                if (el === fourthRev && pt3FlowActive) {
                  pt3DebugLog(
                    "Блокируем автоматический клик по 4-му реверс триггеру (pt3FlowActive)"
                  );
                  return;
                }
                state.inView.add(el);

                if (el === fourth) {
                  // Прямой триггер: отключаем p-3, активируем p-4
                  deactivateNavigationPoint("p-3");
                  activateNavigationPoint("p-4", "forward");
                } else {
                  // Реверс триггер: отключаем p-4, активируем p-3
                  deactivateNavigationPoint("p-4");
                  activateNavigationPoint("p-3", "reverse");
                }

                try {
                  el.click();
                } catch {}
                trapUserScrollInputs(1700);
              }
            } else {
              state.inView.delete(el);
            }
            return;
          }

          /* ===== 5-й триггер: СНАЧАЛА СТАРТ ПЕРЕХОДА, ПОТОМ КЛИК ===== */
          if (el === fifth) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                state.inView.add(el);

                // Отключаем cc-active у элементов p-4
                deactivateNavigationPoint("p-4");

                // Активируем пятую навигационную точку
                activateNavigationPoint("p-5", "forward");
                trapUserScrollInputs(1000);

                const sc6TLocal = state.els.sc6Transition;
                if (sc6TLocal) {
                  playFromZero(sc6TLocal, { loop: false });
                  waitForPlaybackStart(sc6TLocal, { timeoutMs: 5000 }).then(
                    () => {
                      try {
                        el.click();
                      } catch {}
                    }
                  );
                } else {
                  // если переходного видео нет — кликаем сразу, чтобы не зависнуть
                  try {
                    el.click();
                  } catch {}
                }
                // Важно: #sc-6-video не трогаем — управляется HTML (autoplay+loop)
              }
            } else {
              state.inView.delete(el);
            }
            return;
          }

          /* ===== 5-й реверс: та же логика ожидания старта ===== */
          if (el === fifthRev) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                // Если это 5-й реверс и действует подавление (и это не pt-1), не кликаем сейчас
                if (
                  el === fifthRev &&
                  performance.now() < suppressFifthReverseAutoUntil &&
                  !pt1FlowActive
                ) {
                  return;
                }
                state.inView.add(el);

                // Отключаем cc-active у элементов p-5
                deactivateNavigationPoint("p-5");

                // Активируем четвертую навигационную точку
                activateNavigationPoint("p-4", "reverse");

                trapUserScrollInputs(1000);

                const sc6TLocal = state.els.sc6Transition;
                if (sc6TLocal) {
                  playFromZero(sc6TLocal, { loop: false });
                  waitForPlaybackStart(sc6TLocal, { timeoutMs: 5000 }).then(
                    () => {
                      try {
                        el.click();
                      } catch {}
                    }
                  );
                } else {
                  try {
                    el.click();
                  } catch {}
                }
                // #sc-6-video по-прежнему не трогаем
              }
            } else {
              state.inView.delete(el);
            }
            return;
          }

          /* ===== 1-й триггер: телепорт на 50vh + блокировка скролла на 4с ===== */
          if (el === state.els.trigger) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                state.inView.add(el);

                const targetY = get50vhTargetY();
                jumpTo(targetY, { smooth: false, lockMs: 4000 });
                trapUserScrollInputs(4000);

                // Активируем первую навигационную точку
                activateNavigationPoint("p-1", "forward");

                ensureSegmentLoop(video);
                try {
                  el.click();
                } catch {}
              }
            } else {
              state.inView.delete(el);
            }
            return;
          }

          /* ===== 1-й реверс ===== */
          if (el === state.els.reverseTrigger) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                state.inView.add(el);

                lockScroll();
                trapUserScrollInputs(1000);
                try {
                  reverseText && reverseText.click();
                } catch {}

                setTime(video, REV_INIT_TIME);
                reverseByTimer(video, { fps: REVERSE_FPS, toTime: 0 }).then(
                  () => {
                    setTimeout(() => {
                      unlockScroll();
                    }, 1000);
                    try {
                      video.currentTime = 0.1;
                    } catch {}
                    try {
                      el.click();
                    } catch {}
                    try {
                      video.currentTime = 0;
                      video.pause();
                    } catch {}
                    ensureSegmentLoop(video);
                  }
                );
              }
            } else state.inView.delete(el);
            return;
          }

          /* ===== 2-й триггер: телепорт на 101vh + блокировка скролла на 4с ===== */
          if (el === state.els.secondTrigger) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                state.inView.add(el);

                const targetY = get101vhTargetY();
                jumpTo(targetY, { smooth: false, lockMs: 4000 });
                trapUserScrollInputs(4000);

                // Отключаем cc-active у элементов p-1
                deactivateNavigationPoint("p-1");

                // Активируем вторую навигационную точку
                activateNavigationPoint("p-2", "forward");

                disableSegmentLoop(video);
                setTime(video, CHAIN_TIME);

                try {
                  el.click();
                } catch {}
              }
            } else {
              state.inView.delete(el);
            }
            return;
          }

          /* ===== 2-й реверс: телепорт на 50vh + блокировка скролла на 3.5с ===== */
          if (el === state.els.secondReverseTrigger) {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
              if (!state.inView.has(el)) {
                state.inView.add(el);

                const targetY = get50vhTargetY();
                jumpTo(targetY, { smooth: false, lockMs: 3500 });
                trapUserScrollInputs(3500);

                // Отключаем cc-active у элементов p-2
                deactivateNavigationPoint("p-2");

                // Активируем первую навигационную точку
                activateNavigationPoint("p-1", "reverse");

                // Подавляем автоклик 4-го реверса при автоматическом переходе на second-reverse (не при pt-1)
                try {
                  if (!pt1FlowActive)
                    suppressFourthReverseAutoUntil = performance.now() + 4000;
                } catch {}
                // Подавляем автоклик 5-го реверса при автоматическом переходе на second-reverse (не при pt-1)
                try {
                  if (!pt1FlowActive)
                    suppressFifthReverseAutoUntil = performance.now() + 4000;
                } catch {}

                try {
                  el.click();
                } catch {}
              }
            } else state.inView.delete(el);
            return;
          }
        });
      },
      { threshold: 0.1 }
    );

    // подписки
    if (trigger) io.observe(trigger);
    if (reverse) io.observe(reverse);
    if (second) io.observe(second);
    if (secondReverse) io.observe(secondReverse);
    if (thirdNav) io.observe(thirdNav);
    if (thirdNavRev) io.observe(thirdNavRev);
    if (fourth) io.observe(fourth);
    if (fourthRev) io.observe(fourthRev);
    if (fifth) io.observe(fifth);
    if (fifthRev) io.observe(fifthRev);
  }

  /* ===========================================================
     НОВАЯ ЛОГИКА PRELOADER
     — для десктопа: загружаем все видео сразу
     — для мобилки: загружаем только first + work, потом data, потом остальные
     =========================================================== */
  function isMobileWidth991() {
    return window.innerWidth <= 991;
  }
  function $_(id) {
    try {
      return document.getElementById(id) || null;
    } catch {
      return null;
    }
  }

  function waitOneVideoReady(video, onReady) {
    if (!video) {
      onReady(true);
      return;
    }
    try {
      if ((video.readyState || 0) >= 3) {
        onReady(true);
        return;
      } // HAVE_FUTURE_DATA
      let done = false;
      const handler = () => {
        if (done) return;
        done = true;
        cleanup();
        onReady(true);
      };
      const alt = () => {
        if (done) return;
        done = true;
        cleanup();
        onReady(true);
      };
      const failSafe = setTimeout(() => {
        if (done) return;
        done = true;
        cleanup();
        onReady(false);
      }, 12000);
      function cleanup() {
        try {
          video.removeEventListener("canplaythrough", handler);
        } catch {}
        try {
          video.removeEventListener("loadeddata", alt);
        } catch {}
        try {
          clearTimeout(failSafe);
        } catch {}
      }
      video.addEventListener("canplaythrough", handler, { once: true });
      video.addEventListener("loadeddata", alt, { once: true });
    } catch {
      onReady(false);
    }
  }

  function makeRealProgressController(lineEl, total) {
    try {
      if (typeof gsap !== "undefined") gsap.set(lineEl, { width: "8%" });
      else if (lineEl) lineEl.style.width = "8%";
    } catch {}
    setTimeout(() => {
      try {
        if (typeof gsap !== "undefined") gsap.set(lineEl, { width: "16%" });
        else if (lineEl) lineEl.style.width = "16%";
      } catch {}
    }, 200);
    setTimeout(() => {
      try {
        if (typeof gsap !== "undefined") gsap.set(lineEl, { width: "24%" });
        else if (lineEl) lineEl.style.width = "24%";
      } catch {}
    }, 400);

    let loaded = 0;

    // Адаптивные значения ширины в зависимости от количества видео
    const getWidths = (total) => {
      if (total === 2) {
        return ["60%", "100%"]; // Для мобилки (2 видео)
      } else if (total === 3) {
        return ["50%", "85%", "100%"]; // Для 3 видео
      } else if (total === 4) {
        return ["52%", "87%", "100%"]; // Для десктопа (4 видео)
      } else {
        // Для любого другого количества - равномерное распределение
        const step = 100 / total;
        return Array.from(
          { length: total },
          (_, i) => `${Math.round((i + 1) * step)}%`
        );
      }
    };

    const widths = getWidths(total);

    const step = () => {
      loaded++;
      const target = widths[Math.min(loaded - 1, widths.length - 1)];
      try {
        if (lineEl) {
          if (typeof gsap !== "undefined")
            gsap.to(lineEl, { width: target, duration: 0.4, ease: "none" });
          else lineEl.style.width = target;
        }
      } catch {}
    };
    const finish = () => {
      try {
        if (lineEl) {
          if (typeof gsap !== "undefined") {
            gsap.to(lineEl, { width: "100%", duration: 0.4, ease: "none" });
          } else {
            lineEl.style.width = "100%";
          }
        }
      } catch {}

      // Дополнительная гарантия что полоска дошла до конца
      setTimeout(() => {
        try {
          if (lineEl && lineEl.style.width !== "100%") {
            if (typeof gsap !== "undefined") {
              gsap.set(lineEl, { width: "100%" });
            } else {
              lineEl.style.width = "100%";
            }
          }
        } catch {}
      }, 500);
    };
    return { step, finish };
  }

  // Функция для загрузки всех остальных видео после data-video
  function loadAllOtherVideos() {
    const allVideos = document.querySelectorAll("video");
    allVideos.forEach((video) => {
      if (
        video.id !== "new-first-video" &&
        video.id !== "new-video-works" &&
        video.id !== "new-video-data" &&
        video.id !== "sc-6-transition-video"
      ) {
        // На мобилке восстанавливаем src если он был сохранен
        if (window.innerWidth <= 991) {
          const originalSrc = video.getAttribute("data-original-src");
          if (originalSrc && !video.src) {
            video.src = originalSrc;
            const source = video.querySelector("source");
            const originalSourceSrc = source?.getAttribute("data-original-src");
            if (source && originalSourceSrc) {
              source.src = originalSourceSrc;
            }
          }
        }

        // Загружаем видео с низким приоритетом
        if (video.src) {
          video.load();
        }
      }
    });
  }

  function realPreloaderWaitAndStart() {
    const wrapperLoad =
      state.els.wrapper || document.querySelector(".wrapper-load-video-safari");
    const loaderWrapper =
      state.els.loaderWrapper || document.querySelector(".loader-wrapper");
    const buttonLoadWrapper =
      state.els.buttonLoadWrapper ||
      document.querySelector(".button-load-wrapper");
    const progressLine =
      state.els.progressLine || document.querySelector(".loader-progress-line");
    const startBtn = document.querySelector("#start-btn");

    const isMobile = isMobileWidth991();
    const needStartButton = isSafariLike || isMobile;
    const autoStart = !needStartButton;

    const v1 = $_("new-first-video");
    const v2 = $_("new-video-works");
    const v3 = $_("sc-6-transition-video");
    const vData = $_("new-video-data");

    if (isMobile) {
      // МОБИЛЬНАЯ ЛОГИКА: загружаем только first + work
      const mobileVideos = [v1, v2];
      const progress = makeRealProgressController(
        progressLine,
        mobileVideos.length
      );

      let completed = 0;
      const onOne = () => {
        progress.step();
        if (++completed >= mobileVideos.length) {
          onMobileVideosReady();
        }
      };

      mobileVideos.forEach((v) => waitOneVideoReady(v, onOne));

      function onMobileVideosReady() {
        progress.finish();

        // Дополнительная проверка - убеждаемся что полоска дошла до 100%
        setTimeout(() => {
          try {
            if (progressLine && typeof gsap !== "undefined") {
              gsap.to(progressLine, {
                width: "100%",
                duration: 0.2,
                ease: "none",
              });
            } else if (progressLine) {
              progressLine.style.width = "100%";
            }
          } catch {}
        }, 100);

        if (loaderWrapper) {
          if (typeof gsap !== "undefined") {
            gsap.to(loaderWrapper, {
              opacity: 0,
              duration: 0.5,
              onComplete() {
                loaderWrapper.style.display = "none";
                if (buttonLoadWrapper) {
                  gsap.set(buttonLoadWrapper, { display: "flex", opacity: 0 });
                  gsap.to(buttonLoadWrapper, { opacity: 1, duration: 0.5 });
                }
                showMobileStartButton();
              },
            });
          } else {
            loaderWrapper.style.display = "none";
            if (buttonLoadWrapper) buttonLoadWrapper.style.display = "flex";
            showMobileStartButton();
          }
        } else {
          showMobileStartButton();
        }
      }

      function showMobileStartButton() {
        if (startBtn) {
          startBtn.style.display = "block";
          if (typeof gsap !== "undefined") {
            gsap.fromTo(
              startBtn,
              { opacity: 0 },
              { opacity: 1, duration: 0.5 }
            );
          }
          startBtn.addEventListener(
            "click",
            function handleMobileStart() {
              if (typeof gsap !== "undefined") {
                gsap.to(startBtn, {
                  opacity: 0,
                  duration: 0.5,
                  onComplete() {
                    startBtn.style.display = "none";
                    startMobileDataLoad();
                  },
                });
              } else {
                startBtn.style.display = "none";
                startMobileDataLoad();
              }
            },
            { once: true }
          );
        } else {
          startMobileDataLoad();
        }
      }

      function startMobileDataLoad() {
        // Сначала загружаем data-video
        if (vData) {
          // Устанавливаем src для data-video на мобилке
          assignMediaSrc(vData, SAFARI_MOB_DATA_SRC, {
            removeAutoplay: isSafariLike,
          });

          waitOneVideoReady(vData, (success) => {
            if (success) {
              // После загрузки data-video загружаем все остальные
              loadAllOtherVideos();
              startIntro();
            } else {
              // Если data-video не загрузился, все равно продолжаем
              loadAllOtherVideos();
              startIntro();
            }
          });
        } else {
          loadAllOtherVideos();
          startIntro();
        }
      }
    } else {
      // ДЕСКТОПНАЯ ЛОГИКА: загружаем все видео сразу
      const desktopVideos = [v1, v2, v3, vData];
      const progress = makeRealProgressController(
        progressLine,
        desktopVideos.length
      );

      let completed = 0;
      const onOne = () => {
        progress.step();
        if (++completed >= desktopVideos.length) {
          onDesktopVideosReady();
        }
      };

      desktopVideos.forEach((v) => waitOneVideoReady(v, onOne));

      function onDesktopVideosReady() {
        progress.finish();

        // Дополнительная проверка - убеждаемся что полоска дошла до 100%
        setTimeout(() => {
          try {
            if (progressLine && typeof gsap !== "undefined") {
              gsap.to(progressLine, {
                width: "100%",
                duration: 0.2,
                ease: "none",
              });
            } else if (progressLine) {
              progressLine.style.width = "100%";
            }
          } catch {}
        }, 100);

        if (loaderWrapper) {
          if (typeof gsap !== "undefined") {
            gsap.to(loaderWrapper, {
              opacity: 0,
              duration: 0.5,
              onComplete() {
                loaderWrapper.style.display = "none";
                if (buttonLoadWrapper) {
                  gsap.set(buttonLoadWrapper, {
                    display: needStartButton ? "flex" : "none",
                    opacity: 0,
                  });
                  if (needStartButton)
                    gsap.to(buttonLoadWrapper, { opacity: 1, duration: 0.5 });
                }
                proceedDesktop();
              },
            });
          } else {
            loaderWrapper.style.display = "none";
            if (buttonLoadWrapper)
              buttonLoadWrapper.style.display = needStartButton
                ? "flex"
                : "none";
            proceedDesktop();
          }
        } else {
          proceedDesktop();
        }
      }

      function proceedDesktop() {
        if (needStartButton) {
          if (startBtn) {
            startBtn.style.display = "block";
            if (typeof gsap !== "undefined") {
              gsap.fromTo(
                startBtn,
                { opacity: 0 },
                { opacity: 1, duration: 0.5 }
              );
            }
            startBtn.addEventListener(
              "click",
              function handleStart() {
                if (typeof gsap !== "undefined") {
                  gsap.to(startBtn, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete() {
                      startBtn.style.display = "none";
                      startIntro();
                    },
                  });
                } else {
                  startBtn.style.display = "none";
                  startIntro();
                }
              },
              { once: true }
            );
          } else {
            startIntro();
          }
        } else {
          setTimeout(() => {
            startIntro();
          }, 300);
        }
      }
    }
  }

  /* ============================
       НОВОЕ: #pt-1 — сначала кликаем second reverse, затем жёстко выставляем кадры, скрываем триггеры и прыгаем на 50vh
     ============================ */
  function handlePt1Click() {
    // Задержка 0.4 секунды перед выполнением всей логики
    setTimeout(() => {
      // 1) Перехватываем пользовательские инпуты (3с), чтобы никто не мешал сценарию
      try {
        trapInputsOnly(3000);
      } catch {}
      // Отмечаем, что активен специальный сценарий pt-1 (для отключения подавления автокликов)
      try {
        pt1FlowActive = true;
      } catch {}

      const video = state.els.video; // #new-video-works
      const video2 = state.els.videoData; // #new-video-data
      const secondReverseEl = state.els.secondReverseTrigger;

      // 2) Параллельные клики с задержками:
      // 0мс: сразу 4 триггер, через 1.8 секунды - 4 реверс
      try {
        state.els.fourthTrigger && state.els.fourthTrigger.click();
      } catch {}
      setTimeout(() => {
        try {
          state.els.fourthTriggerReverse &&
            state.els.fourthTriggerReverse.click();
        } catch {}
      }, 1800);

      // 100мс: сразу 5 триггер, через 1.8 секунды - 5 реверс
      setTimeout(() => {
        try {
          state.els.fifthTrigger && state.els.fifthTrigger.click();
        } catch {}
      }, 100);
      setTimeout(() => {
        try {
          state.els.fifthTriggerReverse &&
            state.els.fifthTriggerReverse.click();
        } catch {}

        // После завершения всех кликов снова скрываем все триггеры
        setTimeout(() => {
          try {
            const toHide = [
              state.els.trigger,
              state.els.reverseTrigger,
              state.els.secondTrigger,
              state.els.secondReverseTrigger,
              state.els.thirdNav,
              state.els.thirdNavReverse,
              state.els.fourthTrigger,
              state.els.fourthTriggerReverse,
              state.els.fifthTrigger,
              state.els.fifthTriggerReverse,
              state.els.reverseTextAnim,
            ];
            toHide.forEach((el) => {
              if (el) el.style.display = "none";
            });
            if (state.els.reverseTrigger)
              state.els.reverseTrigger.style.display = "block";
            if (state.els.secondTrigger)
              state.els.secondTrigger.style.display = "block";
          } catch {}
        }, 100); // Небольшая задержка после последнего клика
      }, 1900);

      // СНАЧАЛА — имитируем пользовательский клик по second reverse
      try {
        secondReverseEl && secondReverseEl.click();
      } catch {}

      // 5) Сразу после клика — отменяем любые текущие реверсы/таймеры и выставляем нужные состояния
      try {
        // Гасим возможные reverseByTimer, запущенные обработчиком secondReverse
        abortReverse(video2);
        abortReverse(video);

        // data-видео — состояние «как после второго реверса»: кадр 0, пауза, без автоплея, без дата-лупа
        if (video2) {
          disableDataLoop(video2);
          try {
            video2.pause();
          } catch {}
          try {
            video2.removeAttribute("autoplay");
          } catch {}
          setTime(video2, 0);
        }

        // work-видео — мгновенно встать на старт лупа и включить сегментный луп
        if (video) {
          setTime(video, LOOP_START_TIME);
          ensureSegmentLoop(video);
          safePlay(video);
        }
      } catch {}

      // 6) Скрываем все триггеры, оставляем только first-reverse и second
      try {
        const toHide = [
          state.els.trigger,
          state.els.reverseTrigger,
          state.els.secondTrigger,
          state.els.secondReverseTrigger,
          state.els.thirdNav,
          state.els.thirdNavReverse,
          state.els.fourthTrigger,
          state.els.fourthTriggerReverse,
          state.els.fifthTrigger,
          state.els.fifthTriggerReverse,
          state.els.reverseTextAnim,
        ];
        toHide.forEach((el) => {
          if (el) el.style.display = "none";
        });
        if (state.els.reverseTrigger)
          state.els.reverseTrigger.style.display = "block";
        if (state.els.secondTrigger)
          state.els.secondTrigger.style.display = "block";
      } catch {}

      // 6.5) После разблокировки инпутов (через 3 секунды) снова скрываем все триггеры
      setTimeout(() => {
        try {
          const toHide = [
            state.els.trigger,
            state.els.reverseTrigger,
            state.els.secondTrigger,
            state.els.secondReverseTrigger,
            state.els.thirdNav,
            state.els.thirdNavReverse,
            state.els.fourthTrigger,
            state.els.fourthTriggerReverse,
            state.els.fifthTrigger,
            state.els.fifthTriggerReverse,
            state.els.reverseTextAnim,
          ];
          toHide.forEach((el) => {
            if (el) el.style.display = "none";
          });
          if (state.els.reverseTrigger)
            state.els.reverseTrigger.style.display = "block";
          if (state.els.secondTrigger)
            state.els.secondTrigger.style.display = "block";
        } catch {}
      }, 3000); // Через 3 секунды (время блокировки инпутов)

      // 7) После всего — резкий телепорт на 50vh (функция сейчас возвращает 50vh)
      try {
        const targetY = get100vhTargetY(); // возвращает 50vh по текущей реализации
        jumpTo(targetY, { smooth: false, lockMs: 1000 });
      } catch {}

      // 8) Деактивируем все навигационные точки и активируем p-1
      try {
        // Сначала деактивируем все p- элементы
        deactivateAllNavigationPoints();

        // Затем активируем p-1 с таймингом из клика
        activateNavigationPoint("p-1", "click");
      } catch {}

      // Снимаем флаг pt-1 после завершения шага (даём запас по времени)
      try {
        setTimeout(() => {
          pt1FlowActive = false;
        }, 1800);
      } catch {}
    }, 400); // Закрываем setTimeout с задержкой 0.4 секунды
  }

  /* ============================
       НОВОЕ: #pt-2 — сначала кликаем second trigger, затем жёстко выставляем кадры, скрываем триггеры и прыгаем на 100vh
     ============================ */
  function handlePt2Click() {
    // 1) Задержка 0.4 секунды перед выполнением всей логики
    setTimeout(() => {
      // 2) Перехватываем пользовательские инпуты (3с), чтобы никто не мешал сценарию
      try {
        trapInputsOnly(3000);
      } catch {}
      // Отмечаем, что активен специальный сценарий pt-2 (для отключения подавления автокликов)
      try {
        pt2FlowActive = true;
      } catch {}

      const video = state.els.video; // #new-video-works
      const video2 = state.els.videoData; // #new-video-data
      const secondTriggerEl = state.els.secondTrigger;

      // 3) Параллельные клики с задержками:
      // 0мс: сразу 4 триггер, через 1.8 секунды - 4 реверс
      try {
        state.els.fourthTrigger && state.els.fourthTrigger.click();
      } catch {}
      setTimeout(() => {
        try {
          state.els.fourthTriggerReverse &&
            state.els.fourthTriggerReverse.click();
        } catch {}
      }, 1800);

      // 100мс: сразу 5 триггер, через 1.8 секунды - 5 реверс
      setTimeout(() => {
        try {
          state.els.fifthTrigger && state.els.fifthTrigger.click();
        } catch {}
      }, 100);
      setTimeout(() => {
        try {
          state.els.fifthTriggerReverse &&
            state.els.fifthTriggerReverse.click();
        } catch {}

        // После завершения всех кликов снова скрываем все триггеры
        setTimeout(() => {
          try {
            const toHide = [
              state.els.trigger,
              state.els.reverseTrigger,
              state.els.secondTrigger,
              state.els.secondReverseTrigger,
              state.els.thirdNav,
              state.els.thirdNavReverse,
              state.els.fourthTrigger,
              state.els.fourthTriggerReverse,
              state.els.fifthTrigger,
              state.els.fifthTriggerReverse,
              state.els.reverseTextAnim,
            ];
            toHide.forEach((el) => {
              if (el) el.style.display = "none";
            });
            if (state.els.secondReverseTrigger)
              state.els.secondReverseTrigger.style.display = "block";
            if (state.els.thirdNav) state.els.thirdNav.style.display = "block";
          } catch {}
        }, 100); // Небольшая задержка после последнего клика
      }, 1900);

      // Кликаем по second trigger (не реверс) - без задержки
      try {
        secondTriggerEl && secondTriggerEl.click();
      } catch {}

      // 4) Управление видео - как только кликнули сразу выставляем data-video кадры для лупа
      try {
        // Гасим возможные reverseByTimer
        abortReverse(video2);
        abortReverse(video);

        // data-видео — выставляем кадры для лупа
        if (video2) {
          ensureDataLoop(video2);
          try {
            video2.removeAttribute("autoplay");
          } catch {}
          setTime(video2, 0);
          safePlay(video2);
        }

        // work-видео — отключаем сегментный луп и останавливаем на последнем кадре
        if (video) {
          disableSegmentLoop(video);
          try {
            video.pause();
          } catch {}
          // Устанавливаем время на последний кадр (duration - 0.1 секунды для надежности)
          try {
            const duration = video.duration || 0;
            const lastFrameTime = Math.max(0, duration - 0.1);
            setTime(video, lastFrameTime);
          } catch {}
        }
      } catch {}

      // 5) Скрываем все триггеры, оставляем только second-reverse и third
      try {
        const toHide = [
          state.els.trigger,
          state.els.reverseTrigger,
          state.els.secondTrigger,
          state.els.secondReverseTrigger,
          state.els.thirdNav,
          state.els.thirdNavReverse,
          state.els.fourthTrigger,
          state.els.fourthTriggerReverse,
          state.els.fifthTrigger,
          state.els.fifthTriggerReverse,
          state.els.reverseTextAnim,
        ];
        toHide.forEach((el) => {
          if (el) el.style.display = "none";
        });
        if (state.els.secondReverseTrigger)
          state.els.secondReverseTrigger.style.display = "block";
        if (state.els.thirdNav) state.els.thirdNav.style.display = "block";
      } catch {}

      // 5.5) После разблокировки инпутов (через 3 секунды) снова скрываем все триггеры
      setTimeout(() => {
        try {
          const toHide = [
            state.els.trigger,
            state.els.reverseTrigger,
            state.els.secondTrigger,
            state.els.secondReverseTrigger,
            state.els.thirdNav,
            state.els.thirdNavReverse,
            state.els.fourthTrigger,
            state.els.fourthTriggerReverse,
            state.els.fifthTrigger,
            state.els.fifthTriggerReverse,
            state.els.reverseTextAnim,
          ];
          toHide.forEach((el) => {
            if (el) el.style.display = "none";
          });
          if (state.els.secondReverseTrigger)
            state.els.secondReverseTrigger.style.display = "block";
          if (state.els.thirdNav) state.els.thirdNav.style.display = "block";
        } catch {}
      }, 3000); // Через 3 секунды (время блокировки инпутов)

      // 6) Телепорт на 100vh
      try {
        const targetY = get101vhTargetY(); // возвращает 100vh
        jumpTo(targetY, { smooth: false, lockMs: 1000 });
      } catch {}

      // 7) Управление навигационными точками - делаем активной вторую точку
      try {
        // Сначала деактивируем все p- элементы
        deactivateAllNavigationPoints();

        // Затем активируем p-2 с таймингом из клика
        activateNavigationPoint("p-2", "click");
      } catch {}

      // 8) Завершение - снимаем флаг pt-2 после завершения шага (даём запас по времени)
      try {
        setTimeout(() => {
          pt2FlowActive = false;
        }, 1800);
      } catch {}
    }, 400); // Закрываем setTimeout с задержкой 0.4 секунды
  }

  /* ============================
       НОВОЕ: #pt-3 — сначала кликаем second trigger, затем жёстко выставляем кадры, скрываем триггеры и прыгаем на 160vh
     ============================ */

  // Отладочная функция для pt-3
  function pt3DebugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const timeSinceStart = performance.now().toFixed(0);
    const logMessage = `[PT-3 DEBUG ${timestamp} +${timeSinceStart}ms] ${message}`;

    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Глобальный перехватчик кликов для отладки pt-3
  function setupPt3ClickDebugger() {
    const triggerSelectors = [
      ".trigger_transtion-fisrt",
      ".trigger_transtion-fisrt_reverse",
      ".trigger_transtion-second",
      ".trigger_transtion-second_reverse",
      ".trigger-3-navigation",
      ".trigger-3-navigation-reverse",
      ".trigger-4-transiton",
      ".trigger-4-transiton_reverse",
      ".trigger-4-transition",
      ".trigger-4-transition_reverse",
      ".trigger-5-transition",
      ".trigger-5-transition_reverse",
    ];

    triggerSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.addEventListener(
          "click",
          function (e) {
            const timestamp = new Date().toLocaleTimeString();
            const timeSinceStart = performance.now().toFixed(0);
            const isPt3Active = pt3FlowActive;
            const display = window.getComputedStyle(this).display;

            console.log(
              `[PT-3 CLICK DEBUG ${timestamp} +${timeSinceStart}ms] Клик по триггеру:`,
              {
                selector: selector,
                element: this,
                display: display,
                pt3Active: isPt3Active,
                event: e,
              }
            );
          },
          { passive: true }
        );
      });
    });
  }

  // Отладочная функция для pt-4
  function pt4DebugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const timeSinceStart = performance.now().toFixed(0);
    const logMessage = `[PT-4 DEBUG ${timestamp} +${timeSinceStart}ms] ${message}`;

    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Отладочная функция для pt-5
  function pt5DebugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const timeSinceStart = performance.now().toFixed(0);
    const logMessage = `[PT-5 DEBUG ${timestamp} +${timeSinceStart}ms] ${message}`;

    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Отладочная функция для pt-d
  function ptDDebugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const timeSinceStart = performance.now().toFixed(0);
    const logMessage = `[PT-D DEBUG ${timestamp} +${timeSinceStart}ms] ${message}`;

    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  // Глобальный перехватчик кликов для отладки pt-4
  function setupPt4ClickDebugger() {
    const triggerSelectors = [
      ".trigger_transtion-fisrt",
      ".trigger_transtion-fisrt_reverse",
      ".trigger_transtion-second",
      ".trigger_transtion-second_reverse",
      ".trigger-3-navigation",
      ".trigger-3-navigation-reverse",
      ".trigger-4-transiton",
      ".trigger-4-transiton_reverse",
      ".trigger-4-transition",
      ".trigger-4-transition_reverse",
      ".trigger-5-transition",
      ".trigger-5-transition_reverse",
    ];

    triggerSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.addEventListener(
          "click",
          function (e) {
            const timestamp = new Date().toLocaleTimeString();
            const timeSinceStart = performance.now().toFixed(0);
            const isPt4Active = pt4FlowActive;
            const display = window.getComputedStyle(this).display;

            console.log(
              `[PT-4 CLICK DEBUG ${timestamp} +${timeSinceStart}ms] Клик по триггеру:`,
              {
                selector: selector,
                element: this,
                display: display,
                pt4Active: isPt4Active,
                event: e,
              }
            );
          },
          { passive: true }
        );
      });
    });
  }

  // Глобальный перехватчик кликов для отладки pt-5
  function setupPt5ClickDebugger() {
    const triggerSelectors = [
      ".trigger_transtion-fisrt",
      ".trigger_transtion-fisrt_reverse",
      ".trigger_transtion-second",
      ".trigger_transtion-second_reverse",
      ".trigger-3-navigation",
      ".trigger-3-navigation-reverse",
      ".trigger-4-transiton",
      ".trigger-4-transiton_reverse",
      ".trigger-4-transition",
      ".trigger-4-transition_reverse",
      ".trigger-5-transition",
      ".trigger-5-transition_reverse",
    ];

    triggerSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.addEventListener(
          "click",
          function (e) {
            const timestamp = new Date().toLocaleTimeString();
            const timeSinceStart = performance.now().toFixed(0);
            const isPt5Active = pt5FlowActive;
            const display = window.getComputedStyle(this).display;

            console.log(
              `[PT-5 CLICK DEBUG ${timestamp} +${timeSinceStart}ms] Клик по триггеру:`,
              {
                selector: selector,
                element: this,
                display: display,
                pt5Active: isPt5Active,
                event: e,
              }
            );
          },
          { passive: true }
        );
      });
    });
  }

  // Глобальный перехватчик кликов для отладки pt-d
  function setupPtDClickDebugger() {
    const triggerSelectors = [
      ".trigger_transtion-fisrt",
      ".trigger_transtion-fisrt_reverse",
      ".trigger_transtion-second",
      ".trigger_transtion-second_reverse",
      ".trigger-3-navigation",
      ".trigger-3-navigation-reverse",
      ".trigger-4-transiton",
      ".trigger-4-transiton_reverse",
      ".trigger-4-transition",
      ".trigger-4-transition_reverse",
      ".trigger-5-transition",
      ".trigger-5-transition_reverse",
    ];

    triggerSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.addEventListener(
          "click",
          function (e) {
            const timestamp = new Date().toLocaleTimeString();
            const timeSinceStart = performance.now().toFixed(0);
            const isPtDActive = ptDFlowActive;
            const display = window.getComputedStyle(this).display;

            console.log(
              `[PT-D CLICK DEBUG ${timestamp} +${timeSinceStart}ms] Клик по триггеру:`,
              {
                selector: selector,
                element: this,
                display: display,
                ptDActive: isPtDActive,
                event: e,
              }
            );
          },
          { passive: true }
        );
      });
    });
  }

  function handlePt3Click() {
    pt3DebugLog("PT-3 клик начат");

    // 1) Задержка 0.4 секунды перед выполнением всей логики
    setTimeout(() => {
      pt3DebugLog("PT-3 основная логика началась (после 400ms задержки)");
      // 2) Перехватываем пользовательские инпуты (3с), чтобы никто не мешал сценарию
      try {
        trapInputsOnly(3000);
      } catch {}
      // Отмечаем, что активен специальный сценарий pt-3 (для отключения подавления автокликов)
      try {
        pt3FlowActive = true;
        pt3DebugLog("PT-3 флаг активности установлен");
      } catch {}

      // Скрываем .new_section_sc6-dashbord при старте
      try {
        const sc6Dashboard = document.querySelector(
          ".new_section_sc6-dashbord"
        );
        if (sc6Dashboard) {
          sc6Dashboard.style.display = "none";
          pt3DebugLog("Скрыли .new_section_sc6-dashbord при старте");
        }
      } catch {}

      // Скрываем .new_section_how-it-works при старте
      try {
        const howItWorks = document.querySelector(".new_section_how-it-works");
        if (howItWorks) {
          howItWorks.style.display = "none";
          pt3DebugLog("Скрыли .new_section_how-it-works при старте");
        }
      } catch {}

      const secondTriggerEl = state.els.secondTrigger;
      const fourthTriggerReverseEl = state.els.fourthTriggerReverse;
      const fifthTriggerEl = state.els.fifthTrigger;
      const fifthTriggerReverseEl = state.els.fifthTriggerReverse;

      // 3) Проверяем видимость 4-го реверс триггера и кликаем соответственно
      let shouldClickFourthReverse = false;
      try {
        if (fourthTriggerReverseEl) {
          const display = window.getComputedStyle(
            fourthTriggerReverseEl
          ).display;
          shouldClickFourthReverse = display !== "none";
          pt3DebugLog("Проверка 4-го реверс триггера", {
            display: display,
            shouldClick: shouldClickFourthReverse,
            elementExists: !!fourthTriggerReverseEl,
          });
        }
      } catch {}

      // Кликаем по second trigger сразу
      try {
        if (secondTriggerEl) {
          pt3DebugLog("Кликаем по second trigger");
          secondTriggerEl.click();
        }
      } catch {}

      // Кликаем по 5-му триггеру сразу
      try {
        if (fifthTriggerEl) {
          pt3DebugLog("Кликаем по 5-му триггеру");
          fifthTriggerEl.click();
        }
      } catch {}

      // Кликаем по 4-му реверс триггеру сразу (если он видим)
      if (shouldClickFourthReverse) {
        try {
          if (fourthTriggerReverseEl) {
            pt3DebugLog("Кликаем по 4-му реверс триггеру (видим)");
            fourthTriggerReverseEl.click();
          }
        } catch {}
      } else {
        pt3DebugLog("НЕ кликаем по 4-му реверс триггеру (скрыт)");
      }

      // Через 1800мс кликаем на 5-й триггер реверс
      setTimeout(() => {
        pt3DebugLog("Через 1800ms - кликаем по 5-му реверс триггеру");
        try {
          if (fifthTriggerReverseEl) {
            fifthTriggerReverseEl.click();
          }
        } catch {}

        // После завершения всех кликов снова скрываем все триггеры
        setTimeout(() => {
          pt3DebugLog(
            "Скрываем все триггеры после завершения кликов (через 100ms)"
          );
          try {
            const toHide = [
              state.els.trigger,
              state.els.reverseTrigger,
              state.els.secondTrigger,
              state.els.secondReverseTrigger,
              state.els.thirdNav,
              state.els.thirdNavReverse,
              state.els.fourthTrigger,
              state.els.fourthTriggerReverse,
              state.els.fifthTrigger,
              state.els.fifthTriggerReverse,
              state.els.reverseTextAnim,
            ];
            toHide.forEach((el) => {
              if (el) el.style.display = "none";
            });
            if (state.els.thirdNavReverse)
              state.els.thirdNavReverse.style.display = "block";
            if (state.els.fourthTrigger)
              state.els.fourthTrigger.style.display = "block";
            if (state.els.secondReverseTrigger)
              state.els.secondReverseTrigger.style.display = "block";
          } catch {}
        }, 100); // Небольшая задержка после последнего клика
      }, 1800);

      // 6) Скрываем все триггеры, оставляем только third-reverse и fourth
      pt3DebugLog(
        "Скрываем все триггеры, оставляем только third-reverse, fourth и second-reverse"
      );
      try {
        const toHide = [
          state.els.trigger,
          state.els.reverseTrigger,
          state.els.secondTrigger,
          state.els.secondReverseTrigger,
          state.els.thirdNav,
          state.els.thirdNavReverse,
          state.els.fourthTrigger,
          state.els.fourthTriggerReverse,
          state.els.fifthTrigger,
          state.els.fifthTriggerReverse,
          state.els.reverseTextAnim,
        ];
        toHide.forEach((el) => {
          if (el) el.style.display = "none";
        });
        if (state.els.thirdNavReverse)
          state.els.thirdNavReverse.style.display = "block";
        if (state.els.fourthTrigger)
          state.els.fourthTrigger.style.display = "block";
        if (state.els.secondReverseTrigger)
          state.els.secondReverseTrigger.style.display = "block";
      } catch {}

      // 6.5) После разблокировки инпутов (через 3 секунды) снова скрываем все триггеры
      setTimeout(() => {
        pt3DebugLog(
          "Разблокировка инпутов - снова скрываем все триггеры (через 3000ms)"
        );
        try {
          const toHide = [
            state.els.trigger,
            state.els.reverseTrigger,
            state.els.secondTrigger,
            state.els.secondReverseTrigger,
            state.els.thirdNav,
            state.els.thirdNavReverse,
            state.els.fourthTrigger,
            state.els.fourthTriggerReverse,
            state.els.fifthTrigger,
            state.els.fifthTriggerReverse,
            state.els.reverseTextAnim,
          ];
          toHide.forEach((el) => {
            if (el) el.style.display = "none";
          });
          if (state.els.thirdNavReverse)
            state.els.thirdNavReverse.style.display = "block";
          if (state.els.fourthTrigger)
            state.els.fourthTrigger.style.display = "block";
          if (state.els.secondReverseTrigger)
            state.els.secondReverseTrigger.style.display = "block";
        } catch {}

        // Показываем .new_section_sc6-dashbord при разблокировке инпутов
        try {
          const sc6Dashboard = document.querySelector(
            ".new_section_sc6-dashbord"
          );
          if (sc6Dashboard) {
            sc6Dashboard.style.display = "flex";
            pt3DebugLog(
              "Показали .new_section_sc6-dashbord при разблокировке инпутов"
            );
          }
        } catch {}

        // Показываем .new_section_how-it-works при разблокировке инпутов
        try {
          const howItWorks = document.querySelector(
            ".new_section_how-it-works"
          );
          if (howItWorks) {
            howItWorks.style.display = "flex";
            pt3DebugLog(
              "Показали .new_section_how-it-works при разблокировке инпутов"
            );
          }
        } catch {}
      }, 3000); // Через 3 секунды (время блокировки инпутов)

      // 7) Телепорт на 200vh
      try {
        const doc = document.scrollingElement || document.documentElement;
        const vh = window.innerHeight;
        const maxY = Math.max(0, doc.scrollHeight - vh);
        const targetY = Math.min(Math.round(vh * 2.6), maxY); // 200vh
        pt3DebugLog("Телепорт на 200vh", { targetY: targetY, vh: vh });
        jumpTo(targetY, { smooth: false, lockMs: 1000 });
      } catch {}

      // 8) Управление навигационными точками - делаем активной третью точку
      try {
        pt3DebugLog("Управление навигационными точками - активируем p-3");
        // Сначала деактивируем все p- элементы
        deactivateAllNavigationPoints();

        // Затем активируем p-3 с таймингом из клика
        activateNavigationPoint("p-3", "click");
      } catch {}

      // 9) Завершение - снимаем флаг pt-3 после разблокировки инпутов (даём запас по времени)
      try {
        setTimeout(() => {
          pt3DebugLog("PT-3 флаг активности снят");
          pt3FlowActive = false;
        }, 3400); // Держим флаг активным до разблокировки инпутов (3000ms) + запас
      } catch {}
    }, 400); // Закрываем setTimeout с задержкой 0.4 секунды
  }

  function handlePt4Click() {
    pt4DebugLog("PT-4 клик начат");

    // 1) Задержка 0.4 секунды перед выполнением всей логики
    setTimeout(() => {
      pt4DebugLog("PT-4 основная логика началась (после 400ms задержки)");
      // 2) Перехватываем пользовательские инпуты (3с), чтобы никто не мешал сценарию
      try {
        trapInputsOnly(3000);
      } catch {}
      // 3) Отмечаем, что активен специальный сценарий pt-4 (для отключения подавления автокликов)
      try {
        pt4FlowActive = true;
        pt4DebugLog("PT-4 флаг активности установлен");
      } catch {}

      // 4) Скрываем .new_section_sc6-dashbord при старте
      try {
        const sc6Dashboard = document.querySelector(
          ".new_section_sc6-dashbord"
        );
        if (sc6Dashboard) {
          sc6Dashboard.style.display = "none";
          pt4DebugLog("Скрыли .new_section_sc6-dashbord при старте");
        }
      } catch {}

      // Скрываем .new_section_how-it-works при старте
      try {
        const howItWorks = document.querySelector(".new_section_how-it-works");
        if (howItWorks) {
          howItWorks.style.display = "none";
          pt4DebugLog("Скрыли .new_section_how-it-works при старте");
        }
      } catch {}

      const secondTriggerEl = state.els.secondTrigger;
      const fourthTriggerEl = state.els.fourthTrigger;
      const fifthTriggerEl = state.els.fifthTrigger;
      const fifthTriggerReverseEl = state.els.fifthTriggerReverse;

      // 5) Проверяем видимость 5-го реверс триггера и кликаем соответственно
      let shouldClickFifthReverse = false;
      try {
        if (fifthTriggerReverseEl) {
          const display = window.getComputedStyle(
            fifthTriggerReverseEl
          ).display;
          shouldClickFifthReverse = display !== "none";
          pt4DebugLog("Проверка 5-го реверс триггера", {
            display: display,
            shouldClick: shouldClickFifthReverse,
            elementExists: !!fifthTriggerReverseEl,
          });
        }
      } catch {}

      // Сразу: клик по secondTrigger
      try {
        if (secondTriggerEl) {
          pt4DebugLog("Кликаем по second trigger");
          secondTriggerEl.click();
        }
      } catch {}

      // Сразу: клик по trigger-4
      try {
        if (fourthTriggerEl) {
          pt4DebugLog("Кликаем по trigger-4");
          fourthTriggerEl.click();
        }
      } catch {}

      // Сразу: клик по trigger-5-reverse (если он видим)
      if (shouldClickFifthReverse) {
        try {
          if (fifthTriggerReverseEl) {
            pt4DebugLog("Кликаем по trigger-5-reverse (видим)");
            fifthTriggerReverseEl.click();
          }
        } catch {}
      } else {
        pt4DebugLog("5-й реверс триггер не видим - пропускаем клик");
      }

      // 6) Скрываем все триггеры, показываем trigger-4-reverse и trigger-5
      pt4DebugLog(
        "Скрываем все триггеры, показываем trigger-4-reverse и trigger-5"
      );
      try {
        const toHide = [
          state.els.trigger,
          state.els.reverseTrigger,
          state.els.secondTrigger,
          state.els.secondReverseTrigger,
          state.els.thirdNav,
          state.els.thirdNavReverse,
          state.els.fourthTrigger,
          state.els.fourthTriggerReverse,
          state.els.fifthTrigger,
          state.els.fifthTriggerReverse,
          state.els.reverseTextAnim,
        ];
        toHide.forEach((el) => {
          if (el) el.style.display = "none";
        });
        if (state.els.fourthTriggerReverse)
          state.els.fourthTriggerReverse.style.display = "block";
        if (state.els.fifthTrigger)
          state.els.fifthTrigger.style.display = "block";
      } catch {}

      // После разблокировки инпутов (через 3 секунды) снова скрываем все триггеры
      setTimeout(() => {
        pt4DebugLog(
          "Разблокировка инпутов - снова скрываем все триггеры (через 3000ms)"
        );
        try {
          const toHide = [
            state.els.trigger,
            state.els.reverseTrigger,
            state.els.secondTrigger,
            state.els.secondReverseTrigger,
            state.els.thirdNav,
            state.els.thirdNavReverse,
            state.els.fourthTrigger,
            state.els.fourthTriggerReverse,
            state.els.fifthTrigger,
            state.els.fifthTriggerReverse,
            state.els.reverseTextAnim,
          ];
          toHide.forEach((el) => {
            if (el) el.style.display = "none";
          });
          if (state.els.fourthTriggerReverse)
            state.els.fourthTriggerReverse.style.display = "block";
          if (state.els.fifthTrigger)
            state.els.fifthTrigger.style.display = "block";
        } catch {}

        // Показываем .new_section_sc6-dashbord при разблокировке инпутов
        try {
          const sc6Dashboard = document.querySelector(
            ".new_section_sc6-dashbord"
          );
          if (sc6Dashboard) {
            sc6Dashboard.style.display = "flex";
            pt4DebugLog(
              "Показали .new_section_sc6-dashbord при разблокировке инпутов"
            );
          }
        } catch {}

        // Показываем .new_section_how-it-works при разблокировке инпутов
        try {
          const howItWorks = document.querySelector(
            ".new_section_how-it-works"
          );
          if (howItWorks) {
            howItWorks.style.display = "flex";
            pt4DebugLog(
              "Показали .new_section_how-it-works при разблокировке инпутов"
            );
          }
        } catch {}
      }, 3000); // Через 3 секунды (время блокировки инпутов)

      // 7) Телепорт на 360vh
      try {
        const doc = document.scrollingElement || document.documentElement;
        const vh = window.innerHeight;
        const maxY = Math.max(0, doc.scrollHeight - vh);
        const targetY = Math.min(Math.round(vh * 3.6), maxY); // 360vh
        pt4DebugLog("Телепорт на 360vh", { targetY: targetY, vh: vh });
        jumpTo(targetY, { smooth: false, lockMs: 1000 });
      } catch {}

      // 8) Управление навигационными точками - делаем активной четвертую точку
      try {
        pt4DebugLog("Управление навигационными точками - активируем p-4");
        // Сначала деактивируем все p- элементы
        deactivateAllNavigationPoints();

        // Затем активируем p-4 с таймингом из клика
        activateNavigationPoint("p-4", "click");
      } catch {}

      // 9) Завершение - снимаем флаг pt-4 после разблокировки инпутов (даём запас по времени)
      try {
        setTimeout(() => {
          pt4DebugLog("PT-4 флаг активности снят");
          pt4FlowActive = false;
        }, 3400); // Держим флаг активным до разблокировки инпутов (3000ms) + запас
      } catch {}
    }, 400); // Закрываем setTimeout с задержкой 0.4 секунды
  }

  function handlePt5Click() {
    pt5DebugLog("PT-5 клик начат");

    // 1) Задержка 0.4 секунды перед выполнением всей логики
    setTimeout(() => {
      pt5DebugLog("PT-5 основная логика началась (после 400ms задержки)");

      // Устанавливаем opacity 1 для указанных элементов
      try {
        const ermVideoCopy = document.querySelector(".erm_video-copy");
        if (ermVideoCopy) {
          ermVideoCopy.style.opacity = "1";
          pt5DebugLog("Установили opacity 1 для .erm_video-copy");
        }

        const sc6TextContent = document.querySelector(".sc-6_text-content");
        if (sc6TextContent) {
          sc6TextContent.style.opacity = "1";
          pt5DebugLog("Установили opacity 1 для .sc-6_text-content");
        }
      } catch {}

      // 2) Перехватываем пользовательские инпуты (3с), чтобы никто не мешал сценарию
      try {
        trapInputsOnly(3000);
      } catch {}
      // 3) Отмечаем, что активен специальный сценарий pt-5 (для отключения подавления автокликов)
      try {
        pt5FlowActive = true;
        pt5DebugLog("PT-5 флаг активности установлен");
      } catch {}

      // 4) Скрываем элементы при старте
      try {
        const testSection = document.querySelector(".test");
        if (testSection) {
          testSection.style.display = "none";
          pt5DebugLog("Скрыли .test при старте");
        }

        const howItWorks = document.querySelector(".new_section_how-it-works");
        if (howItWorks) {
          howItWorks.style.display = "none";
          pt5DebugLog("Скрыли .new_section_how-it-works при старте");
        }

        const cardLayout = document.querySelector(".card-wrapper");
        if (cardLayout) {
          cardLayout.style.display = "none";
          pt5DebugLog("Скрыли .card-wrapper при старте");
        }

        const cardBlockText = document.querySelector(
          ".new_card-block_text-content"
        );
        if (cardBlockText) {
          cardBlockText.style.display = "none";
          pt5DebugLog("Скрыли .new_card-block_text-content при старте");
        }
      } catch {}

      const secondTriggerEl = state.els.secondTrigger;
      const fourthTriggerEl = state.els.fourthTrigger;
      const fifthTriggerEl = state.els.fifthTrigger;

      // Сразу: клик по secondTrigger
      try {
        if (secondTriggerEl) {
          pt5DebugLog("Кликаем по second trigger");
          secondTriggerEl.click();
        }
      } catch {}

      // Сразу: клик по trigger-4
      try {
        if (fourthTriggerEl) {
          pt5DebugLog("Кликаем по trigger-4");
          fourthTriggerEl.click();
        }
      } catch {}

      // Сразу: клик по trigger-5 (всегда)
      try {
        if (fifthTriggerEl) {
          pt5DebugLog("Кликаем по trigger-5 (всегда)");
          fifthTriggerEl.click();
        }
      } catch {}

      // 6) Скрываем все триггеры, показываем только trigger-5-reverse
      pt5DebugLog("Скрываем все триггеры, показываем только trigger-5-reverse");
      try {
        const toHide = [
          state.els.trigger,
          state.els.reverseTrigger,
          state.els.secondTrigger,
          state.els.secondReverseTrigger,
          state.els.thirdNav,
          state.els.thirdNavReverse,
          state.els.fourthTrigger,
          state.els.fourthTriggerReverse,
          state.els.fifthTrigger,
          state.els.reverseTextAnim,
        ];
        toHide.forEach((el) => {
          if (el) el.style.display = "none";
        });
        if (state.els.fifthTriggerReverse)
          state.els.fifthTriggerReverse.style.display = "block";
      } catch {}

      // После разблокировки инпутов (через 3 секунды) снова скрываем все триггеры
      setTimeout(() => {
        pt5DebugLog(
          "Разблокировка инпутов - снова скрываем все триггеры (через 3000ms)"
        );
        try {
          const toHide = [
            state.els.trigger,
            state.els.reverseTrigger,
            state.els.secondTrigger,
            state.els.secondReverseTrigger,
            state.els.thirdNav,
            state.els.thirdNavReverse,
            state.els.fourthTrigger,
            state.els.fourthTriggerReverse,
            state.els.fifthTrigger,
            state.els.reverseTextAnim,
          ];
          toHide.forEach((el) => {
            if (el) el.style.display = "none";
          });
          if (state.els.fifthTriggerReverse)
            state.els.fifthTriggerReverse.style.display = "block";
        } catch {}

        // Показываем элементы при разблокировке инпутов
        try {
          const testSection = document.querySelector(".test");
          if (testSection) {
            testSection.style.display = "flex";
            pt5DebugLog("Показали .test при разблокировке инпутов");
          }

          const howItWorks = document.querySelector(
            ".new_section_how-it-works"
          );
          if (howItWorks) {
            howItWorks.style.display = "flex";
            pt5DebugLog(
              "Показали .new_section_how-it-works при разблокировке инпутов"
            );
          }

          const cardLayout = document.querySelector(".card-wrapper");
          if (cardLayout) {
            cardLayout.style.display = "flex";
            pt5DebugLog("Показали .card-wrapper при разблокировке инпутов");
          }

          const cardBlockText = document.querySelector(
            ".new_card-block_text-content"
          );
          if (cardBlockText) {
            cardBlockText.style.display = "flex";
            pt5DebugLog(
              "Показали .new_card-block_text-content при разблокировке инпутов"
            );
          }
        } catch {}
      }, 3000); // Через 3 секунды (время блокировки инпутов)

      // 7) Телепорт на 460vh
      try {
        const doc = document.scrollingElement || document.documentElement;
        const vh = window.innerHeight;
        const maxY = Math.max(0, doc.scrollHeight - vh);
        const targetY = Math.min(Math.round(vh * 4.6), maxY); // 460vh
        pt5DebugLog("Телепорт на 460vh", { targetY: targetY, vh: vh });
        jumpTo(targetY, { smooth: false, lockMs: 1000 });
      } catch {}

      // 8) Управление навигационными точками - делаем активной пятую точку
      try {
        pt5DebugLog("Управление навигационными точками - активируем p-5");
        // Сначала деактивируем все p- элементы
        deactivateAllNavigationPoints();

        // Затем активируем p-5 с таймингом из клика
        activateNavigationPoint("p-5", "click");
      } catch {}

      // 9) Завершение - снимаем флаг pt-5 после разблокировки инпутов (даём запас по времени)
      try {
        setTimeout(() => {
          pt5DebugLog("PT-5 флаг активности снят");
          pt5FlowActive = false;
        }, 3400); // Держим флаг активным до разблокировки инпутов (3000ms) + запас
      } catch {}
    }, 400); // Закрываем setTimeout с задержкой 0.4 секунды
  }

  function handlePtDClick() {
    ptDDebugLog("PT-D клик начат");

    // 1) Задержка 0.4 секунды перед выполнением всей логики
    setTimeout(() => {
      ptDDebugLog("PT-D основная логика началась (после 400ms задержки)");

      // 2) Перехватываем пользовательские инпуты (3с), чтобы никто не мешал сценарию
      try {
        trapInputsOnly(3000);
      } catch {}

      // 3) Отмечаем, что активен специальный сценарий pt-d (для отключения подавления автокликов)
      try {
        ptDFlowActive = true;
        ptDDebugLog("PT-D флаг активности установлен");
      } catch {}

      const secondTriggerEl = state.els.secondTrigger;
      const fourthTriggerEl = state.els.fourthTrigger;
      const fifthTriggerEl = state.els.fifthTrigger;

      // Сразу: клик по secondTrigger
      try {
        if (secondTriggerEl) {
          ptDDebugLog("Кликаем по second trigger");
          secondTriggerEl.click();
        }
      } catch {}

      // Сразу: клик по trigger-4
      try {
        if (fourthTriggerEl) {
          ptDDebugLog("Кликаем по trigger-4");
          fourthTriggerEl.click();
        }
      } catch {}

      // Сразу: клик по trigger-5 (всегда)
      try {
        if (fifthTriggerEl) {
          ptDDebugLog("Кликаем по trigger-5 (всегда)");
          fifthTriggerEl.click();
        }
      } catch {}

      // 6) Скрываем все триггеры, показываем только trigger-5-reverse
      ptDDebugLog("Скрываем все триггеры, показываем только trigger-5-reverse");
      try {
        const toHide = [
          state.els.trigger,
          state.els.reverseTrigger,
          state.els.secondTrigger,
          state.els.secondReverseTrigger,
          state.els.thirdNav,
          state.els.thirdNavReverse,
          state.els.fourthTrigger,
          state.els.fourthTriggerReverse,
          state.els.fifthTrigger,
          state.els.reverseTextAnim,
        ];
        toHide.forEach((el) => {
          if (el) el.style.display = "none";
        });
        if (state.els.fifthTriggerReverse)
          state.els.fifthTriggerReverse.style.display = "block";
      } catch {}

      // После разблокировки инпутов (через 3 секунды) снова скрываем все триггеры
      setTimeout(() => {
        ptDDebugLog(
          "Разблокировка инпутов - снова скрываем все триггеры (через 3000ms)"
        );
        try {
          const toHide = [
            state.els.trigger,
            state.els.reverseTrigger,
            state.els.secondTrigger,
            state.els.secondReverseTrigger,
            state.els.thirdNav,
            state.els.thirdNavReverse,
            state.els.fourthTrigger,
            state.els.fourthTriggerReverse,
            state.els.fifthTrigger,
            state.els.reverseTextAnim,
          ];
          toHide.forEach((el) => {
            if (el) el.style.display = "none";
          });
          if (state.els.fifthTriggerReverse)
            state.els.fifthTriggerReverse.style.display = "block";
        } catch {}
      }, 3000); // Через 3 секунды (время блокировки инпутов)

      // 7) Телепорт на 600vh
      try {
        const doc = document.scrollingElement || document.documentElement;
        const vh = window.innerHeight;
        const maxY = Math.max(0, doc.scrollHeight - vh);
        const targetY = Math.min(Math.round(vh * 6.9), maxY); // 600vh
        ptDDebugLog("Телепорт на 600vh", { targetY: targetY, vh: vh });
        jumpTo(targetY, { smooth: false, lockMs: 1000 });
      } catch {}

      // 8) Управление навигационными точками - делаем активной пятую точку
      try {
        ptDDebugLog("Управление навигационными точками - активируем p-5");
        // Сначала деактивируем все p- элементы
        deactivateAllNavigationPoints();

        // Затем активируем p-5 с таймингом из клика
        activateNavigationPoint("p-5", "click");
      } catch {}

      // 9) Завершение - снимаем флаг pt-d после разблокировки инпутов (даём запас по времени)
      try {
        setTimeout(() => {
          ptDDebugLog("PT-D флаг активности снят");
          ptDFlowActive = false;
        }, 3400); // Держим флаг активным до разблокировки инпутов (3000ms) + запас
      } catch {}
    }, 400); // Закрываем setTimeout с задержкой 0.4 секунды
  }

  /* ============================
       INIT
     ============================ */
  document.addEventListener("DOMContentLoaded", () => {
    cache();
    showWrapper();
    pendulum();
    realPreloaderWaitAndStart();
    initTriggerLogic();

    // Инициализируем обработчики кликов для навигационных точек
    initNavigationPointClickHandlers();

    // Инициализируем прогресс-бар навигации
    initNavigationProgressBar();

    // Настраиваем отладку для pt-3
    setupPt3ClickDebugger();

    // Настраиваем отладку для pt-4
    setupPt4ClickDebugger();

    // Настраиваем отладку для pt-5
    setupPt5ClickDebugger();

    // Настраиваем отладку для pt-d
    setupPtDClickDebugger();

    // Привязываем #pt-1
    try {
      const pt1 = document.getElementById("pt-1");
      if (pt1) pt1.addEventListener("click", handlePt1Click, { passive: true });
    } catch {}

    // Привязываем #pt-2
    try {
      const pt2 = document.getElementById("pt-2");
      if (pt2) pt2.addEventListener("click", handlePt2Click, { passive: true });
    } catch {}

    // Привязываем #pt-3
    try {
      const pt3 = document.getElementById("pt-3");
      if (pt3) pt3.addEventListener("click", handlePt3Click, { passive: true });
    } catch {}

    // Привязываем #pt-4
    try {
      const pt4 = document.getElementById("pt-4");
      if (pt4) pt4.addEventListener("click", handlePt4Click, { passive: true });
    } catch {}

    // Привязываем #pt-5
    try {
      const pt5 = document.getElementById("pt-5");
      if (pt5) pt5.addEventListener("click", handlePt5Click, { passive: true });
    } catch {}

    // Привязываем #pt-d
    try {
      const ptD = document.getElementById("pt-d");
      if (ptD) ptD.addEventListener("click", handlePtDClick, { passive: true });
    } catch {}
  });

  /* ============================
       ОБРАБОТЧИКИ КЛИКОВ ДЛЯ МОБИЛЬНОЙ НАВИГАЦИИ
     ============================ */
  function initMobileNavigationClickHandlers() {
    // Функция для очистки всех классов навигации
    function clearAllNavigationClasses() {
      // Убираем класс .cc-open у всех .navigation_block_mobile_point_wrapper
      const mobilePointWrappers = document.querySelectorAll(
        ".navigation_block_mobile_point_wrapper"
      );
      mobilePointWrappers.forEach((wrapper) => {
        wrapper.classList.remove("cc-open");
      });

      // Убираем класс .cc-open у .navigation_point_wrapper_mobile
      const mobileWrapper = document.querySelector(
        ".navigation_point_wrapper_mobile"
      );
      if (mobileWrapper) {
        mobileWrapper.classList.remove("cc-open");
      }

      // Убираем класс .cc-rotation-zero у всех изображений
      const allImages = document.querySelectorAll(".navigation_point_image");
      allImages.forEach((img) => {
        img.classList.remove("cc-rotation-zero");
      });
    }

    // Обработчик для .navigation_block_mobile_point_wrapper
    const mobilePointWrappers = document.querySelectorAll(
      ".navigation_block_mobile_point_wrapper"
    );

    mobilePointWrappers.forEach((wrapper) => {
      wrapper.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Добавляем класс .cc-open к кликнутому элементу
        this.classList.add("cc-open");

        // Добавляем класс .cc-open к .navigation_point_wrapper_mobile
        const mobileWrapper = document.querySelector(
          ".navigation_point_wrapper_mobile"
        );
        if (mobileWrapper) {
          mobileWrapper.classList.add("cc-open");
        }

        // Находим активное изображение p-? и добавляем класс .cc-rotation-zero
        const activePoint = this.querySelector(".navigation_point_image");
        if (activePoint) {
          activePoint.classList.add("cc-rotation-zero");
        }

        // Удаляем классы .cc-open у других элементов
        mobilePointWrappers.forEach((otherWrapper) => {
          if (otherWrapper !== this) {
            otherWrapper.classList.remove("cc-open");
          }
        });

        // Удаляем класс .cc-rotation-zero у других изображений
        const allImages = document.querySelectorAll(".navigation_point_image");
        allImages.forEach((img) => {
          if (img !== activePoint) {
            img.classList.remove("cc-rotation-zero");
          }
        });
      });
    });

    // Глобальные обработчики для удаления классов при любых действиях на сайте

    // Обработчик скролла
    let scrollTimeout;
    window.addEventListener(
      "scroll",
      function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          clearAllNavigationClasses();
        }, 100); // Небольшая задержка для оптимизации
      },
      { passive: true }
    );

    // Обработчик кликов по всему документу
    document.addEventListener(
      "click",
      function (e) {
        // Проверяем, что клик не по элементам навигации
        const isNavigationClick =
          e.target.closest(".navigation_block_mobile_point_wrapper") ||
          e.target.closest(".navigation_point_wrapper_mobile");

        if (!isNavigationClick) {
          clearAllNavigationClasses();
        }
      },
      { passive: true }
    );

    // Обработчик касаний (для мобильных устройств)
    document.addEventListener(
      "touchstart",
      function (e) {
        const isNavigationTouch =
          e.target.closest(".navigation_block_mobile_point_wrapper") ||
          e.target.closest(".navigation_point_wrapper_mobile");

        if (!isNavigationTouch) {
          clearAllNavigationClasses();
        }
      },
      { passive: true }
    );

    // Обработчик нажатий клавиш
    document.addEventListener(
      "keydown",
      function () {
        clearAllNavigationClasses();
      },
      { passive: true }
    );

    // Обработчик изменения размера окна
    window.addEventListener(
      "resize",
      function () {
        clearAllNavigationClasses();
      },
      { passive: true }
    );

    // Обработчик изменения ориентации устройства
    window.addEventListener(
      "orientationchange",
      function () {
        clearAllNavigationClasses();
      },
      { passive: true }
    );
  }

  // Инициализируем обработчики мобильной навигации после загрузки DOM
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initMobileNavigationClickHandlers,
      { once: true }
    );
  } else {
    initMobileNavigationClickHandlers();
  }

  /* ============================
       ЛОГИКА ЗАПОЛНЕНИЯ ШКАЛЫ НАВИГАЦИИ
       Заполнение .navigation_block-right_active с 20% до 100% height
       по мере прокрутки страницы с 0% до 50%
     ============================ */
  function initNavigationProgressBar() {
    const progressBar = document.querySelector(
      ".navigation_block-right_active"
    );
    const mobileProgressBar = document.querySelector(
      ".navigation_block-right_active_mobile"
    );

    if (
      (!progressBar && !mobileProgressBar) ||
      typeof gsap === "undefined" ||
      typeof ScrollTrigger === "undefined"
    ) {
      return;
    }

    // Переменные для контроля анимаций
    let currentAnimation = null;
    let currentMobileAnimation = null;
    let isTeleporting = false;
    let teleportTimeout = null;

    // Устанавливаем начальное состояние шкал
    if (progressBar) gsap.set(progressBar, { height: "20%" });
    if (mobileProgressBar) gsap.set(mobileProgressBar, { width: "20%" });

    // Создаем ScrollTrigger для плавной анимации заполнения шкалы
    const scrollTrigger = ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "60% bottom",
      scrub: 0.1, // Небольшая задержка для более плавной анимации
      onUpdate: function (self) {
        // Обновляем только если нет активного телепорта
        if (!isTeleporting) {
          const progress = self.progress;
          const targetValue = 20 + progress * 80; // От 20% до 100%

          // Обновляем десктопную полоску (по высоте)
          if (progressBar) {
            gsap.set(progressBar, { height: `${targetValue}%` });
          }

          // Обновляем мобильную полоску (по ширине)
          if (mobileProgressBar) {
            gsap.set(mobileProgressBar, { width: `${targetValue}%` });
          }
        }
      },
    });

    // Функция для принудительного обновления прогресса при телепортах
    function updateProgressOnTeleport() {
      // Останавливаем предыдущие анимации
      if (currentAnimation) {
        currentAnimation.kill();
        currentAnimation = null;
      }
      if (currentMobileAnimation) {
        currentMobileAnimation.kill();
        currentMobileAnimation = null;
      }

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(scrollY / docHeight, 1);
      const targetProgress = Math.min(scrollProgress / 0.6, 1);

      const targetValue = 20 + targetProgress * 80;

      // Временно отключаем ScrollTrigger
      isTeleporting = true;
      scrollTrigger.disable();

      // Плавная анимация к новой позиции при телепортах для десктопной полоски
      if (progressBar) {
        currentAnimation = gsap.to(progressBar, {
          height: `${targetValue}%`,
          duration: 0.5,
          ease: "power2.out",
        });
      }

      // Плавная анимация к новой позиции при телепортах для мобильной полоски
      if (mobileProgressBar) {
        currentMobileAnimation = gsap.to(mobileProgressBar, {
          width: `${targetValue}%`,
          duration: 0.5,
          ease: "power2.out",
          onComplete: function () {
            // Включаем обратно ScrollTrigger после завершения анимации
            setTimeout(() => {
              isTeleporting = false;
              scrollTrigger.enable();
            }, 100);
          },
        });
      } else if (progressBar) {
        // Если мобильной полоски нет, используем десктопную для завершения
        currentAnimation = gsap.to(progressBar, {
          height: `${targetValue}%`,
          duration: 0.5,
          ease: "power2.out",
          onComplete: function () {
            // Включаем обратно ScrollTrigger после завершения анимации
            setTimeout(() => {
              isTeleporting = false;
              scrollTrigger.enable();
            }, 100);
          },
        });
      }
    }

    // Перехватываем функцию jumpTo для обновления прогресса при телепортах
    const originalJumpTo = jumpTo;
    window.jumpTo = function (y, options = {}) {
      const result = originalJumpTo(y, options);

      // Очищаем предыдущий таймаут
      if (teleportTimeout) {
        clearTimeout(teleportTimeout);
      }

      // Обновляем прогресс шкалы после телепорта
      teleportTimeout = setTimeout(() => {
        updateProgressOnTeleport();
      }, 100);

      return result;
    };

    // Делаем функцию обновления прогресса доступной глобально
    window.updateNavigationProgress = updateProgressOnTeleport;

    // Возвращаем функцию для ручного обновления прогресса
    return updateProgressOnTeleport;
  }

  /* ============================
       ОТСЛЕЖИВАНИЕ КЛАССА .cc-open ДЛЯ МОБИЛЬНОЙ НАВИГАЦИИ
       Добавление класса .cc-rotation-zero к .navigation_point_image
       при наличии класса .cc-open у .navigation_block_mobile_point_wrapper
     ============================ */
  function initMobileNavigationClassTracking() {
    const mobileWrapper = document.querySelector(
      ".navigation_block_mobile_point_wrapper"
    );
    const navigationImages = document.querySelectorAll(
      ".navigation_point_image"
    );

    if (!mobileWrapper || navigationImages.length === 0) {
      return;
    }

    // Функция для обновления классов изображений
    function updateImageClasses() {
      const hasCcOpen = mobileWrapper.classList.contains("cc-open");

      navigationImages.forEach((image) => {
        if (hasCcOpen) {
          image.classList.add("cc-rotation-zero");
        } else {
          image.classList.remove("cc-rotation-zero");
        }
      });
    }

    // Создаем MutationObserver для отслеживания изменений классов
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          updateImageClasses();
        }
      });
    });

    // Начинаем наблюдение за изменениями классов
    observer.observe(mobileWrapper, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Устанавливаем начальное состояние
    updateImageClasses();

    // Делаем функцию доступной глобально для ручного вызова
    window.updateMobileNavigationClasses = updateImageClasses;

    return updateImageClasses;
  }

  // Инициализируем отслеживание классов при загрузке DOM
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initMobileNavigationClassTracking
    );
  } else {
    initMobileNavigationClassTracking();
  }

  /* ============================
       АНИМАЦИЯ NAVIGATION-TRANSITION-SCREEN
       По клику на .navigation_point_text
     ============================ */
  function initNavigationTransitionAnimation() {
    const transitionScreen = document.querySelector(
      ".navigation-transition-screen"
    );
    if (!transitionScreen) return;

    // Функция для запуска анимации transition screen
    function runTransitionAnimation() {
      if (!transitionScreen) return;

      // Находим элемент .logo_shtor внутри transition screen для анимации букв
      const logoElement = transitionScreen.querySelector(".logo_shtor");

      // Создаем timeline для всей анимации
      const tl = gsap.timeline();

      // 0. Инициализация символов как скрытых (в самом начале)
      let split = null;
      if (logoElement && typeof SplitText !== "undefined") {
        split = new SplitText(logoElement, {
          type: "chars",
          charsClass: "char",
        });
        tl.set(split.chars, { opacity: 0, filter: "blur(6px)" }, 0);
      }

      // 1. Появление экрана (0-0.5 сек)
      tl.fromTo(
        transitionScreen,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        }
      );

      // 2. Анимация букв через 0.5 сек после старта (0.5-1.3 сек)
      if (split && split.chars) {
        tl.to(
          split.chars,
          {
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.8,
            stagger: 0.08,
            ease: "power2.out",
          },
          "+=0.5"
        );
      }

      // 3. Исчезновение экрана через 2 сек после старта (2.0-2.5 сек)
      tl.to(
        transitionScreen,
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
        },
        "+=1"
      );
    }

    // Добавляем обработчики кликов на все .navigation_point_text и #pt-d
    function addClickHandlers() {
      const navigationTexts = document.querySelectorAll(
        ".navigation_point_text"
      );
      const ptD = document.getElementById("pt-d");

      // Обработчики для .navigation_point_text
      navigationTexts.forEach((textElement) => {
        textElement.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();

          // Запускаем анимацию
          runTransitionAnimation();
        });
      });

      // Обработчик для #pt-d
      if (ptD) {
        ptD.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();

          // Запускаем анимацию
          runTransitionAnimation();
        });
      }
    }

    // Инициализируем обработчики
    addClickHandlers();

    // Делаем функцию доступной глобально
    window.runNavigationTransitionAnimation = runTransitionAnimation;
  }

  // Инициализируем анимацию transition screen
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initNavigationTransitionAnimation
    );
  } else {
    initNavigationTransitionAnimation();
  }

  /* ============================
       ЦИКЛИЧЕСКАЯ АНИМАЦИЯ ТЕКСТА #text-anim-hero
       Чередование двух текстов с анимацией появления/исчезновения
     ============================ */
  function initHeroTextAnimation() {
    const textElement = document.getElementById("text-anim-hero");
    if (!textElement || typeof gsap === "undefined") return;

    const texts = [
      "Your AI Medical Partner",
      "Your 24/7 Clinical Support",
      "AI Molecular-Level Co-Pilot",
    ];

    let currentTextIndex = 0;
    let animationTimeline = null;

    function startTextAnimation() {
      // Останавливаем предыдущую анимацию если она есть
      if (animationTimeline) {
        animationTimeline.kill();
      }

      // Создаем новый timeline
      animationTimeline = gsap.timeline({
        repeat: -1, // Бесконечное повторение
        onRepeat: function () {
          // Переключаем индекс текста при каждом повторении
          currentTextIndex = (currentTextIndex + 1) % texts.length;
        },
      });

      // Устанавливаем начальное состояние
      gsap.set(textElement, {
        opacity: 1,
        filter: "blur(0px)",
      });

      // Первый цикл (первый текст)
      animationTimeline
        // 1. Исчезновение первого текста
        .to(textElement, {
          opacity: 0,
          filter: "blur(20px)",
          duration: 0.7,
          ease: "power2.inOut",
        })
        // 2. Смена текста (когда элемент полностью прозрачен)
        .call(() => {
          textElement.textContent = texts[currentTextIndex];
        })
        // 3. Появление нового текста
        .to(textElement, {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "power2.inOut",
        })
        // 4. Пауза 5 секунд
        .to(textElement, {
          duration: 5,
          ease: "none",
        })
        // 5. Исчезновение второго текста
        .to(textElement, {
          opacity: 0,
          filter: "blur(20px)",
          duration: 0.7,
          ease: "power2.inOut",
        })
        // 6. Смена на первый текст
        .call(() => {
          currentTextIndex = (currentTextIndex + 1) % texts.length;
          textElement.textContent = texts[currentTextIndex];
        })
        // 7. Появление первого текста
        .to(textElement, {
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.7,
          ease: "power2.inOut",
        })
        // 8. Пауза 5 секунд перед следующим циклом
        .to(textElement, {
          duration: 5,
          ease: "none",
        });
    }

    // Запускаем анимацию
    startTextAnimation();

    // Делаем функцию доступной глобально для управления
    window.startHeroTextAnimation = startTextAnimation;
    window.stopHeroTextAnimation = () => {
      if (animationTimeline) {
        animationTimeline.kill();
        animationTimeline = null;
      }
    };
  }

  // Инициализируем анимацию текста героя
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroTextAnimation);
  } else {
    initHeroTextAnimation();
  }
})();
