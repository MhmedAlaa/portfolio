/**
 * Mohamed Alaa Saleh - Projects Archive Portal Controller (projects-page.js)
 * Handles: Live Dual Filtering (Status + Sector), Real-time Search,
 * Dynamic i18n Localization, Responsive Lightbox, and Resilient Data Fetching.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. State Management
  let currentLang = localStorage.getItem('portfolio_lang') || 'en';
  let allProjects = [];
  let activeStatus = 'all';
  let activeType = 'all';
  let searchQuery = '';

  // 2. DOM Elements
  const container = document.getElementById('all-projects-container');
  const searchInput = document.getElementById('projectSearchInput');
  const statusBtns = document.querySelectorAll('#statusFilterGroup .filter-btn');
  const sectorBtns = document.querySelectorAll('#sectorFilterGroup .filter-btn');
  const visibleCountEl = document.getElementById('visibleProjectsCount');
  const totalCountEl = document.getElementById('totalProjectsCount');
  const noResultsNotice = document.getElementById('noResultsNotice');
  const resetBtn = document.getElementById('resetFiltersBtn');
  const langToggleBtn = document.getElementById('langToggle');
  const langLabel = document.getElementById('langLabel');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');
  const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
  const mobileNavClose = document.getElementById('mobileNavClose');
  const backHomeArrow = document.getElementById('backHomeArrow');

  // Lightbox Elements
  const lightbox = document.getElementById('lightbox');
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  // Dynamic Year
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

  // 3. Fallback Data Loader (Protects offline/file:// usage)
  function getSafeFallback() {
    return [
      {
        name: "Midtown Sky Towers",
        type: "Residential",
        status: "completed",
        role: "Cost Estimation & Coordination",
        impact: "Budget: EGP 600M | Two 12-story residential towers (>10,000 m²). Performed comprehensive QTO, rate breakdown, and 10% quantity optimization via value engineering.",
        thumb: "assets/images/midtown_sky.jpg"
      },
      {
        name: "Misr Insurance Storage Facility",
        type: "Industrial Facility",
        status: "completed",
        role: "BIM Lead & Technical Office",
        impact: "Budget: EGP 472M | Multidisciplinary BIM coordination, Navisworks clash resolution, and RFI/submittals technical management with zero site clashes.",
        thumb: "assets/images/misr_insurance.jpg"
      },
      {
        name: "Cleopatra Hospital Expansion",
        type: "Medical Facility",
        status: "completed",
        role: "Technical Office & BIM",
        impact: "Budget: EGP 213M | High-precision architectural & structural LOD 350 modeling, BOQ audit, and complex MEP clash matrix resolution.",
        thumb: "assets/images/cleopatra_hospital.jpg"
      },
      {
        name: "Al-Namouthajiyah Residence - Block 3 Villas (مشروع النموذجية ريزدنس)",
        type: "Residential",
        status: "awarded",
        role: "Bidding & Cost Estimation Lead",
        impact: "Awarded Contract (2026) | Client: Rove Real Estate (شركة روف للتطوير والإستثمار العقاري) | Value: SAR 17.32M. Conducted comprehensive pricing analysis, rate breakdown, and direct/indirect cost estimation resulting in contract award.",
        thumb: "assets/images/new_giza.jpg"
      },
      {
        name: "Eastern Region Border Ports Handling (مناولة منافذ المنطقة الشرقية)",
        type: "Infrastructure",
        status: "awarded",
        role: "Senior Tendering & Cost Engineer",
        impact: "Awarded Contract (2026) | Client: ZATCA (هيئة الزكاة والضريبة والجمارك) | Value: SAR 10.84M. Covered Salwa, Khafji, and Raqai ports. Executed full operational cost modeling, equipment logistics pricing, and compliant bid submission.",
        thumb: "assets/images/ain_sokhna_port.jpg"
      },
      {
        name: "Imam Abdulrahman Bin Faisal University Hospital (مستشفى جامعة الإمام عبدالرحمن بن فيصل)",
        type: "Medical Facility",
        status: "expected",
        role: "Bidding & Cost Estimation Lead",
        impact: "Expected Win - Rank 1 (2026) | Client: Imam Abdulrahman Bin Faisal University (جامعة الإمام عبدالرحمن بن فيصل) | Offer: SAR 39.98M. Comprehensive hospital facility maintenance, family medicine centers, and infection-control sanitized premises.",
        thumb: "assets/images/cleopatra_hospital.jpg"
      }
    ];
  }

  // 4. Internationalization (i18n)
  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('portfolio_lang', lang);

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    if (langLabel) {
      langLabel.textContent = lang === 'ar' ? 'English' : 'عربي';
    }

    if (backHomeArrow) {
      backHomeArrow.className = lang === 'ar' ? 'fa fa-arrow-right' : 'fa fa-arrow-left';
    }

    // Static text translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
        el.innerHTML = translations[lang][key];
      }
    });

    // Input placeholder translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(input => {
      const key = input.getAttribute('data-i18n-placeholder');
      if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
        input.setAttribute('placeholder', translations[lang][key]);
      }
    });

    // Re-render projects with translated labels
    applyFilters();
  }

  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const targetLang = currentLang === 'en' ? 'ar' : 'en';
      setLanguage(targetLang);
    });
  }

  // 5. Mobile Navigation
  function openMobileNav() {
    if (!mobileNav || !mobileNavBackdrop) return;
    mobileNav.classList.add('active');
    mobileNavBackdrop.classList.add('active');
    mobileNav.setAttribute('aria-hidden', 'false');
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (!mobileNav || !mobileNavBackdrop) return;
    mobileNav.classList.remove('active');
    mobileNavBackdrop.classList.remove('active');
    mobileNav.setAttribute('aria-hidden', 'true');
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
  if (mobileNavClose) mobileNavClose.addEventListener('click', closeMobileNav);
  if (mobileNavBackdrop) mobileNavBackdrop.addEventListener('click', closeMobileNav);

  // 6. Accessible Lightbox
  function openLightbox(src, title) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = title || 'Preview';
    if (lightboxCaption) lightboxCaption.textContent = title || '';
    lightbox.style.display = 'flex';
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
    if (lightboxImg) lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxOverlay) lightboxOverlay.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightbox && lightbox.style.display === 'flex') closeLightbox();
      if (mobileNav && mobileNav.classList.contains('active')) closeMobileNav();
    }
  });

  // 7. Filtering & Search Engine
  function applyFilters() {
    if (!container) return;

    const roleLabel = (typeof translations !== 'undefined' && translations[currentLang]?.projectRoleLabel) || 'Role';
    const impactLabel = (typeof translations !== 'undefined' && translations[currentLang]?.projectImpactLabel) || 'Scope & Impact';
    const clientLabel = (typeof translations !== 'undefined' && translations[currentLang]?.clientLabel) || (currentLang === 'ar' ? 'الجهة المالكة' : 'Client');

    const q = searchQuery.toLowerCase().trim();

    const filtered = allProjects.filter(project => {
      // 1. Status Filter
      const pStatus = (project.status || 'other').toLowerCase();
      const matchStatus = (activeStatus === 'all') || (pStatus === activeStatus);

      // 2. Sector/Category Filter (checks English raw type)
      const rawType = (typeof project.type === 'object') ? (project.type.en || '').toLowerCase() : (project.type || '').toLowerCase();
      let matchType = false;
      if (activeType === 'all') {
        matchType = true;
      } else if (activeType === 'residential') {
        matchType = rawType.includes('residential') || rawType.includes('villas');
      } else if (activeType === 'medical') {
        matchType = rawType.includes('medical') || rawType.includes('hospital');
      } else if (activeType === 'infrastructure') {
        matchType = rawType.includes('infrastructure') || rawType.includes('ports') || rawType.includes('water');
      } else if (activeType === 'governmental') {
        matchType = rawType.includes('governmental');
      } else if (activeType === 'industrial') {
        matchType = rawType.includes('industrial') || rawType.includes('storage');
      } else {
        matchType = rawType.includes(activeType);
      }

      // 3. Search Query Filter (checks both languages)
      let matchSearch = true;
      if (q) {
        const arName = (typeof project.name === 'object') ? (project.name.ar || '') : '';
        const enName = (typeof project.name === 'object') ? (project.name.en || '') : (project.name || '');
        const arClient = (typeof project.client === 'object') ? (project.client.ar || '') : '';
        const enClient = (typeof project.client === 'object') ? (project.client.en || '') : '';
        const arImpact = (typeof project.impact === 'object') ? (project.impact.ar || '') : '';
        const enImpact = (typeof project.impact === 'object') ? (project.impact.en || '') : (project.impact || '');
        const fullText = `${arName} ${enName} ${arClient} ${enClient} ${arImpact} ${enImpact}`.toLowerCase();
        matchSearch = fullText.includes(q);
      }

      return matchStatus && matchType && matchSearch;
    });

    // Update Counters
    if (visibleCountEl) visibleCountEl.textContent = filtered.length;
    if (totalCountEl) totalCountEl.textContent = allProjects.length;

    // Show/Hide Reset Button
    if (resetBtn) {
      const isFiltered = (activeStatus !== 'all') || (activeType !== 'all') || (q.length > 0);
      resetBtn.style.display = isFiltered ? 'inline-flex' : 'none';
    }

    // Render Grid
    container.innerHTML = '';
    if (filtered.length === 0) {
      if (noResultsNotice) noResultsNotice.style.display = 'block';
    } else {
      if (noResultsNotice) noResultsNotice.style.display = 'none';

      filtered.forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';

        // Extract bilingual strings
        const pName = (typeof project.name === 'object') ? (project.name[currentLang] || project.name.en || '') : project.name;
        const pClient = (typeof project.client === 'object') ? (project.client[currentLang] || project.client.en || '') : (project.client || '');
        const pType = (typeof project.type === 'object') ? (project.type[currentLang] || project.type.en || '') : project.type;
        const pRole = (typeof project.role === 'object') ? (project.role[currentLang] || project.role.en || '') : project.role;
        const pImpact = (typeof project.impact === 'object') ? (project.impact[currentLang] || project.impact.en || '') : project.impact;

        const rawType = (typeof project.type === 'object') ? (project.type.en || '') : project.type;
        card.setAttribute('data-category', rawType);

        // Status badge color & text
        let statusTag = '';
        if (project.status === 'awarded') {
          statusTag = `<span class="badge-role" style="background: rgba(16, 185, 129, 0.12); color: #059669;"><i class="fa fa-award" style="margin-right: 4px;"></i>${currentLang === 'ar' ? 'مترسي' : 'Awarded'}</span>`;
        } else if (project.status === 'expected') {
          statusTag = `<span class="badge-role" style="background: rgba(245, 158, 11, 0.12); color: #d97706;"><i class="fa fa-crosshairs" style="margin-right: 4px;"></i>${currentLang === 'ar' ? 'متوقع الفوز' : 'Expected Win'}</span>`;
        } else if (project.status === 'completed') {
          statusTag = `<span class="badge-role" style="background: rgba(59, 130, 246, 0.12); color: #2563eb;"><i class="fa fa-check-circle" style="margin-right: 4px;"></i>${currentLang === 'ar' ? 'منجز' : 'Delivered'}</span>`;
        }

        const clientHtml = pClient ? `
          <p class="project-role-text" style="color: var(--accent-cyan); font-weight: 600; margin-bottom: 6px; font-size: 0.85rem;">
            <i class="fa fa-building" style="margin-right: 4px;"></i>
            <span>${clientLabel}:</span> ${pClient}
          </p>
        ` : '';

        card.innerHTML = `
          <div class="project-thumb-box" tabindex="0" role="button" aria-label="View enlarged image for ${pName}">
            <img src="${project.thumb}" alt="${pName}" class="project-thumb" loading="lazy" />
            <div class="project-zoom-overlay">
              <i class="fa fa-search-plus" aria-hidden="true"></i>
            </div>
          </div>
          <div class="project-body">
            <div class="project-tags">
              <span class="badge-type">${pType}</span>
              ${statusTag}
            </div>
            <h3 class="project-title" style="font-size: 1.15rem; margin-top: 4px;">${pName}</h3>
            ${clientHtml}
            <p class="project-role-text"><strong>${roleLabel}:</strong> ${pRole}</p>
            <p class="project-impact"><strong>${impactLabel}:</strong> ${pImpact}</p>
          </div>
        `;

        const thumbBox = card.querySelector('.project-thumb-box');
        thumbBox.addEventListener('click', () => openLightbox(project.thumb, project.name));
        thumbBox.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') openLightbox(project.thumb, project.name);
        });

        container.appendChild(card);
      });
    }
  }

  // 8. Filter Button Event Listeners
  statusBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.getAttribute('data-filter-status') || 'all';
      applyFilters();
    });
  });

  sectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.getAttribute('data-filter-type') || 'all';
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value || '';
      applyFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeStatus = 'all';
      activeType = 'all';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      statusBtns.forEach((b, i) => b.classList.toggle('active', i === 0));
      sectorBtns.forEach((b, i) => b.classList.toggle('active', i === 0));
      applyFilters();
    });
  }

  // 9. Fetch Data
  fetch('data/projects.json')
    .then(res => {
      if (!res.ok) throw new Error('Network error');
      return res.json();
    })
    .then(data => {
      allProjects = data;
      setLanguage(currentLang);
    })
    .catch(err => {
      console.warn('Loading fallback projects:', err);
      allProjects = getSafeFallback();
      setLanguage(currentLang);
    });
});
