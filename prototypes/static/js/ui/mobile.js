let mobileMenuOpen = false;

export function initMobile() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const closeBtn = document.querySelector('.close-menu');
    
    if (!menuToggle || !mobileMenu) return;
    
    // Populate mobile menu with toolbar content
    populateMobileMenu();
    
    // Toggle menu
    menuToggle.addEventListener('click', () => {
        openMobileMenu();
    });
    
    // Close with close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileMenu);
    }
    
    // Close with overlay
    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOpen) {
            closeMobileMenu();
        }
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        if (mobileMenuOpen) {
            // Adjust menu height if needed
            adjustMobileMenuHeight();
        }
    });
}

function populateMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const toolbar = document.getElementById('toolbar');
    
    if (!mobileMenu || !toolbar) return;
    
    // Clone toolbar content (excluding sections we don't want)
    const toolbarContent = toolbar.cloneNode(true);
    
    // Remove properties panel sections that are better on right side
    const sections = toolbarContent.querySelectorAll('.tool-group');
    
    // Add to mobile menu
    mobileMenu.innerHTML = `
        <div class="mobile-menu-header">
            <span class="logo">HEXEL<span>STUDIO</span></span>
            <span class="close-menu">✕</span>
        </div>
        <div class="mobile-menu-content">
            ${toolbarContent.innerHTML}
        </div>
    `;
    
    // Re-attach close button event
    const newCloseBtn = mobileMenu.querySelector('.close-menu');
    if (newCloseBtn) {
        newCloseBtn.addEventListener('click', closeMobileMenu);
    }
    
    // Make tool buttons work in mobile menu
    mobileMenu.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Trigger tool change
            import('../tools/tool-manager.js').then(m => {
                m.setTool(btn.dataset.tool);
            });
            
            // Close menu on mobile after selection
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
}

export function openMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (!mobileMenu || !mobileOverlay) return;
    
    mobileMenu.classList.add('open');
    mobileOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    mobileMenuOpen = true;
}

export function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (!mobileMenu || !mobileOverlay) return;
    
    mobileMenu.classList.remove('open');
    mobileOverlay.style.display = 'none';
    document.body.style.overflow = '';
    mobileMenuOpen = false;
}

function adjustMobileMenuHeight() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenuOpen) {
        // Adjust for landscape orientation
        if (window.innerHeight < 400) {
            mobileMenu.style.maxHeight = `${window.innerHeight}px`;
            mobileMenu.style.overflowY = 'auto';
        } else {
            mobileMenu.style.maxHeight = '';
        }
    }
}

export function isMobileMenuOpen() {
    return mobileMenuOpen;
}
