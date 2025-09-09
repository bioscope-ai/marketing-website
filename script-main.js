(function () {
  // Новый порог для мобильной версии
  const MOBILE_BREAKPOINT = 911;
  const isMobileWidth = window.innerWidth <= MOBILE_BREAKPOINT;

  // Корректная функция для определения Safari (и iOS, и macOS)
  function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  if (isMobileWidth) {
    window.addEventListener("load", () => {
      // 1) КЭШ ЭЛЕМЕНТОВ
      const logo = document.querySelector(".logo");
      const preloaderLeft = document.querySelector(".preloader-image.is-left");
      const preloaderRight = document.querySelector(
        ".preloader-image.is-right"
      );
      const firstVideo = document.getElementById("first-video");
      const humanVideo = document.getElementById("human-video-1");
      const torVideo = document.getElementById("tor-video");
      const cards = [
        document.querySelector(".card-1"),
        document.querySelector(".card-2"),
        document.querySelector(".card-3"),
      ];
      const torBg = document.querySelector(".tor-background");
      const headingWrapper = document.querySelector(".heading_wrapper");
      const leftContent = document.querySelector(".hero_content-left");
      const rightContent = document.querySelector(
        ".hero_content-right_up-content"
      );
      const btns = document.querySelector(".button-group");

      // 2) ГЛОБАЛЬНЫЕ ФЛАГИ/ТАЙМЕРЫ
      let launched = false;
      let cardsLaunched = false;
      let cardTimer = null;
      let launchTimer = null;
      let currentCycleIndex = 0;
      const TOTAL_CYCLES = 9;
      let humanVideoReadyToPlay = false;
      let cycleInProgress = false;

      // --- ВАЖНО: доступ к видео только ПОСЛЕ клика ---
      let allowVideoPlay = false;

      // 3) ССЫЛКИ НА ВИДЕО (Safari HEVC/mp4)
      const VIDEO_SRCS_SAFARI = {
        first:
          "https://www.dl.dropboxusercontent.com/scl/fi/aq370zj51tozm8kynxu25/Sphere_Alpha_Intro_v03_600x600-hevc-safari.mp4?rlkey=0d9klnr43tdsgr2ll37nuoezo&st=gnpj0gd9&dl=0",
        tor: "https://www.dl.dropboxusercontent.com/scl/fi/5eo9lu45hl69m7eg6qlmd/Tor_Alpha_v04-hevc-safari.mp4?rlkey=6i93kld5gcqbi0p0gj03d46di&st=0x3iy5do&dl=0",
      };

      const HUMAN_VIDEO_SRCS = [
        "https://www.dl.dropboxusercontent.com/scl/fi/re3jojg4z0cep2o6tx1y8/Young-Adult-hevc-safari.mp4?rlkey=qdk0t0p3n8pnkpvvlq8o18ji5&st=l47fj9oe&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/i49uyalox87idh17bdyqr/Mid-40s-Executive-hevc-safari.mp4?rlkey=c1lcixaud8wr1pne7gwj9pau8&st=kk85u6c2&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/1iihd31bb8plzm468q7ax/32-Year-Old-Man-hevc-safari.mp4?rlkey=wakck3sw2zmtsgopggd8q2h5l&st=6b2du856&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/meflao9fkq4icf8r39tg9/6-Year-Old-Child-hevc-safari.mp4?rlkey=rvvj08ljvkejrwdjks4k5499x&st=sd3qss6v&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/zk1uzlwm7wibpf90ge4ct/Post-Menopausal-hevc-safari.mp4?rlkey=csr5dy6gs6ke33k1tygihh52t&st=0rg9twib&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/pvhogt2vowlejdhjh2ey6/35-Year-Old-hevc-safari.mp4?rlkey=g7eqaqotlsdbtl5lhwaistbff&st=8v8fruse&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/7pimiyumyrj8jn4959w83/Ultra-Fit-48-Year-Old-hevc-safari.mp4?rlkey=1clisdg6lopgcpjs6jho55xda&st=xypcc5ub&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/eclc6j434160i4v6qw45f/55-Year-Old-Software-hevc-safari.mp4?rlkey=51javiha5zdiy8wxw607mourx&st=yt38ynkv&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/tz58jtpehokqci21kq8vk/40-Year-Old-Man-hevc-safari.mp4?rlkey=a70yi3jloke1rincfk3s4ee1q&st=6dsprpwh&dl=0",
      ];

      // 4) ТЕКСТОВЫЕ ДАННЫЕ (как в твоём коде — без изменений содержания)
      const CARD_TEXTS = [
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Low Bifidobacterium and Akkermansia abundance; high gut-derived LPS gene counts indicating systemic inflammation ",
            "Plasma homocysteine 17 µmol/L (↑); RBC folate 350 ng/mL (low-normal); CSF 5-HIAA below age norms",
            'Homozygous <span class="tor-paragraph-span">MTHFR C677T (TT)</span> → impaired methyl-folate recycling; <span class="tor-paragraph-span">SLC6A4 5-HTTLPR S/S</span> → poor SSRI response',
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Butyrate < 0.5 mM; depleted Faecalibacterium prausnitzii",
            "Plasma lactate 2.8 mmol/L; whole-blood ATP production 65 % of control; urinary F2-isoprostanes elevated",
            'Heterozygous <span class="tor-paragraph-span">POLG p.Ala467Thr</span> mutation (common pathogenic allele)',
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Stool and tumor dominated by Fusobacterium nucleatum FadA+ clade",
            "Tumor MSI-high; nuclear β-catenin accumulatio",
            'Pathogenic <span class="tor-paragraph-span">APC c.3927_3931delAAAGA</span> deletion (classic FAP)',
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Skin overrun by Staphylococcus aureus (≈ 60 % of reads); gut low in Bifidobacteria",
            "Total IgE 1 650 IU/mL; eosinophils 750 /µL; Th2 cytokines elevated",
            'Heterozygous loss-of-function <span class="tor-paragraph-span">FLG R501X</span> mutation (skin-barrier defect)',
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Near absence of protective Lactobacillus crispatus and L. iners in uro-genital tract",
            "Urine IL-6 persistently elevated; MDR E. coli on last culture",
            "**NAT25/6 slow-acetylator diplotype (predisposes to sulfonamide and nitrofurantoin intolerance)",
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Zonulin high (leaky gut); low Lactobacillus reuteri abundance",
            "Anti-TPO 1 200 IU/mL; anti-TG 350 IU/mL; IL-17A elevated",
            '<span class="tor-paragraph-span">HLA-DRB1*03:01</span> auto-thyroid risk allele',
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Over-representation of TMAO-producing Prevotella species",
            "Lp(a) 265 mg/dL; oxidized-phospholipid Lp(a) markedly elevated",
            "LPA rs10455872 G/G plus < 10 KIV-2 repeats → genetically fixed high Lp(a)",
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Depleted butyrate-producing Faecalibacterium; plasma LPS-binding protein elevated",
            "Plasma p-tau-217 2.4 pg/mL (↑); Aβ42/40 ratio 0.055 (↓)",
            'Homozygous <span class="tor-paragraph-span">APOE ε4/ε4</span> (≈ 15× lifetime AD risk)',
          ],
        },
        {
          h1: [
            "Microbiome findings:",
            "Molecular findings:",
            "Genome findings:",
          ],
          p: [
            "Gut enriched for siderophore-producing Enterobacteriaceae that enhance iron uptake",
            "Ferritin 1 050 ng/mL; transferrin saturation 82 %; hepatic MRI iron ≈ 200 µmol/g",
            'Homozygous <span class="tor-paragraph-span">HFE C282Y</span> mutation',
          ],
        },
      ];

      const TOR_TEXTS = [
        {
          paragraph: "Major depressive disorder, SSRI-resistant subtype",
          points: [
            '<span class="tor-paragraph-span">L-methylfolate 15 mg</span> qd (± SAMe);',
            'switch from SSRI to <span class="tor-paragraph-span">vortioxetine</span>;',
            'introduce high-CFU B. longum 1714 <span class="tor-paragraph-span">psychobiotic</span>;',
            'anti-inflammatory, high-prebiotic <span class="tor-paragraph-span">diet</span>',
          ],
        },
        {
          paragraph: "POLG-related mitochondrial dysfunction",
          points: [
            '<span class="tor-paragraph-span">Mitochondrial "cocktail"</span> (CoQ10 300 mg bid, acetyl-L-carnitine 1 g bid)',
            "riboflavin 200 mg qd",
            'butyrate-enhancing <span class="tor-paragraph-span">prebiotic</span>;',
            'strict <span class="tor-paragraph-span">avoidance</span> of valproate or other POLG-toxic <span class="tor-paragraph-span">drugs</span>',
          ],
        },
        {
          paragraph:
            "Familial adenomatous polyposis (FAP) with early colon adenocarcinoma",
          points: [
            'Total <span class="tor-paragraph-span">colectomy</span> plus <span class="tor-paragraph-span">chemoprophylaxis</span>;',
            'short <span class="tor-paragraph-span">metronidazole</span> course targeting Fn;',
            'consider adjuvant <span class="tor-paragraph-span">anti-PD-1</span> therapy;',
            ' long-term <span class="tor-paragraph-span">Fn-suppressing synbiotic</span> program',
          ],
        },
        {
          paragraph: "Severe atopic dermatitis with poly-sensitization",
          points: [
            'Daily <span class="tor-paragraph-span">ceramide-rich</span> barrier creams;',
            '<span class="tor-paragraph-span">dupilumab</span> (anti-IL-4Rα);',
            'S. aureus <span class="tor-paragraph-span">decolonization</span> protocol;',
            'B. breve <span class="tor-paragraph-span">synbiotic</span> to restore gut–skin axis',
          ],
        },
        {
          paragraph: "Chronic recurrent lower urinary-tract infection",
          points: [
            'Avoid <span class="tor-paragraph-span">TMP-SMX</span> and <span class="tor-paragraph-span">nitrofurantoin</span>;',
            'non-antibiotic <span class="tor-paragraph-span">prophylaxis</span> (vaginal estrogen + intravesical hyaluronic acid);',
            'high-potency L. crispatus <span class="tor-paragraph-span">probiotic</span>;',
            "pivmecillinam for acute episodes",
          ],
        },
        {
          paragraph: "Hashimoto's thyroiditis",
          points: [
            '<span class="tor-paragraph-span">Selenium</span> 200 µg + <span class="tor-paragraph-span">myo-inositol</span>;',
            'early titrated <span class="tor-paragraph-span">levothyroxine</span>;',
            '12-week gut-repair protocol including <span class="tor-paragraph-span">L. reuteri DSM 17938</span>;',
            'low-dose <span class="tor-paragraph-span">naltrexone</span> for Th17 dampening',
          ],
        },
        {
          paragraph: "Familial hyper-Lp(a)-emia with atherogenic risk",
          points: [
            'Add PCSK9 <span class="tor-paragraph-span">monoclonal antibody</span> (≈ 25 % Lp(a) reduction);',
            'screen/enroll in <span class="tor-paragraph-span">siRNA Lp(a) trial</span>;',
            "olpasiran or lepodisiran, > 90 % reduction;",
            'Mediterranean/TMAO-lowering <span class="tor-paragraph-span">diet</span>',
          ],
        },
        {
          paragraph:
            "Early mild cognitive impairment due to Alzheimer's disease (APOE ε4/ε4)",
          points: [
            'Offer <span class="tor-paragraph-span">lecanemab</span>;',
            'discuss enrollment in <span class="tor-paragraph-span">ALZ-801 ε4-targeted</span> trial;',
            '<span class="tor-paragraph-span">ketogenic</span> medical food;',
            '<span class="tor-paragraph-span">high-butyrate synbiotic</span> to reduce gut-brain inflammation',
          ],
        },
        {
          paragraph: "Type 1 hereditary hemochromatosis",
          points: [
            "Therapeutic phlebotomy every 2 weeks until ferritin < 100 ng/mL, then quarterly;",
            "evaluate for AAV8 adenine base-editing C282Y trial;",
            "low-iron diet plus Lactobacillus plantarum;",
            "probiotic that sequesters luminal iron",
          ],
        },
      ];

      const HEADINGS = [
        "Young Adult With Treatment-Resistant Depression",
        'Mid-40s Executive With Crushing Fatigue and "Brain Fog"',
        "Thirty-Two-Year-Old Man Presenting With Stage II Colon Cancer",
        "Six-Year-Old Child With Severe Eczema and Multiple Food Allergies",
        "Post-Menopausal Woman With Recurrent UTIs and Drug Intolerance",
        "Thirty-Five-Year-Old Woman With Rapidly Progressing Thyroiditis",
        "Ultra-Fit 48-Year-Old Cyclist With Strong Family History of Early MI",
        "55-Year-Old Software Engineer With Subtle Memory Lapses",
        "40-Year-Old Man With Joint Pain and Elevated Liver Enzymes",
      ];

      // 5) БРЕЙКПОИНТЫ/НАСТРОЙКИ
      const MOBILE_BREAKPOINT = 991;
      const MOBILE_XS_BREAKPOINT = 479;
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      const isMobileXS = window.innerWidth <= MOBILE_XS_BREAKPOINT;

      // --- Параметры анимаций (как в твоём коде, без смысловых изменений) ---
      const MOBILE_FIRST_VIDEO_SET_WIDTH = "400vh";
      const MOBILE_FIRST_VIDEO_SET_FILTER = "blur(25px)";
      const MOBILE_FIRST_VIDEO_SHRINK_WIDTH = "80vw";
      const MOBILE_FIRST_VIDEO_SHRINK_DURATION = 0.8;
      const MOBILE_FIRST_VIDEO_GROW_WIDTH = "400vh";
      const MOBILE_FIRST_VIDEO_GROW_FILTER = "blur(25px)";
      const MOBILE_FIRST_VIDEO_GROW_ZINDEX = 1;

      const MOBILE_PHONE_FIRST_VIDEO_SET_WIDTH = "400vh";
      const MOBILE_PHONE_FIRST_VIDEO_SET_FILTER = "blur(25px)";
      const MOBILE_PHONE_FIRST_VIDEO_SHRINK_WIDTH = "110vw";
      const MOBILE_PHONE_FIRST_VIDEO_SHRINK_DURATION = 0.8;
      const MOBILE_PHONE_FIRST_VIDEO_GROW_WIDTH = "400vh";
      const MOBILE_PHONE_FIRST_VIDEO_GROW_FILTER = "blur(25px)";
      const MOBILE_PHONE_FIRST_VIDEO_GROW_ZINDEX = 1;

      const MOBILE_TOR_BG_SET_WIDTH = "0vw";
      const MOBILE_TOR_BG_SET_HEIGHT = "0vw";
      const MOBILE_TOR_BG_GROW_WIDTH = "180vw";
      const MOBILE_TOR_BG_GROW_HEIGHT = "180vw";

      const MOBILE_PHONE_TOR_BG_SET_WIDTH = "0vw";
      const MOBILE_PHONE_TOR_BG_SET_HEIGHT = "0vw";
      const MOBILE_PHONE_TOR_BG_GROW_WIDTH = "200vw";
      const MOBILE_PHONE_TOR_BG_GROW_HEIGHT = "200vw";

      const MOBILE_LOGO_TOP = "2.86vw";
      const MOBILE_LOGO_LEFT = "9vw";
      const MOBILE_LOGO_DURATION = 1.2;

      const MOBILE_PHONE_LOGО_TOP = "3.4vw";
      const MOBILE_PHONE_LOGО_LEFT = "10vw";
      const MOBILE_PHONE_LOGО_DURATION = 1.2;

      const MOBILE_TOR_VIDEO_RESET_WIDTH = "130vh";
      const MOBILE_TOR_VIDEO_RESET_HEIGHT = "100vw";
      const MOBILE_PHONE_TOR_VIDEO_RESET_WIDTH = "100vh";
      const MOBILE_PHONE_TOR_VIDEO_RESET_HEIGHT = "100vw";

      // 6) НАЧАЛЬНЫЕ СТИЛИ
      gsap.set(cards, {
        opacity: 0,
        y: "7em",
        x: "0em",
        filter: "blur(20px)",
        scale: 1,
      });
      gsap.set(".tor-background", {
        width: isMobileXS
          ? MOBILE_PHONE_TOR_BG_SET_WIDTH
          : MOBILE_TOR_BG_SET_WIDTH,
        height: isMobileXS
          ? MOBILE_PHONE_TOR_BG_SET_HEIGHT
          : MOBILE_TOR_BG_SET_HEIGHT,
        opacity: 0,
      });
      gsap.set(".first-video", {
        width: isMobileXS
          ? MOBILE_PHONE_FIRST_VIDEO_SET_WIDTH
          : MOBILE_FIRST_VIDEO_SET_WIDTH,
        filter: isMobileXS
          ? MOBILE_PHONE_FIRST_VIDEO_SET_FILTER
          : MOBILE_FIRST_VIDEO_SET_FILTER,
        zIndex: isMobileXS
          ? MOBILE_PHONE_FIRST_VIDEO_GROW_ZINDEX
          : MOBILE_FIRST_VIDEO_GROW_ZINDEX,
      });
      gsap.set(".tor-video", { opacity: 0, display: "none" });
      gsap.set("#human-video-1", { display: "block" });
      gsap.set(".h1.cc-tor", { opacity: 0, filter: "blur(20px)", y: "3em" });
      gsap.set(".tor-paragraph", {
        opacity: 0,
        filter: "blur(20px)",
        y: "3em",
      });
      gsap.set(".h1.cc-tor-bottom", {
        opacity: 0,
        filter: "blur(20px)",
        y: "3em",
      });
      gsap.set(".tor-point", { opacity: 0, filter: "blur(10px)", scale: 0.5 });
      if (logo) logo.style.opacity = "1";

      // 7) ХЕЛПЕР: ЖЁСТКИЙ ПАУЗ-ГЕЙТ ДО КЛИКА
      function enforcePause(video) {
        if (!video) return;
        video.pause();
        try {
          video.currentTime = 0;
        } catch (e) {}
        video.addEventListener("play", () => {
          if (!allowVideoPlay) {
            video.pause();
            try {
              video.currentTime = 0;
            } catch (e) {}
          }
        });
      }
      [firstVideo, humanVideo, torVideo].forEach(enforcePause);

      // 8) PRELOADER DOM
      const wrapperLoadVideoSafari = document.querySelector(
        ".wrapper-load-video-safari"
      );
      const loaderProgressLine = document.querySelector(
        ".loader-progress-line"
      );
      const loaderWrapper = document.querySelector(".loader-wrapper");
      const buttonLoadWrapper = document.querySelector(".button-load-wrapper");
      let loaderTextTween = null;
      let preloaderLeftTween = null;
      let preloaderRightTween = null;

      // 9) ТЕКСТОВЫЕ ХЕЛПЕРЫ
      function setCardTexts(idx) {
        const data = CARD_TEXTS[idx];
        const h1_1 = document.getElementById("heading-card-1-edit");
        const h1_2 = document.getElementById("heading-card-2-edit");
        const h1_3 = document.getElementById("heading-card-3-edit");
        const p1 = document.getElementById("paragraph-card-1-edit");
        const p2 = document.getElementById("paragraph-card-2-edit");
        const p3 = document.getElementById("paragraph-card-3-edit");
        if (h1_1) h1_1.textContent = data.h1[0];
        if (h1_2) h1_2.textContent = data.h1[1];
        if (h1_3) h1_3.textContent = data.h1[2];
        if (p1) p1.innerHTML = data.p[0];
        if (p2) p2.innerHTML = data.p[1];
        if (p3) p3.innerHTML = data.p[2];
      }

      function setTorTexts(idx) {
        const data = TOR_TEXTS[idx];
        const torParagraph = document.getElementById("tor-paragraph-edit");
        const torPoint1 = document.getElementById("tor-point-1-edit");
        const torPoint2 = document.getElementById("tor-point-2-edit");
        const torPoint3 = document.getElementById("tor-point-3-edit");
        const torPoint4 = document.getElementById("tor-point-4-edit");
        if (
          !torParagraph ||
          !torPoint1 ||
          !torPoint2 ||
          !torPoint3 ||
          !torPoint4
        )
          return;
        torParagraph.textContent = data.paragraph;
        torPoint1.innerHTML = data.points[0];
        torPoint2.innerHTML = data.points[1];
        torPoint3.innerHTML = data.points[2];
        torPoint4.innerHTML = data.points[3];
      }

      // 10) ПЕРВИЧНЫЕ ТЕКСТЫ
      setCardTexts(currentCycleIndex);
      setTorTexts(currentCycleIndex);
      const headingEdit = document.getElementById("heading-edit");
      if (headingEdit) headingEdit.textContent = HEADINGS[currentCycleIndex];

      // 11) АНИМАЦИИ КАРТОЧЕК
      function animateCards() {
        gsap.to(".card-1", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          ease: "power2.out",
        });
        gsap.to(".card-2", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.4,
          ease: "power2.out",
        });
        gsap.to(".card-3", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.8,
          ease: "power2.out",
          onComplete() {
            setTimeout(() => {
              gsap.to(".card-3", {
                duration: 3,
                scale: 0,
                motionPath: {
                  path: "M0,0 C0,0 16.978,-29.377 -14,-116 -44.902,-202.408 -272,-201 -272,-201 ",
                },
                ease: CustomEase.create(
                  "custom",
                  "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                ),
                onStart: () => {
                  setTimeout(() => {
                    const firstVideoEl = document.querySelector(".first-video");
                    if (firstVideoEl) firstVideoEl.style.zIndex = "7";
                  }, 2800);
                  setTimeout(() => {
                    gsap.to(".card-1", {
                      duration: 4.4,
                      scale: 0,
                      motionPath: {
                        path: "M0,0 C0,0 -66.417,-320.956 66.399,-326.999 135.411,-330.137 469.599,-64.599 469.599,-64.599 ",
                      },
                      ease: CustomEase.create(
                        "custom",
                        "M0,0 C0.311,0.361 1.024,0.066 1,1 "
                      ),
                      onStart: () => {
                        setTimeout(() => {
                          gsap.to(".card-2", {
                            duration: 4.2,
                            scale: 0,
                            motionPath: {
                              path: "M0,0 C0,0 -346.828,64.842 -338.997,-27 -329.793,-134.933 117,-81 117,-81 ",
                            },
                            ease: CustomEase.create(
                              "custom",
                              "M0,0 C0.152,0.687 1.024,0.066 1,1 "
                            ),
                          });
                        }, 1100);
                      },
                    });
                  }, 1000);
                },
              });
            }, 4200);
          },
        });
      }

      function animateCardsMobileXS() {
        gsap.to(".card-1", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          ease: "power2.out",
        });
        gsap.to(".card-2", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.4,
          ease: "power2.out",
        });
        gsap.to(".card-3", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.8,
          ease: "power2.out",
          onComplete() {
            setTimeout(() => {
              gsap.to(".card-1", {
                duration: 3,
                scale: 0,
                motionPath: {
                  path: "M0,0 C0,0 12.077,-62.307 14.799,-44.255 20.172,-8.615 20.893,35.242 20.893,35.242 ",
                },
                ease: CustomEase.create(
                  "custom",
                  "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                ),
                onStart: () => {
                  gsap.to(".card-1", {
                    opacity: 0,
                    delay: 2.92,
                    duration: 0.3,
                    ease: "power1.out",
                  });
                  setTimeout(() => {
                    gsap.to(".card-2", {
                      duration: 3.0,
                      scale: 0,
                      motionPath: {
                        path: "M0,0 C0,0 27.041,-158.509 29.789,-140.503 35.147,-104.765 28.896,-37.207 28.896,-37.207 ",
                      },
                      ease: CustomEase.create(
                        "custom",
                        "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                      ),
                      onStart: () => {
                        gsap.to(".card-2", {
                          opacity: 0,
                          delay: 2.92,
                          duration: 0.3,
                          ease: "power1.out",
                        });
                        setTimeout(() => {
                          gsap.to(".card-3", {
                            duration: 3,
                            scale: 0,
                            motionPath: {
                              path: "M0,0 C0,0 6.012,83.975 9.338,70.033 18.961,29.686 23.59,0.765 23.59,0.765 ",
                            },
                            ease: CustomEase.create(
                              "custom",
                              "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                            ),
                            onStart: () => {
                              gsap.to(".card-3", {
                                opacity: 0,
                                delay: 2.7,
                                duration: 0.74,
                                ease: "power1.out",
                              });
                            },
                          });
                        }, 1000);
                      },
                    });
                  }, 2400);
                },
              });
            }, 4100);
          },
        });
      }

      // 12) ТРИГГЕРЫ ПЕРВОГО ВИДЕО
      function scheduleFirstVideoTriggers() {
        if (cardTimer) clearTimeout(cardTimer);
        if (launchTimer) clearTimeout(launchTimer);
        launched = false;
        cardsLaunched = false;

        // карты ~2s
        cardTimer = setTimeout(() => {
          if (cardsLaunched) return;
          cardsLaunched = true;
          (isMobileXS ? animateCardsMobileXS : animateCards)();
        }, 2000);

        // запуск humanVideo ~4.73s
        launchTimer = setTimeout(() => {
          if (launched) return;
          launched = true;
          if (humanVideo) {
            humanVideoReadyToPlay = true;
            try {
              humanVideo.currentTime = 0;
            } catch (e) {}
            humanVideo.play();
          }
        }, 4730);
      }

      // 13) ПРЕЛОАДЕР-АНИМАЦИЯ
      function startPreloaderAnimation() {
        const left = document.querySelector(".hero_content-left");
        const right = document.querySelector(".hero_content-right_up-content");
        const btns = document.querySelector(".button-group");
        const heading = document.querySelector(".heading_wrapper");
        [heading, left, right, btns].forEach((el) => {
          if (el) gsap.set(el, { opacity: 0, filter: "blur(20px)", y: "3em" });
        });

        const split = new SplitText(logo, {
          type: "chars",
          charsClass: "char",
        });
        const tl = gsap.timeline();

        tl.add([
          gsap.to(logo, { scale: 1, duration: 1.2, ease: "power1.out" }),
          gsap.to(split.chars, {
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
          }),
        ])
          .to(
            logo,
            {
              scale: 0.2,
              top: isMobileXS ? "3.4vw" : "2.86vw",
              left: isMobileXS ? "10vw" : "9vw",
              x: 0,
              y: 0,
              transform: "scale(0.2)",
              duration: isMobileXS ? 1.2 : 1.2,
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
            preloaderLeft,
            { y: "100%", duration: 1, ease: "power2.out" },
            "<"
          )
          .to(
            preloaderRight,
            { y: "-100%", duration: 1, ease: "power2.out" },
            "<"
          )
          .to(
            document.querySelector(".preloader-nav"),
            {
              background: "rgba(0,0,0,0)",
              duration: 1,
              ease: "power1.out",
              onStart() {
                if (firstVideo) {
                  try {
                    firstVideo.currentTime = 0;
                    firstVideo.play();
                  } catch (e) {}
                }
                scheduleFirstVideoTriggers();
              },
              onComplete() {
                setTimeout(() => {
                  if (heading)
                    gsap.to(heading, {
                      opacity: 1,
                      filter: "blur(0px)",
                      y: "0em",
                      duration: 1,
                    });
                  setTimeout(() => {
                    if (left)
                      gsap.to(left, {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: "0em",
                        duration: 1,
                      });
                    if (right)
                      setTimeout(
                        () =>
                          gsap.to(right, {
                            opacity: 1,
                            filter: "blur(0px)",
                            y: "0em",
                            duration: 1,
                          }),
                        200
                      );
                    if (btns)
                      setTimeout(
                        () =>
                          gsap.to(btns, {
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

      // 14) РЕАКЦИЯ HUMAN-VIDEO НА START
      if (humanVideo) {
        humanVideo.addEventListener("play", () => {
          if (!humanVideoReadyToPlay) {
            humanVideo.pause();
            try {
              humanVideo.currentTime = 0;
            } catch (e) {}
            return;
          }
          setTimeout(() => {
            const shrink = () =>
              gsap.to(document.querySelectorAll(".first-video"), {
                width: isMobileXS
                  ? MOBILE_PHONE_FIRST_VIDEO_SHRINK_WIDTH
                  : MOBILE_FIRST_VIDEO_SHRINK_WIDTH,
                filter: "blur(0px)",
                duration: isMobileXS
                  ? MOBILE_PHONE_FIRST_VIDEO_SHRINK_DURATION
                  : MOBILE_FIRST_VIDEO_SHRINK_DURATION,
                ease: "power2.out",
              });
            if (humanVideo.readyState >= 2) shrink();
            else
              humanVideo.addEventListener("loadeddata", shrink, { once: true });
          }, 2200);

          setTimeout(() => {
            const heading = document.querySelector(".heading_wrapper");
            if (heading)
              gsap.to(heading, {
                opacity: 0,
                duration: 0.5,
                ease: "power1.out",
              });
          }, 500);
        });
      }

      // 15) ОЖИДАНИЕ ЗАГРУЗКИ ВИДЕО (заметь: НА МОБИЛКЕ tor-video НЕ ЖДЁМ!)
      function waitForAllVideosToLoad(videos, cb) {
        let loaded = 0,
          total = videos.length;
        if (loaderProgressLine) {
          gsap.set(loaderProgressLine, { width: "8%" });
          setTimeout(() => gsap.set(loaderProgressLine, { width: "16%" }), 200);
          setTimeout(() => gsap.set(loaderProgressLine, { width: "24%" }), 400);
        }
        function bump() {
          loaded++;
          if (loaderProgressLine) {
            if (loaded === 1) {
              gsap.set(loaderProgressLine, { width: "41%" });
              setTimeout(
                () => gsap.set(loaderProgressLine, { width: "52%" }),
                300
              );
            }
            if (loaded === 2) {
              gsap.set(loaderProgressLine, { width: "87%" });
            }
            if (loaded >= total) {
              gsap.set(loaderProgressLine, { width: "100%" });
            }
          }
          if (loaded >= total) {
            setTimeout(() => {
              if (loaderWrapper) {
                gsap.to(loaderWrapper, {
                  opacity: 0,
                  duration: 0.5,
                  onComplete: () => {
                    loaderWrapper.style.display = "none";
                    if (buttonLoadWrapper) {
                      gsap.to(buttonLoadWrapper, {
                        opacity: 1,
                        duration: 0.5,
                        display: "flex",
                      });
                    }
                    if (window.__preloaderTweens) {
                      Object.values(window.__preloaderTweens).forEach(
                        (t) => t && t.kill && t.kill()
                      );
                      window.__preloaderTweens = null;
                    }
                    if (window.__preloaderEls) {
                      const { loaderText, preloaderLeft, preloaderRight } =
                        window.__preloaderEls;
                      if (loaderText) loaderText.style.opacity = 1;
                      if (preloaderLeft) preloaderLeft.style.transform = "";
                      if (preloaderRight) preloaderRight.style.transform = "";
                      window.__preloaderEls = null;
                    }
                  },
                });
              }
            }, 500);
            cb();
          }
        }
        videos.forEach((v) => {
          if (!v) return bump();
          v.addEventListener("canplaythrough", bump, { once: true });
        });
      }

      waitForAllVideosToLoad(
        isMobile
          ? [firstVideo, humanVideo]
          : [firstVideo, humanVideo, torVideo],
        () => {
          const startBtn = document.getElementById("start-btn");
          if (startBtn) {
            startBtn.style.display = "block";
            startBtn.addEventListener("click", function handleStart() {
              gsap.to(startBtn, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                  startBtn.style.display = "none";
                  allowVideoPlay = true;

                  // Скрываем обёртки лоадера
                  if (buttonLoadWrapper) {
                    gsap.to(buttonLoadWrapper, {
                      opacity: 0,
                      duration: 0.5,
                      onComplete: () => {
                        buttonLoadWrapper.style.display = "none";
                        if (wrapperLoadVideoSafari)
                          wrapperLoadVideoSafari.style.display = "none";
                        if (logo) logo.style.display = "block";

                        // === КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: НА МОБИЛКЕ ТОЛЬКО СЕЙЧАС НАЗНАЧАЕМ SRC ДЛЯ tor-video ===
                        if (isMobile && torVideo) {
                          try {
                            torVideo.preload = "auto";
                            if (
                              !torVideo.src ||
                              torVideo.src !== VIDEO_SRCS_SAFARI.tor
                            ) {
                              torVideo.src = VIDEO_SRCS_SAFARI.tor;
                            }
                            torVideo.load?.();
                          } catch (e) {
                            console.warn(
                              "[torVideo] deferred mobile load failed:",
                              e
                            );
                          }
                        }

                        startPreloaderAnimation();
                      },
                    });
                  } else {
                    if (wrapperLoadVideoSafari)
                      wrapperLoadVideoSafari.style.display = "none";
                    if (logo) logo.style.display = "block";

                    // fallback: тоже назначаем src на мобилке только сейчас
                    if (isMobile && torVideo) {
                      try {
                        torVideo.preload = "auto";
                        if (
                          !torVideo.src ||
                          torVideo.src !== VIDEO_SRCS_SAFARI.tor
                        ) {
                          torVideo.src = VIDEO_SRCS_SAFARI.tor;
                        }
                        torVideo.load?.();
                      } catch (e) {
                        console.warn(
                          "[torVideo] deferred mobile load failed:",
                          e
                        );
                      }
                    }

                    startPreloaderAnimation();
                  }
                },
              });
            });
          } else {
            // Без кнопки — запускаем сразу (но требование — tor на мобилке только после клика.
            // Если кнопки нет, то считаем это "клик уже совершен" по UX и всё равно откладывать нечего.
            allowVideoPlay = true;
            if (wrapperLoadVideoSafari)
              wrapperLoadVideoSafari.style.display = "none";
            if (logo) logo.style.display = "block";
            if (isMobile && torVideo) {
              try {
                torVideo.preload = "auto";
                if (!torVideo.src || torVideo.src !== VIDEO_SRCS_SAFARI.tor) {
                  torVideo.src = VIDEO_SRCS_SAFARI.tor;
                }
                torVideo.load?.();
              } catch (e) {
                console.warn("[torVideo] deferred mobile load failed:", e);
              }
            }
            startPreloaderAnimation();
          }
        }
      );

      // 16) ПОСЛЕ ОКОНЧАНИЯ firstVideo — ПОКАЗЫВАЕМ torVideo
      if (firstVideo) {
        firstVideo.addEventListener("ended", () => {
          if (cycleInProgress) return;
          cycleInProgress = true;

          document
            .querySelectorAll(".first-video")
            .forEach((el) => (el.style.display = "none"));
          document
            .querySelectorAll(".tor-video")
            .forEach((el) => (el.style.display = "block"));

          const playTorWhenReady = () => {
            if (!torVideo) return;
            setTorTexts(currentCycleIndex);
            torVideo.style.display = "block";
            try {
              torVideo.currentTime = 2.3;
            } catch (e) {}
            if (torVideo.readyState >= 2) torVideo.play();
            else
              torVideo.addEventListener("loadeddata", () => torVideo.play(), {
                once: true,
              });

            gsap.to([".tor-video", ".tor-background"], {
              opacity: 1,
              duration: 0.5,
              delay: 0.5,
            });

            if (torBg) {
              gsap.to(torBg, {
                width: isMobileXS
                  ? MOBILE_PHONE_TOR_BG_GROW_WIDTH
                  : MOBILE_TOR_BG_GROW_WIDTH,
                height: isMobileXS
                  ? MOBILE_PHONE_TOR_BG_GROW_HEIGHT
                  : MOBILE_TOR_BG_GROW_HEIGHT,
                duration: 0,
                ease: "power1.out",
                onComplete: () => {
                  setTimeout(() => {
                    gsap.to(".h1.cc-tor", {
                      opacity: 1,
                      filter: "blur(0px)",
                      y: "0em",
                      duration: 1,
                    });
                    setTimeout(() => {
                      gsap.to(".tor-paragraph", {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: "0em",
                        duration: 1,
                      });
                      setTimeout(() => {
                        gsap.to(".h1.cc-tor-bottom", {
                          opacity: 1,
                          filter: "blur(0px)",
                          y: "0em",
                          duration: 1,
                        });
                        setTimeout(() => {
                          document
                            .querySelectorAll(".tor-point")
                            .forEach((el, i) => {
                              setTimeout(() => {
                                gsap.to(el, {
                                  opacity: 1,
                                  filter: "blur(0px)",
                                  scale: 1,
                                  duration: 0.8,
                                });
                              }, i * 400);
                            });
                        }, 200);
                      }, 800);
                    }, 200);
                  }, 1000);
                },
              });
            }
          };

          // Если мы на мобилке и вдруг по какой-то причине src ещё не назначен — назначаем прямо сейчас (safety).
          if (isMobile && torVideo && !torVideo.src) {
            try {
              torVideo.preload = "auto";
              torVideo.src = VIDEO_SRCS_SAFARI.tor;
              torVideo.load?.();
              torVideo.addEventListener("loadeddata", playTorWhenReady, {
                once: true,
              });
            } catch (e) {
              console.warn("[torVideo] late assign failed:", e);
              playTorWhenReady();
            }
          } else {
            playTorWhenReady();
          }

          // Чуть позже стопаем firstVideo
          setTimeout(() => {
            try {
              firstVideo.pause();
              firstVideo.currentTime = 0;
            } catch (e) {}
          }, 1500);

          // Планируем завершение цикла
          const fadeTorAndBackground = () => {
            gsap.to([".tor-video", ".tor-background"], {
              opacity: 0,
              duration: 1.3,
              onComplete: () => {
                gsap.set(
                  [
                    ".tor-video",
                    ".tor-background",
                    ".h1.cc-tor",
                    ".tor-paragraph",
                    ".h1.cc-tor-bottom",
                    ".tor-point",
                  ],
                  { clearProps: "all" }
                );
                gsap.set(".tor-background", { opacity: 0 });
                gsap.set(".tor-video", {
                  width: isMobileXS
                    ? MOBILE_PHONE_TOR_VIDEO_RESET_WIDTH
                    : MOBILE_TOR_VIDEO_RESET_WIDTH,
                  height: isMobileXS
                    ? MOBILE_PHONE_TOR_VIDEO_RESET_HEIGHT
                    : MOBILE_TOR_VIDEO_RESET_HEIGHT,
                  opacity: 0,
                  display: "none",
                });
                if (torVideo) {
                  try {
                    torVideo.pause();
                    torVideo.currentTime = 0;
                  } catch (e) {}
                  torVideo.style.display = "none";
                }
                gsap.set(".h1.cc-tor", {
                  opacity: 0,
                  filter: "blur(20px)",
                  y: "3em",
                });
                gsap.set(".tor-paragraph", {
                  opacity: 0,
                  filter: "blur(20px)",
                  y: "3em",
                });
                gsap.set(".h1.cc-tor-bottom", {
                  opacity: 0,
                  filter: "blur(20px)",
                  y: "3em",
                });
                gsap.set(".tor-point", {
                  opacity: 0,
                  filter: "blur(10px)",
                  scale: 0.5,
                });
                document.querySelectorAll(".tor-video").forEach((el) => {
                  el.style.display = "none";
                  if (el.tagName === "VIDEO") {
                    try {
                      el.currentTime = 0;
                      el.pause();
                    } catch (e) {}
                  }
                });

                if (firstVideo) {
                  try {
                    firstVideo.currentTime = 0;
                    firstVideo.play();
                  } catch (e) {}
                  scheduleFirstVideoTriggers();
                }

                gsap.set([".card-1", ".card-2", ".card-3"], {
                  opacity: 0,
                  y: "7em",
                  x: "0em",
                  filter: "blur(20px)",
                  scale: 1,
                });
                gsap.set(".heading_wrapper", {
                  opacity: 0,
                  filter: "blur(20px)",
                  y: "3em",
                });

                currentCycleIndex = (currentCycleIndex + 1) % TOTAL_CYCLES;
                setCardTexts(currentCycleIndex);
                setTorTexts(currentCycleIndex);
                const headingEdit2 = document.getElementById("heading-edit");
                if (headingEdit2)
                  headingEdit2.textContent = HEADINGS[currentCycleIndex];

                const heading = document.querySelector(".heading_wrapper");
                if (heading) {
                  gsap.to(heading, {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: "0em",
                    duration: 1,
                  });
                }

                setTimeout(() => {
                  try {
                    firstVideo.currentTime = 0;
                    firstVideo.play();
                  } catch (e) {}
                  setTimeout(() => {
                    if (!cardsLaunched) {
                      cardsLaunched = true;
                      (isMobileXS ? animateCardsMobileXS : animateCards)();
                    }
                  }, 2000);
                }, 0);

                cycleInProgress = false;
              },
            });
          };

          setTimeout(() => {
            // Подготовка к следующему циклу: разворачиваем first, готовим следующий human
            gsap.set(".first-video", {
              width: isMobileXS
                ? MOBILE_PHONE_FIRST_VIDEO_GROW_WIDTH
                : MOBILE_FIRST_VIDEO_GROW_WIDTH,
              filter: isMobileXS
                ? MOBILE_PHONE_FIRST_VIDEO_GROW_FILTER
                : MOBILE_FIRST_VIDEO_GROW_FILTER,
              zIndex: isMobileXS
                ? MOBILE_PHONE_FIRST_VIDEO_GROW_ZINDEX
                : MOBILE_FIRST_VIDEO_GROW_ZINDEX,
              display: "block",
            });

            const nextIdx = (currentCycleIndex + 1) % TOTAL_CYCLES;
            let canplaythroughFired = false;

            if (humanVideo) {
              if (humanVideo.src !== HUMAN_VIDEO_SRCS[nextIdx]) {
                humanVideo.src = HUMAN_VIDEO_SRCS[nextIdx];
                humanVideo.load();
              }
              try {
                humanVideo.pause();
                humanVideo.currentTime = 0;
              } catch (e) {}
              humanVideo.style.display = "block";

              const onReady = () => {
                if (canplaythroughFired) return;
                canplaythroughFired = true;
                fadeTorAndBackground();
              };
              humanVideo.addEventListener("canplaythrough", onReady, {
                once: true,
              });
              if (humanVideo.readyState >= 4) onReady();
              setTimeout(() => {
                if (!canplaythroughFired) onReady();
              }, 7000);
            } else {
              fadeTorAndBackground();
            }
          }, 9000);
        });
      }

      // 17) НАЗНАЧЕНИЕ SRC (первичная инициализация)
      // firstVideo и humanVideo — сразу
      if (firstVideo && firstVideo.src !== VIDEO_SRCS_SAFARI.first) {
        firstVideo.src = VIDEO_SRCS_SAFARI.first;
      }
      if (
        humanVideo &&
        humanVideo.src !== HUMAN_VIDEO_SRCS[currentCycleIndex]
      ) {
        humanVideo.src = HUMAN_VIDEO_SRCS[currentCycleIndex];
      }

      // === ВАЖНО: torVideo ===
      // ДЕСКТОП — назначаем src сразу,
      // МОБИЛКА — НЕ назначаем src до клика (оставляем пустым, только preload="metadata")
      if (torVideo) {
        if (isMobile) {
          torVideo.removeAttribute("src"); // гарантируем отсутствие src до клика
          torVideo.preload = "metadata";
          try {
            torVideo.load?.();
          } catch (e) {}
        } else {
          if (torVideo.src !== VIDEO_SRCS_SAFARI.tor) {
            torVideo.src = VIDEO_SRCS_SAFARI.tor;
          }
        }
      }
    });

    // 18) БЫСТРЫЙ СТАРТ ЛОАДЕРА
    document.addEventListener("DOMContentLoaded", () => {
      const wrapperLoadVideoSafari = document.querySelector(
        ".wrapper-load-video-safari"
      );
      const loaderText = document.querySelector(".loader-text");
      const preloaderLeft = document.querySelector(".preloader-image.is-left");
      const preloaderRight = document.querySelector(
        ".preloader-image.is-right"
      );

      if (wrapperLoadVideoSafari) {
        wrapperLoadVideoSafari.style.display = "flex";
        wrapperLoadVideoSafari.style.opacity = "0";
        gsap.to(wrapperLoadVideoSafari, {
          opacity: 1,
          duration: 1.5,
          ease: "power2.out",
        });
      }

      if (preloaderLeft) {
        preloaderLeft.style.opacity = "0";
        preloaderLeft.style.display = "block";
        const startTween = () => {
          gsap.to(preloaderLeft, {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
              window.preloaderLeftTween = gsap.to(preloaderLeft, {
                scale: 1.1,
                duration: 1.85,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
              });
            },
          });
        };
        if (preloaderLeft.tagName === "IMG" && !preloaderLeft.complete) {
          preloaderLeft.addEventListener("load", startTween, { once: true });
        } else startTween();
      }

      if (preloaderRight) {
        preloaderRight.style.opacity = "0";
        preloaderRight.style.display = "block";
        const startTween = () => {
          gsap.to(preloaderRight, {
            opacity: 1,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
              window.preloaderRightTween = gsap.to(preloaderRight, {
                scale: 1.05,
                duration: 1.85,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut",
              });
            },
          });
        };
        if (preloaderRight.tagName === "IMG" && !preloaderRight.complete) {
          preloaderRight.addEventListener("load", startTween, { once: true });
        } else startTween();
      }

      if (loaderText) {
        window.loaderTextTween = gsap.to(loaderText, {
          opacity: 0.4,
          duration: 1.35,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        });
      }

      window.__preloaderTweens = {
        loaderTextTween: window.loaderTextTween,
        preloaderLeftTween: window.preloaderLeftTween,
        preloaderRightTween: window.preloaderRightTween,
      };
      window.__preloaderEls = {
        loaderText,
        preloaderLeft,
        preloaderRight,
        wrapperLoadVideoSafari,
      };
    });

    console.log("Mobile or Tablet (по ширине окна)");
  } else {
    window.addEventListener("load", () => {
      const logo = document.querySelector(".logo");
      const preloaderLeft = document.querySelector(".preloader-image.is-left");
      const preloaderRight = document.querySelector(
        ".preloader-image.is-right"
      );
      const firstVideo = document.getElementById("first-video");
      const humanVideo = document.getElementById("human-video-1");
      const torVideo = document.getElementById("tor-video");
      const cards = [
        document.querySelector(".card-1"),
        document.querySelector(".card-2"),
        document.querySelector(".card-3"),
      ];
      const torBg = document.querySelector(".tor-background");
      const headingWrapper = document.querySelector(".heading_wrapper");
      const leftContent = document.querySelector(".hero_content-left");
      const rightContent = document.querySelector(
        ".hero_content-right_up-content"
      );
      const btns = document.querySelector(".button-group");

      let launched = false;
      let cardsLaunched = false;
      let cardTimer = null;
      let launchTimer = null;
      let currentCycleIndex = 0;
      const TOTAL_CYCLES = 9;
      let humanVideoReadyToPlay = false;
      let cycleInProgress = false;

      const VIDEO_SRCS_CHROME = {
        first:
          "https://www.dl.dropboxusercontent.com/scl/fi/jwdip9ari9yihatdn3siv/Sphere_Alpha_Intro_v03_600x600-vp9-chrome.webm?rlkey=ktesuj36ob7f2pmq8v79vj6z8&st=pe9abxfp&dl=0",
        tor: "https://www.dl.dropboxusercontent.com/scl/fi/e7zuh4yg7hf0a7u43jjwj/Tor_Alpha_v04-vp9-chrome.webm?rlkey=nmgh0vrtot6pdw14yreiyhw4y&st=lxyyjrez&dl=0",
      };

      const VIDEO_SRCS_SAFARI = {
        first:
          "https://www.dl.dropboxusercontent.com/scl/fi/aq370zj51tozm8kynxu25/Sphere_Alpha_Intro_v03_600x600-hevc-safari.mp4?rlkey=0d9klnr43tdsgr2ll37nuoezo&st=gnpj0gd9&dl=0",
        tor: "https://www.dl.dropboxusercontent.com/scl/fi/5eo9lu45hl69m7eg6qlmd/Tor_Alpha_v04-hevc-safari.mp4?rlkey=6i93kld5gcqbi0p0gj03d46di&st=0x3iy5do&dl=0",
      };

      const CARD_TEXTS = [
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            'Homozygous <span class="tor-paragraph-span">MTHFR C677T (TT)</span> → impaired methyl-folate recycling; <span class="tor-paragraph-span">SLC6A4 5-HTTLPR S/S</span> → poor SSRI response',
            "Plasma homocysteine 17 µmol/L (↑); RBC folate 350 ng/mL (low-normal); CSF 5-HIAA below age norms",
            "Low Bifidobacterium and Akkermansia abundance; high gut-derived LPS gene counts indicating systemic inflammation ",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            'Heterozygous <span class="tor-paragraph-span">POLG p.Ala467Thr</span> mutation (common pathogenic allele)',
            "Plasma lactate 2.8 mmol/L; whole-blood ATP production 65 % of control; urinary F2-isoprostanes elevated",
            "Butyrate < 0.5 mM; depleted Faecalibacterium prausnitzii",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            'Pathogenic <span class="tor-paragraph-span">APC c.3927_3931delAAAGA</span> deletion (classic FAP)',
            "Tumor MSI-high; nuclear β-catenin accumulation",
            "Stool and tumor dominated by Fusobacterium nucleatum FadA+ clade",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            'Heterozygous loss-of-function <span class="tor-paragraph-span">FLG R501X</span> mutation (skin-barrier defect)',
            "Total IgE 1 650 IU/mL; eosinophils 750 /µL; Th2 cytokines elevated",
            "Skin overrun by Staphylococcus aureus (≈ 60 % of reads); gut low in Bifidobacteria",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            "**NAT25/6 slow-acetylator diplotype (predisposes to sulfonamide and nitrofurantoin intolerance)",
            "Urine IL-6 persistently elevated; MDR E. coli on last culture",
            "Near absence of protective Lactobacillus crispatus and L. iners in uro-genital tract",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            '<span class="tor-paragraph-span">HLA-DRB1*03:01</span> auto-thyroid risk allele',
            "Anti-TPO 1 200 IU/mL; anti-TG 350 IU/mL; IL-17A elevated",
            "Zonulin high (leaky gut); low Lactobacillus reuteri abundance",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            "LPA rs10455872 G/G plus < 10 KIV-2 repeats → genetically fixed high Lp(a)",
            "Lp(a) 265 mg/dL; oxidized-phospholipid Lp(a) markedly elevated",
            "Over-representation of TMAO-producing Prevotella species",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            'Homozygous <span class="tor-paragraph-span">APOE ε4/ε4</span> (≈ 15× lifetime AD risk)',
            "Plasma p-tau-217 2.4 pg/mL (↑); Aβ42/40 ratio 0.055 (↓)",
            "Depleted butyrate-producing Faecalibacterium; plasma LPS-binding protein elevated",
          ],
        },
        {
          h1: [
            "Genome findings:",
            "Molecular findings:",
            "Microbiome findings:",
          ],
          p: [
            'Homozygous <span class="tor-paragraph-span">HFE C282Y</span> mutation',
            "Ferritin 1 050 ng/mL; transferrin saturation 82 %; hepatic MRI iron ≈ 200 µmol/g",
            "Gut enriched for siderophore-producing Enterobacteriaceae that enhance iron uptake",
          ],
        },
      ];

      const TOR_TEXTS = [
        {
          paragraph: "Major depressive disorder, SSRI-resistant subtype",
          points: [
            '<span class="tor-paragraph-span">L-methylfolate 15 mg</span> qd (± SAMe);',
            'switch from SSRI to <span class="tor-paragraph-span">vortioxetine</span>;',
            'introduce high-CFU B. longum 1714 <span class="tor-paragraph-span">psychobiotic</span>;',
            'anti-inflammatory, high-prebiotic <span class="tor-paragraph-span">diet</span>',
          ],
        },
        {
          paragraph: "POLG-related mitochondrial dysfunction",
          points: [
            '<span class="tor-paragraph-span">Mitochondrial "cocktail"</span> (CoQ10 300 mg bid, acetyl-L‑carnitine 1 g bid)',
            "riboflavin 200 mg qd",
            'butyrate-enhancing <span class="tor-paragraph-span">prebiotic</span>;',
            'strict <span class="tor-paragraph-span">avoidance</span> of valproate or other POLG‑toxic <span class="tor-paragraph-span">drugs</span>',
          ],
        },
        {
          paragraph:
            "Familial adenomatous polyposis (FAP) with early colon adenocarcinoma",
          points: [
            'Total <span class="tor-paragraph-span">colectomy</span> plus <span class="tor-paragraph-span">chemoprophylaxis</span>;',
            'short <span class="tor-paragraph-span">metronidazole</span> course targeting Fn;',
            'consider adjuvant <span class="tor-paragraph-span">anti-PD-1</span> therapy;',
            ' long-term <span class="tor-paragraph-span">Fn-suppressing synbiotic</span> program',
          ],
        },
        {
          paragraph: "Severe atopic dermatitis with poly-sensitization",
          points: [
            'Daily <span class="tor-paragraph-span">ceramide-rich</span> barrier creams;',
            '<span class="tor-paragraph-span">dupilumab</span> (anti-IL-4Rα);',
            'S. aureus <span class="tor-paragraph-span">decolonization</span> protocol;',
            'B. breve <span class="tor-paragraph-span">synbiotic</span> to restore gut–skin axis',
          ],
        },
        {
          paragraph: "Chronic recurrent lower urinary-tract infection",
          points: [
            'Avoid <span class="tor-paragraph-span">TMP-SMX</span> and <span class="tor-paragraph-span">nitrofurantoin</span>;',
            'non-antibiotic <span class="tor-paragraph-span">prophylaxis</span> (vaginal estrogen + intravesical hyaluronic acid);',
            'high-potency L. crispatus <span class="tor-paragraph-span">probiotic</span>;',
            "pivmecillinam for acute episodes",
          ],
        },
        {
          paragraph: "Hashimoto's thyroiditis",
          points: [
            '<span class="tor-paragraph-span">Selenium</span> 200 µg + <span class="tor-paragraph-span">myo-inositol</span>;',
            'early titrated <span class="tor-paragraph-span">levothyroxine</span>;',
            '12-week gut-repair protocol including <span class="tor-paragraph-span">L. reuteri DSM 17938</span>;',
            'low-dose <span class="tor-paragraph-span">naltrexone</span> for Th17 dampening',
          ],
        },
        {
          paragraph: "Familial hyper-Lp(a)-emia with atherogenic risk",
          points: [
            'Add PCSK9 <span class="tor-paragraph-span">monoclonal antibody</span> (≈ 25 % Lp(a) reduction);',
            'screen/enroll in <span class="tor-paragraph-span">siRNA Lp(a) trial</span>;',
            "olpasiran or lepodisiran, > 90 % reduction;",
            'Mediterranean/TMAO-lowering <span class="tor-paragraph-span">diet</span>',
          ],
        },
        {
          paragraph:
            "Early mild cognitive impairment due to Alzheimer's disease (APOE ε4/ε4)",
          points: [
            'Offer <span class="tor-paragraph-span">lecanemab</span>;',
            'discuss enrollment in <span class="tor-paragraph-span">ALZ-801 ε4-targeted</span> trial;',
            '<span class="tor-paragraph-span">ketogenic</span> medical food;',
            '<span class="tor-paragraph-span">high-butyrate synbiotic</span> to reduce gut-brain inflammation',
          ],
        },
        {
          paragraph: "Type 1 hereditary hemochromatosis",
          points: [
            "Therapeutic phlebotomy every 2 weeks until ferritin < 100 ng/mL, then quarterly;",
            "evaluate for AAV8 adenine base-editing C282Y trial;",
            "low-iron diet plus Lactobacillus plantarum;",
            "probiotic that sequesters luminal iron",
          ],
        },
      ];

      const HEADINGS = [
        "Young Adult With Treatment-Resistant Depression",
        'Mid-40s Executive With Crushing Fatigue and "Brain Fog"',
        "Thirty-Two-Year-Old Man Presenting With Stage II Colon Cancer",
        "Six-Year-Old Child With Severe Eczema and Multiple Food Allergies",
        "Post-Menopausal Woman With Recurrent UTIs and Drug Intolerance",
        "Thirty-Five-Year-Old Woman With Rapidly Progressing Thyroiditis",
        "Ultra-Fit 48-Year-Old Cyclist With Strong Family History of Early MI",
        "55-Year-Old Software Engineer With Subtle Memory Lapses",
        "40-Year-Old Man With Joint Pain and Elevated Liver Enzymes",
      ];

      function isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      }
      const SAFARI = isSafari();

      console.log("userAgent:", navigator.userAgent);
      console.log("isSafari:", SAFARI);

      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent
      );
      console.log("isMobileDevice:", isMobileDevice ? "MOBILE" : "DESKTOP");
      if (isMobileDevice) {
        if (SAFARI) {
          console.log(
            "Мобильный Safari (или браузер на iOS): используется mp4"
          );
        } else {
          console.log(
            "Мобильный Chrome/другой (Android): используется webm/webp"
          );
        }
      } else {
        if (SAFARI) {
          console.log("Десктопный Safari: используется mp4");
        } else {
          console.log("Десктопный Chrome/другой: используется webm/webp");
        }
      }

      const startBtn = document.getElementById("start-btn");

      const HUMAN_VIDEO_SRCS_CHROME = [
        "https://www.dl.dropboxusercontent.com/scl/fi/h6gd6j3p9zyieb9ih3y8t/Young-Adult-vp9-chrome.webm?rlkey=et5pwl3p66lvcakgb6y85djew&st=14763z6r&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/5pe2p118whc6r1h1x9j61/Mid-40s-Executive-vp9-chrome.webm?rlkey=5s8j16cd0b4yg1b364t99rtek&e=1&st=rtervyhi&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/d351b6zmfc9tdav5vmn1u/32-Year-Old-Man-vp9-chrome.webm?rlkey=tqyoijuxmxhsucoclv1q9b7as&st=cop5ll0k&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/7xukmyi115nzju51klcev/6-Year-Old-Child-vp9-chrome.webm?rlkey=yya3ljdxm8ijbo54bptgpn8n4&st=357snb3k&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/otu69rjxkcpzerq7i1qju/Post-Menopausal-vp9-chrome.webm?rlkey=qpjvaaaxj0f8i7v6zsr20mvzt&st=r5xrgyz2&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/i1xgfxns3elem4hvtuaag/35-Year-Old-vp9-chrome.webm?rlkey=93ihz0ylz8iqlcfjk9439ju0b&st=7pwz1rig&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/acly8937wnm0hcobthwex/Ultra-Fit-48-Year-Old-vp9-chrome.webm?rlkey=uk88h69ld29rdbpenujcpsns7&st=2eui8c15&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/eil1xviiaf4ogx9r2rdbj/55-Year-Old-Software-vp9-chrome.webm?rlkey=osd547b1qkzzfmpt3qsghh3z6&st=uks8mj6e&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/mie75x1c1ebtnj0ohag4i/40-Year-Old-Man-vp9-chrome.webm?rlkey=4ounepytupxzetnybe4lrpnej&st=6vx4z5j2&dl=0",
      ];

      const HUMAN_VIDEO_SRCS_SAFARI = [
        "https://www.dl.dropboxusercontent.com/scl/fi/re3jojg4z0cep2o6tx1y8/Young-Adult-hevc-safari.mp4?rlkey=qdk0t0p3n8pnkpvvlq8o18ji5&st=l47fj9oe&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/i49uyalox87idh17bdyqr/Mid-40s-Executive-hevc-safari.mp4?rlkey=c1lcixaud8wr1pne7gwj9pau8&st=kk85u6c2&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/1iihd31bb8plzm468q7ax/32-Year-Old-Man-hevc-safari.mp4?rlkey=wakck3sw2zmtsgopggd8q2h5l&st=6b2du856&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/meflao9fkq4icf8r39tg9/6-Year-Old-Child-hevc-safari.mp4?rlkey=rvvj08ljvkejrwdjks4k5499x&st=sd3qss6v&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/zk1uzlwm7wibpf90ge4ct/Post-Menopausal-hevc-safari.mp4?rlkey=csr5dy6gs6ke33k1tygihh52t&st=0rg9twib&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/pvhogt2vowlejdhjh2ey6/35-Year-Old-hevc-safari.mp4?rlkey=g7eqaqotlsdbtl5lhwaistbff&st=8v8fruse&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/7pimiyumyrj8jn4959w83/Ultra-Fit-48-Year-Old-hevc-safari.mp4?rlkey=1clisdg6lopgcpjs6jho55xda&st=xypcc5ub&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/eclc6j434160i4v6qw45f/55-Year-Old-Software-hevc-safari.mp4?rlkey=51javiha5zdiy8wxw607mourx&st=yt38ynkv&dl=0",
        "https://www.dl.dropboxusercontent.com/scl/fi/tz58jtpehokqci21kq8vk/40-Year-Old-Man-hevc-safari.mp4?rlkey=a70yi3jloke1rincfk3s4ee1q&st=6dsprpwh&dl=0",
      ];

      const HUMAN_VIDEO_SRCS = SAFARI
        ? HUMAN_VIDEO_SRCS_SAFARI
        : HUMAN_VIDEO_SRCS_CHROME;

      const MOBILE_BREAKPOINT = 991;
      const MOBILE_XS_BREAKPOINT = 479;
      const DESKTOP_FIRST_VIDEO_SET_WIDTH = "250em";
      const DESKTOP_FIRST_VIDEO_SET_FILTER = "blur(25px)";
      const DESKTOP_FIRST_VIDEO_SHRINK_WIDTH = "70vh";
      const DESKTOP_FIRST_VIDEO_SHRINK_DURATION = 0.8;
      const DESKTOP_FIRST_VIDEO_GROW_WIDTH = "400vh";
      const DESKTOP_FIRST_VIDEO_GROW_FILTER = "blur(25px)";
      const DESKTOP_FIRST_VIDEO_GROW_ZINDEX = 1;

      const MOBILE_FIRST_VIDEO_SET_WIDTH = "400vh";
      const MOBILE_FIRST_VIDEO_SET_FILTER = "blur(25px)";
      const MOBILE_FIRST_VIDEO_SHRINK_WIDTH = "80vw";
      const MOBILE_FIRST_VIDEO_SHRINK_DURATION = 0.8;
      const MOBILE_FIRST_VIDEO_GROW_WIDTH = "400vh";
      const MOBILE_FIRST_VIDEO_GROW_FILTER = "blur(25px)";
      const MOBILE_FIRST_VIDEO_GROW_ZINDEX = 1;

      const MOBILE_PHONE_FIRST_VIDEO_SET_WIDTH = "400vh";
      const MOBILE_PHONE_FIRST_VIDEO_SET_FILTER = "blur(25px)";
      const MOBILE_PHONE_FIRST_VIDEO_SHRINK_WIDTH = "110vw";
      const MOBILE_PHONE_FIRST_VIDEO_SHRINK_DURATION = 0.8;
      const MOBILE_PHONE_FIRST_VIDEO_GROW_WIDTH = "400vh";
      const MOBILE_PHONE_FIRST_VIDEO_GROW_FILTER = "blur(25px)";
      const MOBILE_PHONE_FIRST_VIDEO_GROW_ZINDEX = 1;

      const DESKTOP_TOR_BG_SET_WIDTH = "0em";
      const DESKTOP_TOR_BG_SET_HEIGHT = "0em";
      const DESKTOP_TOR_BG_GROW_WIDTH = "130em";
      const DESKTOP_TOR_BG_GROW_HEIGHT = "130em";
      const DESKTOP_TOR_BG_GROW_DURATION = 2;

      const MOBILE_TOR_BG_SET_WIDTH = "0vw";
      const MOBILE_TOR_BG_SET_HEIGHT = "0vw";
      const MOBILE_TOR_BG_GROW_WIDTH = "180vw";
      const MOBILE_TOR_BG_GROW_HEIGHT = "180vw";
      const MOBILE_TOR_BG_GROW_DURATION = 1.6;

      const MOBILE_PHONE_TOR_BG_SET_WIDTH = "0vw";
      const MOBILE_PHONE_TOR_BG_SET_HEIGHT = "0vw";
      const MOBILE_PHONE_TOR_BG_GROW_WIDTH = "200vw";
      const MOBILE_PHONE_TOR_BG_GROW_HEIGHT = "200vw";
      const MOBILE_PHONE_TOR_BG_GROW_DURATION = 1.6;

      const DESKTOP_LOGO_TOP = "3.2vh";
      const DESKTOP_LOGO_LEFT = "10vh";
      const DESKTOP_LOGO_DURATION = 1.2;

      const MOBILE_LOGO_TOP = "2.86vw";
      const MOBILE_LOGO_LEFT = "9vw";
      const MOBILE_LOGO_DURATION = 1.2;

      const MOBILE_PHONE_LOGO_TOP = "3.4vw";
      const MOBILE_PHONE_LOGO_LEFT = "10vw";
      const MOBILE_PHONE_LOGO_DURATION = 1.2;

      const DESKTOP_TOR_VIDEO_RESET_WIDTH = "120vw";
      const DESKTOP_TOR_VIDEO_RESET_HEIGHT = "120vh";
      const MOBILE_TOR_VIDEO_RESET_WIDTH = "130vh";
      const MOBILE_TOR_VIDEO_RESET_HEIGHT = "100vw";
      const MOBILE_PHONE_TOR_VIDEO_RESET_WIDTH = "100vh";
      const MOBILE_PHONE_TOR_VIDEO_RESET_HEIGHT = "100vw";

      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      const isMobileXS = window.innerWidth <= MOBILE_XS_BREAKPOINT;
      gsap.set(cards, {
        opacity: 0,
        y: "7em",
        x: "0em",
        filter: "blur(20px)",
        scale: 1,
      });
      gsap.set(".tor-background", {
        width: isMobileXS
          ? MOBILE_PHONE_TOR_BG_SET_WIDTH
          : isMobile
          ? MOBILE_TOR_BG_SET_WIDTH
          : DESKTOP_TOR_BG_SET_WIDTH,
        height: isMobileXS
          ? MOBILE_PHONE_TOR_BG_SET_HEIGHT
          : isMobile
          ? MOBILE_TOR_BG_SET_HEIGHT
          : DESKTOP_TOR_BG_SET_HEIGHT,
      });
      gsap.set(".first-video", {
        width: isMobileXS
          ? MOBILE_PHONE_FIRST_VIDEO_SET_WIDTH
          : isMobile
          ? MOBILE_FIRST_VIDEO_SET_WIDTH
          : DESKTOP_FIRST_VIDEO_SET_WIDTH,
        filter: isMobileXS
          ? MOBILE_PHONE_FIRST_VIDEO_SET_FILTER
          : isMobile
          ? MOBILE_FIRST_VIDEO_SET_FILTER
          : DESKTOP_FIRST_VIDEO_SET_FILTER,
        zIndex: isMobileXS
          ? MOBILE_PHONE_FIRST_VIDEO_GROW_ZINDEX
          : isMobile
          ? MOBILE_FIRST_VIDEO_GROW_ZINDEX
          : DESKTOP_FIRST_VIDEO_GROW_ZINDEX,
      });
      gsap.set(".tor-video", { opacity: 1, display: "none" });
      gsap.set("#human-video-1", { display: "block" });
      gsap.set(".h1.cc-tor", { opacity: 0, filter: "blur(20px)", y: "3em" });
      gsap.set(".tor-paragraph", {
        opacity: 0,
        filter: "blur(20px)",
        y: "3em",
      });
      gsap.set(".h1.cc-tor-bottom", {
        opacity: 0,
        filter: "blur(20px)",
        y: "3em",
      });
      gsap.set(".tor-point", { opacity: 0, filter: "blur(10px)", scale: 0.5 });
      if (logo) logo.style.opacity = "0";
      if (startBtn) {
        if (SAFARI) {
          startBtn.style.opacity = "0";
          startBtn.style.display = "block";
          gsap.to(startBtn, { opacity: 1, duration: 0.5 });
        } else {
          startBtn.style.display = "none";
        }
      }

      // Добавляем object-fit и background-size для #human-video, если ширина окна больше 991
      if (window.innerWidth > 991) {
        const humanVideoEl = document.getElementById("human-video-1");
        if (humanVideoEl) {
          humanVideoEl.style.objectFit = "cover";
          humanVideoEl.style.backgroundSize = "cover";
        }
      }

      function setCardTexts(cycleIdx) {
        const h1_1 = document.getElementById("heading-card-1-edit");
        const h1_2 = document.getElementById("heading-card-2-edit");
        const h1_3 = document.getElementById("heading-card-3-edit");
        const p1 = document.getElementById("paragraph-card-1-edit");
        const p2 = document.getElementById("paragraph-card-2-edit");
        const p3 = document.getElementById("paragraph-card-3-edit");
        const data = CARD_TEXTS[cycleIdx];
        if (h1_1) h1_1.textContent = data.h1[0];
        if (h1_2) h1_2.textContent = data.h1[1];
        if (h1_3) h1_3.textContent = data.h1[2];
        if (p1) p1.innerHTML = data.p[0];
        if (p2) p2.innerHTML = data.p[1];
        if (p3) p3.innerHTML = data.p[2];
      }

      function setTorTexts(cycleIdx) {
        const torParagraph = document.getElementById("tor-paragraph-edit");
        const torPoint1 = document.getElementById("tor-point-1-edit");
        const torPoint2 = document.getElementById("tor-point-2-edit");
        const torPoint3 = document.getElementById("tor-point-3-edit");
        const torPoint4 = document.getElementById("tor-point-4-edit");
        const data = TOR_TEXTS[cycleIdx];
        if (
          !torParagraph ||
          !torPoint1 ||
          !torPoint2 ||
          !torPoint3 ||
          !torPoint4
        )
          return;
        torParagraph.textContent = data.paragraph;
        torPoint1.innerHTML = data.points[0];
        torPoint2.innerHTML = data.points[1];
        torPoint3.innerHTML = data.points[2];
        torPoint4.innerHTML = data.points[3];
      }

      setCardTexts(currentCycleIndex);
      setTorTexts(currentCycleIndex);
      const headingEdit = document.getElementById("heading-edit");
      if (headingEdit) {
        headingEdit.textContent = HEADINGS[currentCycleIndex];
      }

      function animateCards() {
        gsap.to(".card-1", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          ease: "power2.out",
        });
        gsap.to(".card-2", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.4,
          ease: "power2.out",
        });
        gsap.to(".card-3", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.8,
          ease: "power2.out",
          onComplete() {
            setTimeout(() => {
              gsap.to(".card-3", {
                duration: 3,
                scale: 0,
                motionPath: {
                  path: "M0,0 C0,0 16.978,-29.377 -14,-116 -44.902,-202.408 -272,-201 -272,-201 ",
                },
                ease: CustomEase.create(
                  "custom",
                  "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                ),
                onStart: () => {
                  setTimeout(() => {
                    const firstVideoEl = document.querySelector(".first-video");
                    if (firstVideoEl) firstVideoEl.style.zIndex = "7";
                  }, 2800);

                  setTimeout(() => {
                    gsap.to(".card-1", {
                      duration: 4.4,
                      scale: 0,
                      motionPath: {
                        path: "M0,0 C0,0 -66.417,-320.956 66.399,-326.999 135.411,-330.137 469.599,-64.599 469.599,-64.599 ",
                      },
                      ease: CustomEase.create(
                        "custom",
                        "M0,0 C0.311,0.361 1.024,0.066 1,1 "
                      ),
                      onStart: () => {
                        setTimeout(() => {
                          gsap.to(".card-2", {
                            duration: 4.2,
                            scale: 0,
                            motionPath: {
                              path: "M0,0 C0,0 -346.828,64.842 -338.997,-27 -329.793,-134.933 117,-81 117,-81 ",
                            },
                            ease: CustomEase.create(
                              "custom",
                              "M0,0 C0.152,0.687 1.024,0.066 1,1 "
                            ),
                          });
                        }, 1100);
                        if (typeof MotionPathHelper !== "undefined") {
                        }
                      },
                    });
                  }, 1000);
                },
              });
            }, 4200);
          },
        });
      }

      function animateCardsMobileXS() {
        gsap.to(".card-1", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          ease: "power2.out",
        });
        gsap.to(".card-2", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.4,
          ease: "power2.out",
        });
        gsap.to(".card-3", {
          opacity: 1,
          y: "0em",
          filter: "blur(0px)",
          duration: 1.3,
          delay: 0.8,
          ease: "power2.out",
          onComplete() {
            setTimeout(() => {
              gsap.to(".card-1", {
                duration: 3,
                scale: 0,
                motionPath: {
                  path: "M0,0 C0,0 12.077,-62.307 14.799,-44.255 20.172,-8.615 20.893,35.242 20.893,35.242 ",
                },
                ease: CustomEase.create(
                  "custom",
                  "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                ),
                onStart: () => {
                  if (typeof MotionPathHelper !== "undefined") {
                  }
                  gsap.to(".card-1", {
                    opacity: 0,
                    delay: 2.92,
                    duration: 0.3,
                    ease: "power1.out",
                  });
                  setTimeout(() => {}, 2800);
                  setTimeout(() => {
                    gsap.to(".card-2", {
                      duration: 3.0,
                      scale: 0,
                      motionPath: {
                        path: "M0,0 C0,0 27.041,-158.509 29.789,-140.503 35.147,-104.765 28.896,-37.207 28.896,-37.207 ",
                      },
                      ease: CustomEase.create(
                        "custom",
                        "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                      ),
                      onStart: () => {
                        if (typeof MotionPathHelper !== "undefined") {
                        }
                        gsap.to(".card-2", {
                          opacity: 0,
                          delay: 2.92,
                          duration: 0.3,
                          ease: "power1.out",
                        });
                        setTimeout(() => {
                          gsap.to(".card-3", {
                            duration: 3,
                            scale: 0,
                            motionPath: {
                              path: "M0,0 C0,0 6.012,83.975 9.338,70.033 18.961,29.686 23.59,0.765 23.59,0.765 ",
                            },
                            ease: CustomEase.create(
                              "custom",
                              "M0,0 C1.04,0.118 0.967,0.745 1,1 "
                            ),
                            onStart: () => {
                              if (typeof MotionPathHelper !== "undefined") {
                              }
                              gsap.to(".card-3", {
                                opacity: 0,
                                delay: 2.7,
                                duration: 0.74,
                                ease: "power1.out",
                              });
                            },
                          });
                        }, 1000);
                      },
                    });
                  }, 2400);
                },
              });
            }, 4100);
          },
        });
      }
      function scheduleFirstVideoTriggers() {
        if (cycleInProgress) return;
        if (cardTimer) clearTimeout(cardTimer);
        if (launchTimer) clearTimeout(launchTimer);
        launched = false;
        cardsLaunched = false;
        cardTimer = setTimeout(() => {
          if (cardsLaunched) return;
          cardsLaunched = true;
          (isMobileXS ? animateCardsMobileXS : animateCards)();
        }, 2000);
        launchTimer = setTimeout(() => {
          if (launched) return;
          launched = true;
          if (humanVideo) {
            humanVideoReadyToPlay = true;
            humanVideo.currentTime = 0;
            humanVideo.play();
          }
        }, 4730);
      }
      function startPreloaderAnimation() {
        const left = document.querySelector(".hero_content-left");
        const right = document.querySelector(".hero_content-right_up-content");
        const btns = document.querySelector(".button-group");
        const heading = document.querySelector(".heading_wrapper");

        if (logo) logo.style.opacity = "1";

        [heading, left, right, btns].forEach((el) => {
          if (el) gsap.set(el, { opacity: 0, filter: "blur(20px)", y: "3em" });
        });

        const split = new SplitText(logo, {
          type: "chars",
          charsClass: "char",
        });
        const tl = gsap.timeline();

        tl.add([
          gsap.to(logo, { scale: 1, duration: 1.2, ease: "power1.out" }),
          gsap.to(split.chars, {
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out",
          }),
        ])
          .to(
            logo,
            {
              scale: 0.2,
              top: isMobileXS
                ? MOBILE_PHONE_LOGO_TOP
                : isMobile
                ? MOBILE_LOGO_TOP
                : DESKTOP_LOGO_TOP,
              left: isMobileXS
                ? MOBILE_PHONE_LOGO_LEFT
                : isMobile
                ? MOBILE_LOGO_LEFT
                : DESKTOP_LOGO_LEFT,
              x: 0,
              y: 0,
              transform: "scale(0.2)",
              duration: isMobileXS
                ? MOBILE_PHONE_LOGO_DURATION
                : isMobile
                ? MOBILE_LOGO_DURATION
                : DESKTOP_LOGO_DURATION,
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
            preloaderLeft,
            { x: "-100%", duration: 1, ease: "power2.out" },
            "<"
          )
          .to(
            preloaderRight,
            { x: "100%", duration: 1, ease: "power2.out" },
            "<"
          )
          .to(
            document.querySelector(".preloader-nav"),
            {
              background: "rgba(0,0,0,0)",
              duration: 1,
              ease: "power1.out",
              onStart() {
                if (cycleInProgress) return;
                if (firstVideo) {
                  firstVideo.currentTime = 0;
                  firstVideo.muted = true;
                  firstVideo.play().catch((err) => {
                    console.warn("Автозапуск firstVideo не удался:", err);
                  });
                  // Reset torVideo after 4 seconds
                  if (torVideo) {
                    setTimeout(() => {
                      torVideo.currentTime = 0;
                      torVideo.pause();
                    }, 4000);
                  }
                  scheduleFirstVideoTriggers();
                }
                setTimeout(() => {
                  if (heading)
                    gsap.to(heading, {
                      opacity: 1,
                      filter: "blur(0px)",
                      y: "0em",
                      duration: 1,
                    });
                  setTimeout(() => {
                    if (left)
                      gsap.to(left, {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: "0em",
                        duration: 1,
                      });
                    if (right)
                      setTimeout(
                        () =>
                          gsap.to(right, {
                            opacity: 1,
                            filter: "blur(0px)",
                            y: "0em",
                            duration: 1,
                          }),
                        200
                      );
                    if (btns)
                      setTimeout(() => {
                        gsap.to(btns, {
                          opacity: 1,
                          filter: "blur(0px)",
                          y: "0em",
                          duration: 1,
                        });
                      }, 400);
                  }, 400);
                }, 600);
              },
            },
            "-=0.6"
          );
      }

      function runWhenFirstVideoReady(callback) {
        if (!firstVideo) return callback();
        if (firstVideo.readyState >= 4) {
          callback();
        } else {
          firstVideo.addEventListener("canplaythrough", callback, {
            once: true,
          });
        }
      }

      if (SAFARI) {
        if (startBtn) {
          startBtn.addEventListener(
            "click",
            () => {
              gsap.to(startBtn, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                  startBtn.style.display = "none";
                },
              });
              if (firstVideo) {
                firstVideo.currentTime = 0;
                firstVideo.muted = true;
                const playPromise = firstVideo.play();
                const launchAnimation = () => {
                  setTimeout(() => {
                    startPreloaderAnimation();
                  }, 300);
                };
                if (firstVideo.readyState >= 4) {
                  launchAnimation();
                } else {
                  firstVideo.addEventListener(
                    "canplaythrough",
                    launchAnimation,
                    { once: true }
                  );
                }
                if (playPromise && playPromise.catch) {
                  playPromise.catch((err) => {
                    console.warn("Safari не смог запустить видео:", err);
                  });
                }
              }
            },
            { once: true }
          );
        }
      } else {
        runWhenFirstVideoReady(() => {
          setTimeout(() => {
            startPreloaderAnimation();
          }, 300);
        });
      }

      if (humanVideo) {
        humanVideo.addEventListener("play", () => {
          if (!humanVideoReadyToPlay) {
            humanVideo.pause();
            humanVideo.currentTime = 0;

            return;
          }

          // Сбрасываем torVideo когда запускается humanVideo
          if (torVideo) {
            torVideo.currentTime = 0;
            torVideo.pause();
          }

          setTimeout(() => {
            humanVideo.style.display = "none";
            gsap.to(document.querySelectorAll(".first-video"), {
              width: isMobileXS
                ? MOBILE_PHONE_FIRST_VIDEO_SHRINK_WIDTH
                : isMobile
                ? MOBILE_FIRST_VIDEO_SHRINK_WIDTH
                : DESKTOP_FIRST_VIDEO_SHRINK_WIDTH,
              filter: "blur(0px)",
              duration: isMobileXS
                ? MOBILE_PHONE_FIRST_VIDEO_SHRINK_DURATION
                : isMobile
                ? MOBILE_FIRST_VIDEO_SHRINK_DURATION
                : DESKTOP_FIRST_VIDEO_SHRINK_DURATION,
              ease: "power2.out",
            });
            const nextIdx = (currentCycleIndex + 1) % TOTAL_CYCLES;
            if (humanVideo && humanVideo.src !== HUMAN_VIDEO_SRCS[nextIdx]) {
              humanVideo.src = HUMAN_VIDEO_SRCS[nextIdx];
            }
          }, 2200);

          setTimeout(() => {
            const heading = document.querySelector(".heading_wrapper");
            if (heading)
              gsap.to(heading, {
                opacity: 0,
                duration: 0.5,
                ease: "power1.out",
              });
          }, 500);
        });
      }

      if (firstVideo) {
        firstVideo.addEventListener("ended", () => {
          document
            .querySelectorAll(".first-video")
            .forEach((el) => (el.style.display = "none"));
          document
            .querySelectorAll(".tor-video")
            .forEach((el) => (el.style.display = "none"));

          if (torVideo) {
            setTorTexts(currentCycleIndex);
            function showTorVideo() {
              document
                .querySelectorAll(".tor-video")
                .forEach((el) => (el.style.display = "block"));

              if (torVideo.readyState >= 3) {
                torVideo.currentTime = 0;
              } else {
                torVideo.addEventListener(
                  "canplay",
                  () => {
                    torVideo.currentTime = 0;
                  },
                  { once: true }
                );
              }
              const playPromise = torVideo.play();

              setTimeout(() => {
                torVideo.play();
              }, 0);

              if (playPromise && playPromise.catch) {
                playPromise.catch((err) => {
                  torVideo.muted = true;
                  torVideo.play().catch(() => {});
                });
              }

              torVideo.addEventListener("play", () => {
                // Логирование уже запущено постоянно
              });
              torVideo.addEventListener("playing", () => {});
              torVideo.addEventListener("timeupdate", () => {});
              torVideo.addEventListener("pause", () => {
                // Не останавливаем логирование - оно продолжается
              });
              torVideo.addEventListener("ended", () => {
                // Не останавливаем логирование - оно продолжается
              });
              torVideo.removeEventListener("canplay", showTorVideo);
            }
            if (torVideo.readyState >= 3) {
              showTorVideo();
            } else {
              torVideo.addEventListener("canplay", showTorVideo);
            }
          }

          const torBg = document.querySelector(".tor-background");
          if (torBg) {
            gsap.to(torBg, {
              width: isMobileXS
                ? MOBILE_PHONE_TOR_BG_GROW_WIDTH
                : isMobile
                ? MOBILE_TOR_BG_GROW_WIDTH
                : DESKTOP_TOR_BG_GROW_WIDTH,
              height: isMobileXS
                ? MOBILE_PHONE_TOR_BG_GROW_HEIGHT
                : isMobile
                ? MOBILE_TOR_BG_GROW_HEIGHT
                : DESKTOP_TOR_BG_GROW_HEIGHT,
              duration: isMobileXS
                ? MOBILE_PHONE_TOR_BG_GROW_DURATION
                : isMobile
                ? MOBILE_TOR_BG_GROW_DURATION
                : DESKTOP_TOR_BG_GROW_DURATION,
              ease: "power1.out",
              onStart: () => {
                setTimeout(() => {
                  gsap.to(".h1.cc-tor", {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: "0em",
                    duration: 1,
                  });
                  setTimeout(() => {
                    gsap.to(".tor-paragraph", {
                      opacity: 1,
                      filter: "blur(0px)",
                      y: "0em",
                      duration: 1,
                    });
                    setTimeout(() => {
                      gsap.to(".h1.cc-tor-bottom", {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: "0em",
                        duration: 1,
                      });
                      setTimeout(() => {
                        const points = document.querySelectorAll(".tor-point");
                        points.forEach((el, i) => {
                          setTimeout(() => {
                            gsap.to(el, {
                              opacity: 1,
                              filter: "blur(0px)",
                              scale: 1,
                              duration: 0.8,
                            });
                          }, i * 400);
                        });
                      }, 200);
                    }, 800);
                  }, 200);
                }, 1000);
              },
            });
          }
        });
      }

      if (torVideo) {
        // Добавляем интервал для логирования времени torVideo
        let torVideoLogInterval;

        function startTorVideoLogging() {
          if (torVideoLogInterval) {
            clearInterval(torVideoLogInterval);
          }
          torVideoLogInterval = setInterval(() => {
            if (torVideo) {
              const status = torVideo.paused
                ? "PAUSED"
                : torVideo.ended
                ? "ENDED"
                : "PLAYING";
              console.log(
                `[torVideo] Current time: ${torVideo.currentTime.toFixed(
                  2
                )}s / ${torVideo.duration.toFixed(2)}s (${status})`
              );
            }
          }, 500);
        }

        // Запускаем логирование сразу при загрузке страницы
        startTorVideoLogging();

        function fadeTorAndBackground() {
          gsap.to([".tor-video", ".tor-background"], {
            opacity: 0,
            duration: 1.3,
            onComplete: () => {
              // Не останавливаем логирование - оно продолжается постоянно
              gsap.set(
                [
                  ".tor-video",
                  ".tor-background",
                  ".h1.cc-tor",
                  ".tor-paragraph",
                  ".h1.cc-tor-bottom",
                  ".tor-point",
                ],
                { clearProps: "all" }
              );
              gsap.set(".tor-video", {
                width: isMobileXS
                  ? MOBILE_PHONE_TOR_VIDEO_RESET_WIDTH
                  : isMobile
                  ? MOBILE_TOR_VIDEO_RESET_WIDTH
                  : DESKTOP_TOR_VIDEO_RESET_WIDTH,
                height: isMobileXS
                  ? MOBILE_PHONE_TOR_VIDEO_RESET_HEIGHT
                  : isMobile
                  ? MOBILE_TOR_VIDEO_RESET_HEIGHT
                  : DESKTOP_TOR_VIDEO_RESET_HEIGHT,
                opacity: 1,
                display: "none",
              });
              gsap.set(".h1.cc-tor", {
                opacity: 0,
                filter: "blur(20px)",
                y: "3em",
              });
              gsap.set(".tor-paragraph", {
                opacity: 0,
                filter: "blur(20px)",
                y: "3em",
              });
              gsap.set(".h1.cc-tor-bottom", {
                opacity: 0,
                filter: "blur(20px)",
                y: "3em",
              });
              gsap.set(".tor-point", {
                opacity: 0,
                filter: "blur(10px)",
                scale: 0.5,
              });
              document.querySelectorAll(".tor-video").forEach((el) => {
                el.style.display = "none";
                if (el.tagName === "VIDEO") {
                  el.currentTime = 0;
                  el.pause();
                }
              });
              const heading = document.querySelector(".heading_wrapper");
              const left = document.querySelector(".hero_content-left");
              const right = document.querySelector(
                ".hero_content-right_up-content"
              );
              const btns = document.querySelector(".button-group");
              setTimeout(() => {
                if (heading)
                  gsap.to(heading, {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: "0em",
                    duration: 1,
                  });
                setTimeout(() => {
                  if (left)
                    gsap.to(left, {
                      opacity: 1,
                      filter: "blur(0px)",
                      y: "0em",
                      duration: 1,
                    });
                  if (right)
                    setTimeout(
                      () =>
                        gsap.to(right, {
                          opacity: 1,
                          filter: "blur(0px)",
                          y: "0em",
                          duration: 1,
                        }),
                      200
                    );
                  if (btns)
                    setTimeout(() => {
                      gsap.to(btns, {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: "0em",
                        duration: 1,
                      });
                    }, 400);
                }, 400);
              }, 600);
              launched = false;
              cardsLaunched = false;
              currentCycleIndex = (currentCycleIndex + 1) % TOTAL_CYCLES;
              setCardTexts(currentCycleIndex);
              setTorTexts(currentCycleIndex);
              const headingEdit = document.getElementById("heading-edit");
              if (headingEdit) {
                headingEdit.textContent = HEADINGS[currentCycleIndex];
              }
              gsap.set(cards, {
                opacity: 0,
                y: "7em",
                x: "0em",
                filter: "blur(20px)",
                scale: 1,
              });
              if (firstVideo) {
                firstVideo.currentTime = 0;
                firstVideo.play();
              }
              cycleInProgress = false;
              scheduleFirstVideoTriggers();
            },
          });
        }
        torVideo.addEventListener("play", () => {
          if (cycleInProgress) return;
          cycleInProgress = true;
          setTimeout(() => {
            const nextIdx = (currentCycleIndex + 1) % TOTAL_CYCLES;
            if (humanVideo.src !== HUMAN_VIDEO_SRCS[nextIdx]) {
              humanVideo.src = HUMAN_VIDEO_SRCS[nextIdx];
            }
            humanVideo.pause();
            humanVideoReadyToPlay = false;
            humanVideo.currentTime = 0;
            humanVideo.style.display = "block";
            firstVideo.currentTime = 0;
            firstVideo.style.display = "block";

            const readyHandler = () => {
              fadeTorAndBackground();
              humanVideo.removeEventListener("canplaythrough", readyHandler);
            };
            humanVideo.addEventListener("canplaythrough", readyHandler, {
              once: true,
            });
            if (humanVideo.readyState >= 4) readyHandler();
            gsap.set(".first-video", {
              width: isMobileXS
                ? MOBILE_FIRST_VIDEO_GROW_WIDTH
                : isMobile
                ? MOBILE_FIRST_VIDEO_GROW_WIDTH
                : DESKTOP_FIRST_VIDEO_GROW_WIDTH,
              filter: isMobileXS
                ? MOBILE_FIRST_VIDEO_GROW_FILTER
                : isMobile
                ? MOBILE_FIRST_VIDEO_GROW_FILTER
                : DESKTOP_FIRST_VIDEO_GROW_FILTER,
              zIndex: isMobileXS
                ? MOBILE_FIRST_VIDEO_GROW_ZINDEX
                : isMobile
                ? MOBILE_FIRST_VIDEO_GROW_ZINDEX
                : DESKTOP_FIRST_VIDEO_GROW_ZINDEX,
              display: "block",
            });
          }, 9000);
        });
      }

      if (!SAFARI) {
        if (firstVideo && firstVideo.src !== VIDEO_SRCS_CHROME.first) {
          firstVideo.src = VIDEO_SRCS_CHROME.first;
        }
        if (torVideo && torVideo.src !== VIDEO_SRCS_CHROME.tor) {
          torVideo.src = VIDEO_SRCS_CHROME.tor;
        }
        if (
          humanVideo &&
          humanVideo.src !== HUMAN_VIDEO_SRCS_CHROME[currentCycleIndex]
        ) {
          humanVideo.src = HUMAN_VIDEO_SRCS_CHROME[currentCycleIndex];
        }
      } else {
        if (firstVideo) console.log("firstVideo.src (Safari):", firstVideo.src);

        if (torVideo) console.log("torVideo.src (Safari):", torVideo.src);
        if (humanVideo) console.log("humanVideo.src (Safari):", humanVideo.src);
      }

      if (firstVideo) {
        firstVideo.setAttribute("muted", "");
        firstVideo.setAttribute("playsinline", "");
        firstVideo.setAttribute("autoplay", "");
        firstVideo.muted = true;
      }

      let firstVideoStarted = false;
      function tryStartFirstVideo() {
        if (firstVideo && !firstVideoStarted) {
          firstVideo.currentTime = 0;
          firstVideo.muted = true;
          firstVideo
            .play()
            .then(() => {
              firstVideoStarted = true;
              document.removeEventListener("click", tryStartFirstVideo);
              // Reset torVideo after 4 seconds
              if (torVideo) {
                setTimeout(() => {
                  torVideo.currentTime = 0;
                  torVideo.pause();
                }, 4000);
              }
            })
            .catch((err) => {
              console.warn("Safari заблокировал авто-проигрывание:", err);
            });
        }
      }
      if (!SAFARI) {
        document.addEventListener("click", tryStartFirstVideo, { once: false });
      }
    });

    console.log("Desktop (по ширине окна)");
  }
})();
