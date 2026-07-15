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

        let currentScrollAnimation = null;
        let isAutoScrolling = false;

        function slowScrollTo(container, targetY, duration) {
            // If already scrolling, a second click stops it
            if (currentScrollAnimation) {
                cancelAnimationFrame(currentScrollAnimation);
                currentScrollAnimation = null;
                isAutoScrolling = false;
                return;
            }
            
            isAutoScrolling = true;
            const startY = container.scrollTop;
            const distance = targetY - startY;
            const startTime = performance.now();
            
            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Linear ease for comfortable auto-reading
                container.scrollTop = startY + distance * progress;
                
                if (progress < 1 && isAutoScrolling) {
                    currentScrollAnimation = requestAnimationFrame(step);
                } else {
                    currentScrollAnimation = null;
                    isAutoScrolling = false;
                    
                    // If we finished the scroll automatically, turn the page
                    if (progress === 1) {
                        const maxScroll = container.scrollHeight - container.clientHeight;
                        if (targetY === 0 && currentPage > 1) {
                            previousPage();
                        } else if (targetY >= maxScroll - 10) {
                            const stepAmount = twoPageMode ? 2 : 1;
                            if (currentPage + stepAmount - 1 < pdfDoc.numPages) {
                                nextPage();
                            }
                        }
                    }
                }
            }
            currentScrollAnimation = requestAnimationFrame(step);
        }

        function scrollUp() {
            const container = document.getElementById('pdfContainer');
            
            if (container.scrollTop > 0 || currentScrollAnimation) {
                // Auto-scroll to the absolute top point (speed: ~100px per second)
                const distance = container.scrollTop;
                const duration = Math.max(distance * 10, 800); 
                slowScrollTo(container, 0, duration);
            } else if (currentPage > 1) {
                previousPage();
            }
        }

        function scrollDown() {
            const container = document.getElementById('pdfContainer');
            const maxScroll = container.scrollHeight - container.clientHeight;
            
            if (container.scrollTop < maxScroll - 10 || currentScrollAnimation) {
                // Auto-scroll to the absolute bottom last point (speed: ~100px per second)
                const distance = maxScroll - container.scrollTop;
                const duration = Math.max(distance * 10, 800);
                slowScrollTo(container, maxScroll, duration);
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
        
        function startMagMove(dx, dy) {
            if (!isMagnifierMode) return;
            if (!twoPageMode && dx !== 0) return; // Only allow Y movement for single page

            if (magMoveInterval) clearInterval(magMoveInterval);
            
            magMoveInterval = setInterval(() => {
                lastMouseX += dx;
                lastMouseY += dy;
                
                if (lastMouseX < 0) lastMouseX = 0;
                if (lastMouseX > window.innerWidth) lastMouseX = window.innerWidth;
                if (lastMouseY < 0) lastMouseY = 0;
                if (lastMouseY > window.innerHeight) lastMouseY = window.innerHeight;
                
                scheduleMagnifierUpdate();
            }, 16);
        }

        function stopMagMove() {
            if (magMoveInterval) {
                clearInterval(magMoveInterval);
                magMoveInterval = null;
            }
        }
        
        function updateMagControllerUI() {
            const magController = document.getElementById('magController');
            if (!isMagnifierMode) {
                magController.classList.remove('active');
                return;
            }
            magController.classList.add('active');
            
            const leftBtn = document.querySelector('.mag-left');
            const rightBtn = document.querySelector('.mag-right');
            if (!twoPageMode) {
                leftBtn.style.opacity = '0.2';
                leftBtn.style.pointerEvents = 'none';
                rightBtn.style.opacity = '0.2';
                rightBtn.style.pointerEvents = 'none';
            } else {
                leftBtn.style.opacity = '1';
                leftBtn.style.pointerEvents = 'auto';
                rightBtn.style.opacity = '1';
                rightBtn.style.pointerEvents = 'auto';
            }
        }
        
        function toggleMagnifierMode() {
            isMagnifierMode = !isMagnifierMode;
            const btn = document.getElementById('magnifierModeBtn');
            const magGlass = document.getElementById('magnifierGlass');
            if (isMagnifierMode) {
                btn.classList.add('active-mode');
                
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
                btn.classList.remove('active-mode');
                magGlass.style.display = 'none';
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
            if (!twoPageMode) {
                if (clampedY < cRect.top) clampedY = cRect.top;
                if (clampedY > cRect.bottom) clampedY = cRect.bottom;
            }
            
            const scaleX = targetCanvas.width / cRect.width;
            const scaleY = targetCanvas.height / cRect.height;
            const canvasX = lastMouseX - cRect.left;
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
                
                const magHeight = Math.round(window.innerHeight * 0.15); // 15% vertically
                const magWidth = Math.round(cRect.width * ZOOM_FACTOR); // Expand width to fit zoomed text
                
                magCanvas.width = magWidth;
                magCanvas.height = magHeight;
                magGlass.style.width = magWidth + 'px';
                magGlass.style.height = magHeight + 'px';
                
                // Position horizontally centered on canvas, vertically clamped to canvas bounds
                magGlass.style.left = (cRect.left - (magWidth - cRect.width) / 2) + 'px';
                magGlass.style.top = clampedY + 'px';
                
                magCtx.fillStyle = 'white';
                magCtx.fillRect(0, 0, magWidth, magHeight);
                
                const sx = 0;
                const sy = canvasY * scaleY;
                const sWidth = targetCanvas.width;
                const sHeight = (magHeight / ZOOM_FACTOR) * scaleY;
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
        }

        function applyPdfEnhancement(val) {
            // val is 0 to 100. Default is 50.
            // 0 -> Darkness
            // 50 -> Normal
            // 100 -> High HD Quality (High Contrast, Sharpness, brightness)
            
            let contrast = 1;
            let brightness = 1;
            let saturate = 1;
            
            if (val < 50) {
                // Darkness / Dimming
                const factor = val / 50; // 0 to 1
                brightness = 0.4 + (0.6 * factor); // 40% to 100%
                contrast = 0.8 + (0.2 * factor); // 80% to 100%
                saturate = 0.5 + (0.5 * factor); // 50% to 100%
            } else {
                // HD Enhance / Sharpness
                const factor = (val - 50) / 50; // 0 to 1
                brightness = 1 + (0.2 * factor); // up to 120%
                contrast = 1 + (0.6 * factor); // up to 160% for crisp text
                saturate = 1 + (0.5 * factor); // up to 150%
            }
            
            document.documentElement.style.setProperty('--pdf-enhance-contrast', contrast);
            document.documentElement.style.setProperty('--pdf-enhance-brightness', brightness);
            document.documentElement.style.setProperty('--pdf-enhance-saturate', saturate);
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