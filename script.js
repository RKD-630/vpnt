pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // State
        let books = [];
        let currentBook = null;
        let currentPage = 1;
        let pdfDoc = null;
        let scale = 1.5;
        let isDarkMode = false;
        let isZoomed = false;
        let twoPageMode = true; // Two-page view enabled by default

        // Handle file imports
        async function handleFiles(files) {
            const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf' || file.name.endsWith('.pdf'));
            
            if (pdfFiles.length === 0) {
                alert('No PDF files found!');
                return;
            }

            const btn = document.querySelector('.import-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<div class="loading-spinner w-5 h-5 border-2"></div>';
            
            for (let file of pdfFiles) {
                await addBook(file);
            }
            
            btn.innerHTML = originalText;
            updateLibrary();
        }

        async function addBook(file) {
            const book = {
                id: Date.now() + Math.random(),
                file: file,
                name: file.name.replace('.pdf', ''),
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                cover: null
            };

            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);
                
                const canvas = document.createElement('canvas');
                const viewport = page.getViewport({ scale: 0.3 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                const context = canvas.getContext('2d');
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                book.cover = canvas.toDataURL();
                book.totalPages = pdf.numPages;
            } catch (error) {
                console.error('Error generating cover:', error);
                book.cover = null;
            }

            books.push(book);
        }

        function updateLibrary() {
            const grid = document.getElementById('booksGrid');
            const emptyState = document.getElementById('emptyState');
            
            if (books.length === 0) {
                grid.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }
            
            emptyState.classList.add('hidden');
            grid.innerHTML = books.map((book, index) => `
                <div class="book-card fade-in" style="animation-delay: ${index * 0.1}s">
                    <div class="glass-panel rounded-xl overflow-hidden cursor-pointer group" onclick="openBook(${book.id})">
                        <div class="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            ${book.cover ? 
                                `<img src="${book.cover}" alt="${book.name}" class="w-full h-full object-cover">` :
                                `<div class="w-full h-full flex items-center justify-center">
                                    <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                </div>`
                            }
                            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div class="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                <p class="text-xs font-medium">Click to read</p>
                            </div>
                            <div class="book-spine absolute left-0 top-0 bottom-0 w-4"></div>
                        </div>
                        <div class="p-3">
                            <h3 class="font-semibold text-sm truncate mb-1" title="${book.name}">${book.name}</h3>
                            <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                <span>${book.totalPages || '?'} pages</span>
                                <span>${book.size}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        async function openBook(bookId) {
            const book = books.find(b => b.id === bookId);
            if (!book) return;

            currentBook = book;
            currentPage = 1;
            scale = 1.5;
            isZoomed = false;

            const arrayBuffer = await book.file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            document.getElementById('readerTitle').textContent = book.name;
            document.getElementById('libraryView').classList.add('hidden');
            document.getElementById('readerView').classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            updateScrollControls();
            updateViewModeUI();
            await renderPage();
        }

        function closeReader() {
            document.getElementById('readerView').classList.add('hidden');
            document.getElementById('libraryView').classList.remove('hidden');
            document.body.style.overflow = '';
            pdfDoc = null;
            currentBook = null;
            isZoomed = false;
            updateScrollControls();
        }

        // Render both pages (or single page)
        async function renderPage() {
            if (!pdfDoc) return;

            const canvasLeft = document.getElementById('pdfCanvasLeft');
            const canvasRight = document.getElementById('pdfCanvasRight');
            const wrapperLeft = document.getElementById('pageWrapperLeft');
            const wrapperRight = document.getElementById('pageWrapperRight');
            const binding = document.getElementById('bookBinding');
            const container = document.getElementById('pagesContainer');

            // Calculate scale based on mode
            // In two-page mode, each page needs to be smaller to fit both
            let effectiveScale = scale;
            if (twoPageMode) {
                effectiveScale = scale * 0.85; // Slightly smaller for two-page fit
            }

            if (twoPageMode) {
                // Two-page mode
                container.classList.remove('single-page');
                wrapperLeft.classList.remove('hidden-page');
                wrapperRight.classList.remove('hidden-page');
                binding.classList.remove('hidden');

                // Render left page
                await renderSinglePage(canvasLeft, currentPage, effectiveScale);

                // Render right page (next page)
                const rightPageNum = currentPage + 1;
                if (rightPageNum <= pdfDoc.numPages) {
                    await renderSinglePage(canvasRight, rightPageNum, effectiveScale);
                    wrapperRight.classList.remove('hidden-page');
                } else {
                    // No right page - hide it
                    wrapperRight.classList.add('hidden-page');
                }

                // Update indicator
                if (rightPageNum <= pdfDoc.numPages) {
                    document.getElementById('pageIndicator').textContent = 
                        `Pages ${currentPage}-${rightPageNum} of ${pdfDoc.numPages}`;
                } else {
                    document.getElementById('pageIndicator').textContent = 
                        `Page ${currentPage} of ${pdfDoc.numPages}`;
                }
            } else {
                // Single-page mode
                container.classList.add('single-page');
                wrapperLeft.classList.remove('hidden-page');
                wrapperRight.classList.add('hidden-page');
                binding.classList.add('hidden');

                await renderSinglePage(canvasLeft, currentPage, effectiveScale);

                document.getElementById('pageIndicator').textContent = 
                    `Page ${currentPage} of ${pdfDoc.numPages}`;
            }

            // Reset scroll position
            document.getElementById('pdfContainer').scrollTop = 0;
            document.getElementById('pdfContainer').scrollLeft = 0;
            
            // Adjust magnifier dimensions immediately after page resize
            if (typeof updateMagnifier === 'function') {
                updateMagnifier();
            }
        }

        // Render a single page to a canvas
        async function renderSinglePage(canvas, pageNum, renderScale) {
            const page = await pdfDoc.getPage(pageNum);
            const ctx = canvas.getContext('2d');
            
            // Limit devicePixelRatio to prevent extremely large canvases on high-DPI displays
            // This massively improves performance for "heavy" PDFs.
            const maxDPR = Math.min(window.devicePixelRatio || 1, 2);
            let effectiveScale = renderScale * maxDPR;
            
            // Cap total scale to avoid canvas dimension limits and massive memory usage
            if (effectiveScale > 4) effectiveScale = 4;
            
            const viewport = page.getViewport({ scale: effectiveScale });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            // Scale the canvas down using CSS to maintain the intended visual size
            canvas.style.width = `${viewport.width / maxDPR}px`;
            canvas.style.height = `${viewport.height / maxDPR}px`;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
        }

        // Navigation
        function nextPage() {
            const step = twoPageMode ? 2 : 1;
            if (currentPage + step - 1 < pdfDoc.numPages) {
                currentPage += step;
                renderPage();
            } else if (twoPageMode && currentPage < pdfDoc.numPages) {
                // Show last page alone if odd number
                currentPage = pdfDoc.numPages;
                renderPage();
            }
        }

        function previousPage() {
            const step = twoPageMode ? 2 : 1;
            if (currentPage > 1) {
                currentPage = Math.max(1, currentPage - step);
                renderPage();
            }
        }

        // View mode toggle
        function toggleViewMode() {
            twoPageMode = !twoPageMode;
            updateViewModeUI();
            
            // Reset to first page when switching modes
            currentPage = 1;
            renderPage();
            
            if (typeof updateMagControllerUI === 'function') updateMagControllerUI();
        }

        function updateViewModeUI() {
            const btn = document.getElementById('viewModeBtn');
            const icon = document.getElementById('viewModeIcon');
            
            if (twoPageMode) {
                btn.classList.add('active-mode');
                // Two-page icon
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>';
            } else {
                btn.classList.remove('active-mode');
                // Single-page icon
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>';
            }
        }

        // Zoom
        function zoomIn() {
            if (typeof isMagnifierMode !== 'undefined' && isMagnifierMode) {
                ZOOM_FACTOR = Math.min(ZOOM_FACTOR + 0.2, 3.0); // Max zoom 3x
                if (typeof updateMagnifier === 'function') updateMagnifier();
                return;
            }
            scale = Math.min(scale + 0.25, 4);
            isZoomed = scale > 1.5;
            updateScrollControls();
            renderPage();
        }

        function zoomOut() {
            if (typeof isMagnifierMode !== 'undefined' && isMagnifierMode) {
                ZOOM_FACTOR = Math.max(ZOOM_FACTOR - 0.2, 1.0); // Min zoom 1x
                if (typeof updateMagnifier === 'function') updateMagnifier();
                return;
            }
            scale = Math.max(scale - 0.25, 0.5);
            isZoomed = scale > 1.5;
            updateScrollControls();
            renderPage();
        }

        function updateScrollControls() {
            // Deprecated: Scroll controls are now always visible on the right center edge
        }

        // Auto-scroll logic removed as requested

        function scrollUp() {
            const container = document.getElementById('pdfContainer');
            
            if (container.scrollTop > 0) {
                // Scroll up by 80% of the visible height
                container.scrollBy({ top: -(container.clientHeight * 0.8), behavior: 'smooth' });
            } else if (currentPage > 1) {
                previousPage();
            }
        }

        function scrollDown() {
            const container = document.getElementById('pdfContainer');
            const maxScroll = container.scrollHeight - container.clientHeight;
            
            if (container.scrollTop < maxScroll - 10) {
                // Scroll down by 80% of the visible height
                container.scrollBy({ top: container.clientHeight * 0.8, behavior: 'smooth' });
            } else {
                const stepAmount = twoPageMode ? 2 : 1;
                if (currentPage + stepAmount - 1 < pdfDoc.numPages) {
                    nextPage();
                }
            }
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('readerView').classList.contains('hidden')) return;
            
            if (e.key === 'ArrowRight' || e.key === ' ') nextPage();
            if (e.key === 'ArrowLeft') previousPage();
            if (e.key === 'ArrowUp') scrollUp();
            if (e.key === 'ArrowDown') scrollDown();
            if (e.key === 'Escape') closeReader();
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
            if (e.key === 'v' || e.key === 'V') toggleViewMode();
        });

        // Touch/Swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        document.getElementById('pdfContainer').addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, {passive: true});

        document.getElementById('pdfContainer').addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, {passive: true});

        function handleSwipe() {
            const swipeThreshold = 50;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            
            if (!isZoomed && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
                if (diffX > 0) {
                    nextPage();
                } else {
                    previousPage();
                }
            }
        }

        function toggleDarkMode() {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode');
        }

        function toggleFullScreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }

        let isDraggingToolbar = false;
        let toolbarStartX = 0;
        let toolbarScrollLeft = 0;

        function startToolbarDrag(e) {
            isDraggingToolbar = true;
            const toolbar = document.getElementById('headerToolbar');
            toolbarStartX = e.pageX - toolbar.offsetLeft;
            toolbarScrollLeft = toolbar.scrollLeft;
        }

        function stopToolbarDrag() {
            isDraggingToolbar = false;
        }

        function toolbarDragMove(e) {
            if (!isDraggingToolbar) return;
            e.preventDefault(); 
            const toolbar = document.getElementById('headerToolbar');
            const x = e.pageX - toolbar.offsetLeft;
            const walk = (x - toolbarStartX) * 1.5; 
            toolbar.scrollLeft = toolbarScrollLeft - walk;
        }

        let pdfBgMode = 0; // 0: White, 1: Black, 2: Dim
        function togglePdfBackground() {
            pdfBgMode = (pdfBgMode + 1) % 3;
            const rv = document.getElementById('readerView');
            rv.classList.remove('bg-mode-white', 'bg-mode-black', 'bg-mode-dim');
            
            const btn = document.getElementById('pdfBgBtn');
            btn.classList.remove('active-mode');

            if (pdfBgMode === 0) {
                rv.classList.add('bg-mode-white');
            } else if (pdfBgMode === 1) {
                rv.classList.add('bg-mode-black');
                btn.classList.add('active-mode');
            } else {
                rv.classList.add('bg-mode-dim');
                btn.classList.add('active-mode');
            }
        }

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Magnifier Logic
        let isMagnifierMode = false;
        let isDraggingMag = false;
        let magDragOffsetX = 0;
        let magDragOffsetY = 0;
        
        let magMoveInterval = null;
        let magMoveLastTime = 0;
        let magMoveDx = 0;
        let magMoveDy = 0;

        function magMoveLoop(time) {
            if (!isMagnifierMode || !magMoveInterval) return;
            
            if (!magMoveLastTime) magMoveLastTime = time;
            const deltaTime = time - magMoveLastTime;
            magMoveLastTime = time;
            
            // Limit delta time to prevent huge jumps if tab was inactive
            const safeDelta = Math.min(deltaTime, 32); 
            
            lastMouseX += magMoveDx * (safeDelta / 16);
            lastMouseY += magMoveDy * (safeDelta / 16);
            
            if (lastMouseX < 0) lastMouseX = 0;
            if (lastMouseX > window.innerWidth) lastMouseX = window.innerWidth;
            if (lastMouseY < 0) lastMouseY = 0;
            if (lastMouseY > window.innerHeight) lastMouseY = window.innerHeight;
            
            scheduleMagnifierUpdate();
            
            if (magMoveInterval) {
                magMoveInterval = requestAnimationFrame(magMoveLoop);
            }
        }
        
        function startMagMove(dx, dy) {
            if (!isMagnifierMode) return;

            magMoveDx = dx;
            magMoveDy = dy;

            if (!magMoveInterval) {
                magMoveLastTime = 0;
                magMoveInterval = requestAnimationFrame(magMoveLoop);
            }
        }

        function stopMagMove() {
            if (magMoveInterval) {
                cancelAnimationFrame(magMoveInterval);
                magMoveInterval = null;
            }
        }
        
        function updateMagControllerUI() {
            const magController = document.getElementById('magController');
            const isTabOpen = (typeof currentMobileTab !== 'undefined' && currentMobileTab !== null);
            
            if (!isMagnifierMode || isTabOpen) {
                magController.classList.remove('active');
                return;
            }
            magController.classList.add('active');
            
            const leftBtn = document.querySelector('.mag-left');
            const rightBtn = document.querySelector('.mag-right');
            
            // Always keep buttons active
            leftBtn.style.opacity = '1';
            leftBtn.style.pointerEvents = 'auto';
            rightBtn.style.opacity = '1';
            rightBtn.style.pointerEvents = 'auto';
        }
        
        function toggleMagnifierMode() {
            isMagnifierMode = !isMagnifierMode;
            const magGlass = document.getElementById('magnifierGlass');
            
            document.querySelectorAll('.magnifier-toggle-btn, #magnifierModeBtn').forEach(btn => {
                if (isMagnifierMode) {
                    btn.classList.add('active-mode', 'ring-4', 'ring-indigo-300', 'dark:ring-indigo-800');
                } else {
                    btn.classList.remove('active-mode', 'ring-4', 'ring-indigo-300', 'dark:ring-indigo-800');
                }
            });

            if (isMagnifierMode) {
                
                // Immediately fix the magnifier over the visible part of the PDF page
                const visibleCanvas = Array.from(document.querySelectorAll('.pdf-canvas')).find(c => {
                    const rect = c.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                });
                
                if (visibleCanvas) {
                    const rect = visibleCanvas.getBoundingClientRect();
                    lastMouseX = rect.left + (rect.width / 2);
                    lastMouseY = Math.max(rect.top + 100, window.innerHeight / 3);
                } else {
                    lastMouseX = window.innerWidth / 2;
                    lastMouseY = window.innerHeight / 3;
                }
                
                scheduleMagnifierUpdate();
            } else {
                magGlass.style.display = 'none';
                if (typeof stopAutoScanner === 'function' && typeof isAutoScanning !== 'undefined' && isAutoScanning) {
                    stopAutoScanner();
                }
            }
            updateMagControllerUI();
        }

        const pdfContainer = document.getElementById('pdfContainer');
        const magGlass = document.getElementById('magnifierGlass');
        const magCanvas = document.getElementById('magnifierCanvas');
        const magCtx = magCanvas.getContext('2d');
        const MAGNIFIER_SIZE = 180;
        let ZOOM_FACTOR = 1.2; // 20% larger initially, adjustable

        let lastMouseX = 0;
        let lastMouseY = 0;
        let magAnimationFrame = null;

        function scheduleMagnifierUpdate() {
            if (magAnimationFrame) cancelAnimationFrame(magAnimationFrame);
            magAnimationFrame = requestAnimationFrame(() => {
                updateMagnifier();
                magAnimationFrame = null;
            });
        }

        function updateMagnifier() {
            if (!isMagnifierMode) {
                magGlass.style.display = 'none';
                return;
            }
            
            let targetCanvas;
            if (!twoPageMode) {
                // Relaxed hit-testing for Single Page so the ruler can scan freely from header to bottom
                targetCanvas = Array.from(document.querySelectorAll('.pdf-canvas')).find(canvas => {
                    const cRect = canvas.getBoundingClientRect();
                    return cRect.width > 0 && cRect.height > 0;
                });
            } else {
                targetCanvas = Array.from(document.querySelectorAll('.pdf-canvas')).find(canvas => {
                    const cRect = canvas.getBoundingClientRect();
                    return cRect.width > 0 && cRect.height > 0 &&
                           lastMouseX >= cRect.left && lastMouseX <= cRect.right &&
                           lastMouseY >= cRect.top && lastMouseY <= cRect.bottom;
                });
            }

            if (!targetCanvas) {
                if (twoPageMode) {
                    magGlass.style.display = 'block';
                    magGlass.className = 'magnifier-glass';
                    magCanvas.width = MAGNIFIER_SIZE;
                    magCanvas.height = MAGNIFIER_SIZE;
                    magGlass.style.width = MAGNIFIER_SIZE + 'px';
                    magGlass.style.height = MAGNIFIER_SIZE + 'px';
                    magGlass.style.left = lastMouseX + 'px';
                    magGlass.style.top = lastMouseY + 'px';
                    magCtx.fillStyle = 'white';
                    magCtx.fillRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
                }
                return;
            }
            
            magGlass.style.display = 'block';
            const cRect = targetCanvas.getBoundingClientRect();
            
            let clampedY = lastMouseY;
            let clampedX = lastMouseX;
            if (!twoPageMode) {
                if (clampedY < cRect.top) clampedY = cRect.top;
                if (clampedY > cRect.bottom) clampedY = cRect.bottom;
                if (clampedX < cRect.left) clampedX = cRect.left;
                if (clampedX > cRect.right) clampedX = cRect.right;
            }
            
            const scaleX = targetCanvas.width / cRect.width;
            const scaleY = targetCanvas.height / cRect.height;
            const canvasX = clampedX - cRect.left;
            const canvasY = clampedY - cRect.top;

            // Safe draw helper to prevent IndexSizeError on some browsers
            function safeDraw(ctx, img, sx, sy, sW, sH, dx, dy, dW, dH) {
                if (sW <= 0 || sH <= 0 || dW <= 0 || dH <= 0) return;
                const clampLeft = Math.max(0, -sx);
                const clampTop = Math.max(0, -sy);
                const clampRight = Math.max(0, (sx + sW) - img.width);
                const clampBottom = Math.max(0, (sy + sH) - img.height);
                if (clampLeft >= sW || clampTop >= sH) return;
                const adjSx = sx + clampLeft;
                const adjSy = sy + clampTop;
                const adjSW = sW - clampLeft - clampRight;
                const adjSH = sH - clampTop - clampBottom;
                const scaleDX = dW / sW;
                const scaleDY = dH / sH;
                const adjDx = dx + (clampLeft * scaleDX);
                const adjDy = dy + (clampTop * scaleDY);
                const adjDW = dW - ((clampLeft + clampRight) * scaleDX);
                const adjDH = dH - ((clampTop + clampBottom) * scaleDY);
                if (adjSW > 0 && adjSH > 0 && adjDW > 0 && adjDH > 0) {
                    ctx.drawImage(img, adjSx, adjSy, adjSW, adjSH, adjDx, adjDy, adjDW, adjDH);
                }
            }

            if (!twoPageMode) {
                // Rectangular Magnifier for Single Page
                magGlass.className = 'magnifier-rect';
                
                const isLandscape = window.innerWidth > window.innerHeight;
                const magHeight = Math.round(window.innerHeight * (isLandscape ? 0.35 : 0.15)); // 35% in landscape, 15% in portrait
                const magWidth = cRect.width; // Keep magnifier width same as page width
                
                magCanvas.width = magWidth;
                magCanvas.height = magHeight;
                magGlass.style.width = magWidth + 'px';
                magGlass.style.height = magHeight + 'px';
                
                // Position horizontally fixed to canvas, vertically clamped
                magGlass.style.left = cRect.left + 'px';
                magGlass.style.top = clampedY + 'px';
                
                magCtx.fillStyle = 'white';
                magCtx.fillRect(0, 0, magWidth, magHeight);
                
                let panFactor = canvasX / cRect.width;
                if (isNaN(panFactor)) panFactor = 0.5;
                if (panFactor < 0) panFactor = 0;
                if (panFactor > 1) panFactor = 1;
                
                const sWidth = (magWidth / ZOOM_FACTOR) * scaleX;
                const sHeight = (magHeight / ZOOM_FACTOR) * scaleY;
                
                const sx = (targetCanvas.width - sWidth) * panFactor;
                const sy = canvasY * scaleY;
                const startY = sy - (sHeight / 2);
                
                safeDraw(magCtx, targetCanvas, sx, startY, sWidth, sHeight, 0, 0, magWidth, magHeight);
            } else {
                // Circular Magnifier for Two Page Mode
                magGlass.className = 'magnifier-glass';
                
                magCanvas.width = MAGNIFIER_SIZE;
                magCanvas.height = MAGNIFIER_SIZE;
                magGlass.style.width = MAGNIFIER_SIZE + 'px';
                magGlass.style.height = MAGNIFIER_SIZE + 'px';
                
                magGlass.style.left = lastMouseX + 'px';
                magGlass.style.top = lastMouseY + 'px';
                
                magCtx.fillStyle = 'white';
                magCtx.fillRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
                
                const sx = canvasX * scaleX;
                const sy = canvasY * scaleY;
                const sWidth = (MAGNIFIER_SIZE / ZOOM_FACTOR) * scaleX;
                const sHeight = (MAGNIFIER_SIZE / ZOOM_FACTOR) * scaleY;
                const startX = sx - (sWidth / 2);
                const startY = sy - (sHeight / 2);
                
                safeDraw(magCtx, targetCanvas, startX, startY, sWidth, sHeight, 0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE);
            }
        }

        const magHandle = document.getElementById('magnifierHandle');

        function handleMagDragStart(e, isHandle) {
            if (!isMagnifierMode) return;
            
            if (isHandle && twoPageMode) {
                isDraggingMag = true;
                const magGlass = document.getElementById('magnifierGlass');
                magDragOffsetX = e.clientX - parseFloat(magGlass.style.left || 0);
                magDragOffsetY = e.clientY - parseFloat(magGlass.style.top || 0);
            } else if (!isHandle && !twoPageMode) {
                isDraggingMag = true;
            }
        }

        magHandle.addEventListener('mousedown', (e) => {
            handleMagDragStart(e, true);
            if (isMagnifierMode && twoPageMode) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        magHandle.addEventListener('touchstart', (e) => {
            handleMagDragStart(e.touches[0], true);
            if (isMagnifierMode && twoPageMode) e.preventDefault();
        }, { passive: false });

        magGlass.addEventListener('mousedown', (e) => {
            handleMagDragStart(e, false);
            if (isMagnifierMode && !twoPageMode) e.preventDefault();
        });
        magGlass.addEventListener('touchstart', (e) => {
            handleMagDragStart(e.touches[0], false);
            if (isMagnifierMode && !twoPageMode) e.preventDefault();
        }, { passive: false });

        window.addEventListener('mouseup', () => isDraggingMag = false);
        window.addEventListener('touchend', () => isDraggingMag = false);

        function handleMagDragMove(e) {
            if (isMagnifierMode && isDraggingMag) {
                if (twoPageMode) {
                    lastMouseX = e.clientX - magDragOffsetX;
                    lastMouseY = e.clientY - magDragOffsetY;
                    scheduleMagnifierUpdate();
                } else {
                    lastMouseX = e.clientX;
                    lastMouseY = e.clientY;
                    scheduleMagnifierUpdate();
                }
            }
        }

        window.addEventListener('mousemove', (e) => handleMagDragMove(e));
        window.addEventListener('touchmove', (e) => {
            if (isDraggingMag) {
                handleMagDragMove(e.touches[0]);
                e.preventDefault(); // Prevent page scrolling while dragging
            }
        }, { passive: false });

        pdfContainer.addEventListener('scroll', () => {
            if (isMagnifierMode) scheduleMagnifierUpdate();
        });

        window.addEventListener('resize', () => {
            if (isMagnifierMode) scheduleMagnifierUpdate();
        });

        // Mouseleave hiding removed to keep magnifier fixed on page

        // Mobile Nav Functions
        let currentMobileTab = null;
        function toggleMobileTab(tabId) {
            const panel = document.getElementById('mobileTabsPanel');
            const contents = document.querySelectorAll('.mobile-tab-content');
            
            if (currentMobileTab === tabId) {
                // Close tab
                panel.classList.add('translate-y-full');
                currentMobileTab = null;
            } else {
                // Open new tab
                contents.forEach(c => {
                    c.classList.remove('flex');
                    c.classList.add('hidden');
                });
                const activeTab = document.getElementById('tab-' + tabId);
                activeTab.classList.remove('hidden');
                activeTab.classList.add('flex');
                panel.classList.remove('translate-y-full');
                currentMobileTab = tabId;
            }
            
            // Re-evaluate controller visibility after tab state changes
            if (typeof updateMagControllerUI === 'function') {
                updateMagControllerUI();
            }
        }

        let activeEnhanceMode = 'all';
        let enhanceValues = {
            all: 50,
            contrast: 50,
            brightness: 50,
            sharpness: 50,
            darkness: 50,
            hue: 50
        };

        function setEnhanceMode(mode) {
            activeEnhanceMode = mode;
            
            // Update buttons UI
            document.querySelectorAll('.enhance-btn').forEach(btn => {
                btn.classList.remove('active-enhance', 'bg-indigo-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
            });
            const activeBtn = document.getElementById('btn-enhance-' + mode);
            if (activeBtn) {
                activeBtn.classList.remove('bg-gray-200', 'text-gray-700', 'dark:bg-gray-700', 'dark:text-gray-300');
                activeBtn.classList.add('active-enhance', 'bg-indigo-600', 'text-white');
            }

            // Update slider value
            const slider = document.getElementById('enhanceSlider');
            if (slider) {
                slider.value = enhanceValues[mode];
            }
            const display = document.getElementById('enhanceValueDisplay');
            if (display) {
                display.textContent = enhanceValues[mode];
            }
        }

        function applyPdfEnhancement(val) {
            enhanceValues[activeEnhanceMode] = parseInt(val);
            const display = document.getElementById('enhanceValueDisplay');
            if (display) display.textContent = val;
            updatePdfEnhancement();
        }

        function updatePdfEnhancement() {
            let contrast = 1;
            let brightness = 1;
            let saturate = 1;
            let hue = 0;
            let sepia = 0;

            // Apply 'all' first as a base
            const allVal = enhanceValues['all'];
            if (allVal < 50) {
                const factor = allVal / 50; 
                brightness *= 0.4 + (0.6 * factor); 
                contrast *= 0.8 + (0.2 * factor); 
                saturate *= 0.5 + (0.5 * factor); 
            } else {
                const factor = (allVal - 50) / 50; 
                brightness *= 1 + (0.2 * factor); 
                contrast *= 1 + (0.6 * factor); 
                saturate *= 1 + (0.5 * factor); 
            }

            // Apply individual adjustments
            const cVal = enhanceValues['contrast'];
            if (cVal !== 50) {
                contrast *= (cVal < 50) ? (0.5 + (cVal/100)) : (1 + ((cVal-50)/50));
            }

            const bVal = enhanceValues['brightness'];
            if (bVal !== 50) {
                brightness *= (bVal < 50) ? (0.2 + 0.8*(bVal/50)) : (1 + ((bVal-50)/50));
            }

            const sVal = enhanceValues['sharpness'];
            if (sVal !== 50) {
                contrast *= (sVal < 50) ? (0.8 + 0.2*(sVal/50)) : (1 + 0.8*((sVal-50)/50));
                saturate *= (sVal < 50) ? (0.8 + 0.2*(sVal/50)) : (1 + 0.5*((sVal-50)/50));
            }

            const dVal = enhanceValues['darkness'];
            if (dVal !== 50) {
                brightness *= (dVal > 50) ? (1 - 0.8*((dVal-50)/50)) : (1 + ((50-dVal)/50));
            }

            const hVal = enhanceValues['hue'];
            if (hVal !== 50) {
                hue = ((hVal - 50) / 50) * 180;
                // Add a sepia base so hue rotation works on black & white PDFs
                sepia = Math.abs(hVal - 50) / 50; 
            }

            document.documentElement.style.setProperty('--pdf-enhance-contrast', contrast);
            document.documentElement.style.setProperty('--pdf-enhance-brightness', brightness);
            document.documentElement.style.setProperty('--pdf-enhance-saturate', saturate);
            document.documentElement.style.setProperty('--pdf-enhance-hue', `${hue}deg`);
            document.documentElement.style.setProperty('--pdf-enhance-sepia', sepia);
        }

        let zoomTimeout = null;
        function applyMobileZoom(val) {
            const newScale = (val / 100) * 1.5;
            const container = document.getElementById('pagesContainer');
            
            // Immediate CSS visual feedback for smooth UI response
            const ratio = newScale / scale;
            container.style.transform = `scale(${ratio})`;
            container.style.transformOrigin = 'top center';
            
            if (isMagnifierMode) scheduleMagnifierUpdate();
            
            // Debounce actual PDF re-rendering to prevent lag
            if (zoomTimeout) clearTimeout(zoomTimeout);
            zoomTimeout = setTimeout(() => {
                scale = newScale;
                isZoomed = scale > 1.5;
                container.style.transform = ''; 
                renderPage();
            }, 300);
        }

        function applyMobileScrollY(val) {
            const container = document.getElementById('pdfContainer');
            const maxScroll = container.scrollHeight - container.clientHeight;
            container.scrollTop = (val / 100) * maxScroll;
        }

        function applyMobileScrollX(val) {
            const container = document.getElementById('pdfContainer');
            const maxScroll = container.scrollWidth - container.clientWidth;
            container.scrollLeft = (val / 100) * maxScroll;
        }

        let autoScanInterval = null;
        let isAutoScanning = false;
        
        function toggleAutoScanner() {
            if (isAutoScanning) {
                stopAutoScanner();
            } else {
                startAutoScanner();
            }
        }
        
        function startAutoScanner() {
            if (twoPageMode) {
                toggleViewMode(); // Single page mode for rectangular magnifier
            }
            if (!isMagnifierMode) {
                toggleMagnifierMode();
            }
            
            isAutoScanning = true;
            const btn = document.getElementById('autoScanBtn');
            if (btn) btn.classList.add('bg-orange-600', 'text-white');
            
            const container = document.getElementById('pdfContainer');
            const targetCanvas = Array.from(document.querySelectorAll('.pdf-canvas')).find(c => {
                const rect = c.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });
            
            if (targetCanvas) {
                const rect = targetCanvas.getBoundingClientRect();
                lastMouseX = rect.left + (rect.width / 2);
                lastMouseY = Math.max(rect.top, 0) + (window.innerHeight * 0.1); 
            }
        
            let lastTime = performance.now();
            
            function scanLoop(time) {
                if (!isAutoScanning) return;
                
                const delta = time - lastTime;
                lastTime = time;
                
                // Move at ~60px per second
                const moveAmount = (60 * delta) / 1000; 
                const thresholdY = window.innerHeight * 0.8;
                
                if (lastMouseY < thresholdY) {
                    lastMouseY += moveAmount;
                } else {
                    // Scroll the container
                    container.scrollTop += moveAmount;
                    
                    // Check if we reached the bottom of the page
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    if (container.scrollTop >= maxScroll - 5) {
                        // We reached the bottom of this page. Go to next page!
                        if (currentPage < pdfDoc.numPages) {
                            nextPage();
                            container.scrollTop = 0;
                            lastMouseY = window.innerHeight * 0.1; // reset to top
                        } else {
                            // Reached end of document
                            stopAutoScanner();
                            return;
                        }
                    }
                }
                
                scheduleMagnifierUpdate();
                autoScanInterval = requestAnimationFrame(scanLoop);
            }
            
            autoScanInterval = requestAnimationFrame(scanLoop);
        }
        
        function stopAutoScanner() {
            isAutoScanning = false;
            const btn = document.getElementById('autoScanBtn');
            if (btn) btn.classList.remove('bg-orange-600', 'text-white');
            
            if (autoScanInterval) {
                cancelAnimationFrame(autoScanInterval);
                autoScanInterval = null;
            }
            if (isMagnifierMode) {
                toggleMagnifierMode();
            }
        }
        
        let pageViewPercent = 100;
        function togglePageScale() {
            if (pageViewPercent === 100) {
                pageViewPercent = 80;
            } else if (pageViewPercent === 80) {
                pageViewPercent = 75;
            } else {
                pageViewPercent = 100;
            }
            
            scale = 1.5 * (pageViewPercent / 100);
            isZoomed = scale > 1.5;
            
            const btn = document.getElementById('pageScaleBtn');
            if (btn) btn.textContent = pageViewPercent + '%';
            
            renderPage();
        }

        async function printAllPages() {
            if (!pdfDoc) return;
            
            const btn = document.querySelector('button[title="Print All Pages"]');
            const originalIcon = btn ? btn.innerHTML : '';
            if (btn) {
                // Show a loading spinner so the user knows it's working
                btn.innerHTML = `<svg class="animate-spin w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
                btn.style.pointerEvents = 'none';
            }
            
            try {
                // We'll create a print container
                let printContainer = document.getElementById('pdf-print-container');
                if (!printContainer) {
                    printContainer = document.createElement('div');
                    printContainer.id = 'pdf-print-container';
                    printContainer.style.display = 'none'; // Hidden by default, shown via @media print
                    document.body.appendChild(printContainer);
                }
                printContainer.innerHTML = '';
                
                const printScale = 1.5; 
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                for (let i = 1; i <= pdfDoc.numPages; i++) {
                    const page = await pdfDoc.getPage(i);
                    const viewport = page.getViewport({ scale: printScale });
                    
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                    
                    ctx.fillStyle = 'black';
                    // Decreased text size by ~20% (32px to 25px)
                    ctx.font = 'bold 25px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // Placed 5% up from the bottom
                    ctx.fillText(`pg. (${i})`, canvas.width / 2, canvas.height * 0.95);
                    
                    const img = document.createElement('img');
                    img.src = canvas.toDataURL('image/jpeg', 0.85);
                    
                    printContainer.appendChild(img);
                    
                    page.cleanup();
                }
                
                // Allow DOM to update before triggering print
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Print the page using the native print dialog
                window.print();
                
                // Cleanup after a delay to ensure print dialog caught the images
                setTimeout(() => {
                    if (printContainer) printContainer.innerHTML = '';
                }, 2000);
                
            } catch (err) {
                console.error("Print failed:", err);
                alert("Printing failed. The document might be too large.");
            } finally {
                if (btn) {
                    btn.innerHTML = originalIcon;
                    btn.style.pointerEvents = 'auto';
                }
            }
        }