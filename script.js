// Theme Toggle
        function toggleTheme() {
            const body = document.body;
            const btn = document.getElementById('themeToggleBtn');
            body.classList.toggle('light-theme');
            if (body.classList.contains('light-theme')) {
                btn.innerHTML = '🌙';
            } else {
                btn.innerHTML = '☀️';
            }
        }
        // Software data
        const softwareData = [
            {
                id: 11,
                name: "Share With",
                url: "https://rkd-630.github.io/sharewith",
                developer: "CaptureTech Ltd",
                category: "utilities",
                description: "Advanced screenshot and screen recording tool with auto-scroll capture, annotation editor, GIF creation, and cloud sharing integration.",
                version: "5.7.0",
                size: "55 MB",
                rating: 4.6,
                downloads: 2100000,
                price: "Free",
                tags: ["Screenshot", "Recording", "GIF", "Annotation"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1cd2a417c-4871-4eff-a5bb-6f357cc915b0.png",
                features: ["Auto-scroll Capture", "Screen Recording", "Annotation Editor", "GIF Creation", "Cloud Sharing", "Scheduled Capture"]
            },
            {
                id: 1,
                name: "BG Remover",
                url: "https://rkd-630.github.io/vdo-edit/",
                developer: "DevTech Solutions",
                category: "development",
                description: "Next-generation integrated development environment with AI-powered code completion, real-time collaboration, and support for 50+ programming languages.",
                version: "4.2.1",
                size: "245 MB",
                rating: 4.9,
                downloads: 2400000,
                price: "Free",
                tags: ["IDE", "AI", "Multi-language", "Collaboration"],
                isNew: true,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/12dd1db96-31a2-4711-a37b-4a8a945e4341.png",
                features: ["AI Code Completion", "50+ Language Support", "Real-time Collaboration", "Built-in Terminal", "Git Integration", "Extension Marketplace"]
            },
            {
                id: 2,
                name: "Web Viewer",
                url: "https://rkd-630.github.io/Web-Viewer",
                developer: "Creative Arts Inc",
                category: "design",
                description: "Professional graphic design suite with vector editing, photo manipulation, 3D rendering, and an extensive library of templates and assets.",
                version: "8.5.0",
                size: "1.2 GB",
                rating: 4.7,
                downloads: 1800000,
                price: "$29.99/mo",
                tags: ["Design", "3D", "Vector", "Photo"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/15e011eea-8d08-4c80-97d3-f9825c6deca5.png",
                features: ["Vector & Raster Editing", "3D Rendering Engine", "2000+ Templates", "Batch Processing", "Plugin Ecosystem", "Cloud Asset Library"]
            },
            {
                id: 3,
                name: "Internet FM Radio",
                url: "https://rkd-630.github.io/internet-FM-radio2",
                developer: "ProductiveFlow Ltd",
                category: "productivity",
                developer: "ProductiveFlow Ltd",
                category: "productivity",
                description: "All-in-one project management and team collaboration tool with Kanban boards, Gantt charts, time tracking, and smart automation workflows.",
                version: "3.8.2",
                size: "89 MB",
                rating: 4.8,
                downloads: 3200000,
                price: "Free / $12/mo",
                tags: ["Project Management", "Kanban", "Automation"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1f1941ba9-ca78-4854-a380-f8f0e58a18e6.png",
                features: ["Kanban & Gantt Views", "Smart Automation", "Time Tracking", "Team Chat Integration", "Custom Workflows", "Cross-platform Sync"]
            },
            {
                id: 4,
                name: "Html to web file Converter",
                url: "https://rkd-630.github.io/TiingPong",
                developer: "CyberShield Corp",
                category: "security",
                description: "Advanced cybersecurity suite offering real-time malware protection, firewall management, VPN encryption, and zero-day threat detection.",
                version: "8.0.1",
                size: "180 MB",
                rating: 4.8,
                downloads: 4100000,
                price: "$49.99/yr",
                tags: ["Antivirus", "Firewall", "VPN", "Zero-day"],
                isNew: true,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/16d3fcb5d-6673-4d10-9782-2e25992370cc.png",
                features: ["Real-time Malware Protection", "Advanced Firewall", "Built-in VPN", "Zero-day Detection", "Phishing Shield", "System Vulnerability Scanner"]
            },
            {
                id: 5,
                name: "MP3 Cutter",
                url: "https://rkd-630.github.io/FM-radio",
                developer: "MediaTech Studios",
                category: "multimedia",
                description: "Professional video editing software with 8K support, AI scene detection, color grading tools, motion tracking, and 500+ visual effects.",
                version: "6.3.0",
                size: "2.1 GB",
                rating: 4.6,
                downloads: 1500000,
                price: "$39.99/mo",
                tags: ["Video Editing", "8K", "VFX", "Color Grading"],
                isNew: true,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1d44a4666-3aca-4588-a385-bf2fd3702a23.png",
                features: ["8K Native Editing", "AI Scene Detection", "Advanced Color Grading", "Motion Tracking", "500+ VFX Effects", "Multi-cam Editing"]
            },
            {
                id: 6,
                name: "Wireless",
                url: "https://rkd-630.github.io/wireless",
                developer: "SyncSoft Technologies",
                category: "utilities",
                description: "Intelligent cloud synchronization tool with end-to-end encryption, conflict resolution, selective sync, and support for all major cloud providers.",
                version: "5.1.0",
                size: "65 MB",
                rating: 4.5,
                downloads: 2800000,
                price: "Free / $8/mo",
                tags: ["Cloud Sync", "Encryption", "Multi-provider"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/16ad70104-3a8c-48f2-be28-16ff1fb76a91.png",
                features: ["E2E Encryption", "Conflict Resolution", "Selective Sync", "Multi-cloud Support", "Bandwidth Control", "Version History"]
            },
            {
                id: 7,
                name: "Converter",
                url: "https://rkd-630.github.io/Converter",
                developer: "SecureVault Inc",
                category: "security",
                description: "Military-grade file encryption software with AES-256 encryption, secure file shredding, encrypted containers, and secure cloud backup.",
                version: "3.4.0",
                size: "42 MB",
                rating: 4.7,
                downloads: 980000,
                price: "Free",
                tags: ["Encryption", "AES-256", "File Shredding"],
                isNew: false,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1ddbb670f-6e6d-4108-b7f1-7dc509f70591.png",
                features: ["AES-256 Encryption", "Secure File Shredding", "Encrypted Containers", "Password Manager", "Secure Cloud Backup", "Biometric Unlock"]
            },
            {
                id: 8,
                name: "PDF Converter",
                url: "https://rkd-630.github.io/campdf",
                developer: "AudioPro Labs",
                category: "multimedia",
                description: "Professional audio editing and production suite with spatial audio mixing, AI noise reduction, multi-track recording, and mastering tools.",
                version: "7.2.0",
                size: "480 MB",
                rating: 4.6,
                downloads: 1200000,
                price: "$24.99/mo",
                tags: ["Audio Editing", "Spatial Audio", "AI"],
                isNew: true,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/151193691-5869-4d61-8bd0-748e7bbac0e7.png",
                features: ["Spatial Audio Mixing", "AI Noise Reduction", "Multi-track Recording", "Mastering Suite", "VST Plugin Support", "Spectrum Analyzer"]
            },
            {
                id: 9,
                name: "Social Media",
                url: "https://rkd-630.github.io/Smedia",
                developer: "NetSight Systems",
                category: "utilities",
                description: "Comprehensive network monitoring and diagnostics tool with real-time traffic analysis, IoT device scanning, and automated alerting system.",
                version: "4.9.3",
                size: "95 MB",
                rating: 4.4,
                downloads: 760000,
                price: "Free / $19.99/mo",
                tags: ["Network", "Monitoring", "IoT"],
                isNew: false,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/12747d3e4-e921-4e13-bae8-b29b74bd35ed.png",
                features: ["Real-time Traffic Analysis", "IoT Device Scanning", "Automated Alerting", "Bandwidth Monitoring", "Network Mapping", "Historical Reports"]
            },
            {
                id: 10,
                name: "Thumbnails for SM",
                url: "https://rkd-630.github.io/thumbnails",
                developer: "DocuTech Solutions",
                category: "utilities",
                description: "Complete PDF toolkit with editing, conversion, OCR, digital signatures, and AI-powered document summarization capabilities.",
                version: "3.0.1",
                size: "120 MB",
                rating: 4.5,
                downloads: 3500000,
                price: "$9.99/mo",
                tags: ["PDF", "OCR", "AI", "Signatures"],
                isNew: true,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1562de706-9a0d-48e5-9de0-012c4c7dadca.png",
                features: ["Full PDF Editing", "OCR Text Recognition", "Digital Signatures", "AI Summarization", "Batch Conversion", "Form Builder"]
            },

            {
                id: 12,
                name: "Social Media Post",
                url: "https://rkd-630.github.io/smpost",
                developer: "DataCore Systems",
                category: "development",
                description: "Visual database management tool with multi-cloud query support, schema designer, data visualization, and automated backup scheduling.",
                version: "6.0.2",
                size: "310 MB",
                rating: 4.7,
                downloads: 890000,
                price: "$19.99/mo",
                tags: ["Database", "Multi-cloud", "Visualization"],
                isNew: true,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/15aa38417-1a84-466c-be89-0630ef89106a.png",
                features: ["Multi-cloud Query Support", "Visual Schema Designer", "Data Visualization", "Auto Backup Scheduling", "Query Builder", "Performance Analyzer"]
            },
            {
                id: 13,
                name: "Passport Size Photo",
                url: "https://rkd-630.github.io/passport_photo",
                developer: "DevTech Solutions",
                category: "development",
                description: "Next-generation integrated development environment with AI-powered code completion, real-time collaboration, and support for 50+ programming languages.",
                version: "4.2.1",
                size: "245 MB",
                rating: 4.9,
                downloads: 2400000,
                price: "Free",
                tags: ["IDE", "AI", "Multi-language", "Collaboration"],
                isNew: true,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/12dd1db96-31a2-4711-a37b-4a8a945e4341.png",
                features: ["AI Code Completion", "50+ Language Support", "Real-time Collaboration", "Built-in Terminal", "Git Integration", "Extension Marketplace"]
            },
            {
                id: 14,
                name: "Game-Hub",
                url: "https://rkd-630.github.io/Game-Hub",
                developer: "Creative Arts Inc",
                category: "design",
                description: "Professional graphic design suite with vector editing, photo manipulation, 3D rendering, and an extensive library of templates and assets.",
                version: "8.5.0",
                size: "1.2 GB",
                rating: 4.7,
                downloads: 1800000,
                price: "$29.99/mo",
                tags: ["Design", "3D", "Vector", "Photo"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/15e011eea-8d08-4c80-97d3-f9825c6deca5.png",
                features: ["Vector & Raster Editing", "3D Rendering Engine", "2000+ Templates", "Batch Processing", "Plugin Ecosystem", "Cloud Asset Library"]
            },
            {
                id: 15,
                name: "Internet-FM-radio",
                url: "https://rkd-630.github.io/internet-FM-radio",
                developer: "ProductiveFlow Ltd",
                category: "productivity",
                description: "All-in-one project management and team collaboration tool with Kanban boards, Gantt charts, time tracking, and smart automation workflows.",
                version: "3.8.2",
                size: "89 MB",
                rating: 4.8,
                downloads: 3200000,
                price: "Free / $12/mo",
                tags: ["Project Management", "Kanban", "Automation"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1f1941ba9-ca78-4854-a380-f8f0e58a18e6.png",
                features: ["Kanban & Gantt Views", "Smart Automation", "Time Tracking", "Team Chat Integration", "Custom Workflows", "Cross-platform Sync"]
            },
            {
                id: 16,
                name: "Text Make Video",
                url: "https://rkd-630.github.io/textvideo",
                developer: "CyberShield Corp",
                category: "security",
                description: "Advanced cybersecurity suite offering real-time malware protection, firewall management, VPN encryption, and zero-day threat detection.",
                version: "8.0.1",
                size: "180 MB",
                rating: 4.8,
                downloads: 4100000,
                price: "$49.99/yr",
                tags: ["Antivirus", "Firewall", "VPN", "Zero-day"],
                isNew: true,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/16d3fcb5d-6673-4d10-9782-2e25992370cc.png",
                features: ["Real-time Malware Protection", "Advanced Firewall", "Built-in VPN", "Zero-day Detection", "Phishing Shield", "System Vulnerability Scanner"]
            },
            {
                id: 17,
                name: "Clips",
                url: "https://rkd-630.github.io/Clip",
                developer: "MediaTech Studios",
                category: "multimedia",
                description: "Professional video editing software with 8K support, AI scene detection, color grading tools, motion tracking, and 500+ visual effects.",
                version: "6.3.0",
                size: "2.1 GB",
                rating: 4.6,
                downloads: 1500000,
                price: "$39.99/mo",
                tags: ["Video Editing", "8K", "VFX", "Color Grading"],
                isNew: true,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1d44a4666-3aca-4588-a385-bf2fd3702a23.png",
                features: ["8K Native Editing", "AI Scene Detection", "Advanced Color Grading", "Motion Tracking", "500+ VFX Effects", "Multi-cam Editing"]
            },
            {
                id: 18,
                name: "Post Craft",
                url: "https://rkd-630.github.io/postcraft",
                developer: "SyncSoft Technologies",
                category: "utilities",
                description: "Intelligent cloud synchronization tool with end-to-end encryption, conflict resolution, selective sync, and support for all major cloud providers.",
                version: "5.1.0",
                size: "65 MB",
                rating: 4.5,
                downloads: 2800000,
                price: "Free / $8/mo",
                tags: ["Cloud Sync", "Encryption", "Multi-provider"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/16ad70104-3a8c-48f2-be28-16ff1fb76a91.png",
                features: ["E2E Encryption", "Conflict Resolution", "Selective Sync", "Multi-cloud Support", "Bandwidth Control", "Version History"]
            },
            {
                id: 19,
                name: "Player",
                url: "https://rkd-630.github.io/player",
                developer: "SecureVault Inc",
                category: "security",
                description: "Military-grade file encryption software with AES-256 encryption, secure file shredding, encrypted containers, and secure cloud backup.",
                version: "3.4.0",
                size: "42 MB",
                rating: 4.7,
                downloads: 980000,
                price: "Free",
                tags: ["Encryption", "AES-256", "File Shredding"],
                isNew: false,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1ddbb670f-6e6d-4108-b7f1-7dc509f70591.png",
                features: ["AES-256 Encryption", "Secure File Shredding", "Encrypted Containers", "Password Manager", "Secure Cloud Backup", "Biometric Unlock"]
            },
            {
                id: 20,
                name: "Pass Port foto",
                url: "https://rkd-630.github.io/passportfoto",
                developer: "AudioPro Labs",
                category: "multimedia",
                description: "Professional audio editing and production suite with spatial audio mixing, AI noise reduction, multi-track recording, and mastering tools.",
                version: "7.2.0",
                size: "480 MB",
                rating: 4.6,
                downloads: 1200000,
                price: "$24.99/mo",
                tags: ["Audio Editing", "Spatial Audio", "AI"],
                isNew: true,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/151193691-5869-4d61-8bd0-748e7bbac0e7.png",
                features: ["Spatial Audio Mixing", "AI Noise Reduction", "Multi-track Recording", "Mastering Suite", "VST Plugin Support", "Spectrum Analyzer"]
            },
            {
                id: 21,
                name: "gameJI",
                url: "https://rkd-630.github.io/gameJI",
                developer: "NetSight Systems",
                category: "utilities",
                description: "Comprehensive network monitoring and diagnostics tool with real-time traffic analysis, IoT device scanning, and automated alerting system.",
                version: "4.9.3",
                size: "95 MB",
                rating: 4.4,
                downloads: 760000,
                price: "Free / $19.99/mo",
                tags: ["Network", "Monitoring", "IoT"],
                isNew: false,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/12747d3e4-e921-4e13-bae8-b29b74bd35ed.png",
                features: ["Real-time Traffic Analysis", "IoT Device Scanning", "Automated Alerting", "Bandwidth Monitoring", "Network Mapping", "Historical Reports"]
            },
            {
                id: 22,
                name: "TingPong",
                url: "https://rkd-630.github.io/TingPong",
                developer: "DocuTech Solutions",
                category: "utilities",
                description: "Complete PDF toolkit with editing, conversion, OCR, digital signatures, and AI-powered document summarization capabilities.",
                version: "3.0.1",
                size: "120 MB",
                rating: 4.5,
                downloads: 3500000,
                price: "$9.99/mo",
                tags: ["PDF", "OCR", "AI", "Signatures"],
                isNew: true,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1562de706-9a0d-48e5-9de0-012c4c7dadca.png",
                features: ["Full PDF Editing", "OCR Text Recognition", "Digital Signatures", "AI Summarization", "Batch Conversion", "Form Builder"]
            },
            {
                id: 23,
                name: "Geocam",
                url: "https://rkd-630.github.io/Geocam",
                developer: "CaptureTech Ltd",
                category: "utilities",
                description: "Advanced screenshot and screen recording tool with auto-scroll capture, annotation editor, GIF creation, and cloud sharing integration.",
                version: "5.7.0",
                size: "55 MB",
                rating: 4.6,
                downloads: 2100000,
                price: "Free",
                tags: ["Screenshot", "Recording", "GIF", "Annotation"],
                isNew: false,
                isPopular: true,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/1cd2a417c-4871-4eff-a5bb-6f357cc915b0.png",
                features: ["Auto-scroll Capture", "Screen Recording", "Annotation Editor", "GIF Creation", "Cloud Sharing", "Scheduled Capture"]
            },
            {
                id: 24,
                name: "630RKD",
                url: "https://rkd-630.github.io/630RKD",
                developer: "DataCore Systems",
                category: "development",
                description: "Visual database management tool with multi-cloud query support, schema designer, data visualization, and automated backup scheduling.",
                version: "6.0.2",
                size: "310 MB",
                rating: 4.7,
                downloads: 890000,
                price: "$19.99/mo",
                tags: ["Database", "Multi-cloud", "Visualization"],
                isNew: true,
                isPopular: false,
                verified: true,
                icon: "https://image.qwenlm.ai/public_source/a6108293-2fb7-42a1-b1e3-a7f74c11158c/15aa38417-1a84-466c-be89-0630ef89106a.png",
                features: ["Multi-cloud Query Support", "Visual Schema Designer", "Data Visualization", "Auto Backup Scheduling", "Query Builder", "Performance Analyzer"]
            }
        ];

        let currentCategory = 'all';
        let currentView = 'grid';
        let currentSort = 'popular';
        let isEditMode = false;
        let currentEditingImage = null;
        let currentEditingLink = null;
        let originalContent = null;

        // Toggle Edit Mode
        function toggleEditMode() {
            isEditMode = !isEditMode;
            const body = document.body;
            const editToggle = document.getElementById('editToggle');
            const saveBtn = document.getElementById('saveBtn');
            const cancelBtn = document.getElementById('cancelBtn');
            const editIndicator = document.getElementById('editIndicator');

            if (isEditMode) {
                // Save original content
                originalContent = document.body.innerHTML;
                
                body.classList.add('edit-mode');
                editToggle.textContent = '❌ Edit Mode Off';
                editToggle.classList.add('active');
                saveBtn.style.display = 'flex';
                cancelBtn.style.display = 'flex';
                editIndicator.classList.add('active');

                // Make elements editable
                enableEditing();
                showToast('info', 'Edit Mode ON', 'Click on any text, image, or link to edit it');
            } else {
                disableEditing();
                editToggle.textContent = '✏️ Edit Mode';
                editToggle.classList.remove('active');
                saveBtn.style.display = 'none';
                cancelBtn.style.display = 'none';
                editIndicator.classList.remove('active');
                showToast('info', 'Edit Mode OFF', 'Editing has been disabled');
            }
        }

        // Enable editing on elements
        function enableEditing() {
            // Make text elements editable
            document.querySelectorAll('.editable-text, .ticker-item, .card-title, .card-developer, .card-description, .tag, .stat-info h4, .stat-info p, .section-title, .footer-col h4, .footer-brand p, .footer-bottom p').forEach(el => {
                el.setAttribute('contenteditable', 'true');
            });

            // Make images editable
            document.querySelectorAll('img').forEach(img => {
                img.classList.add('editable-image');
                img.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openImageModal(img);
                };
            });

            // Make links editable
            document.querySelectorAll('a').forEach(link => {
                link.classList.add('editable-link');
                link.onclick = (e) => {
                    if (isEditMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        openLinkModal(link);
                    }
                };
            });
        }

        // Disable editing
        function disableEditing() {
            document.body.classList.remove('edit-mode');
            
            document.querySelectorAll('[contenteditable]').forEach(el => {
                el.removeAttribute('contenteditable');
            });

            document.querySelectorAll('.editable-image').forEach(img => {
                img.classList.remove('editable-image');
                img.onclick = null;
            });

            document.querySelectorAll('.editable-link').forEach(link => {
                link.onclick = null;
            });
        }

        // Save as HTML file and hide edit button
        function saveAsHTML() {
            // First, clean up the HTML by removing edit mode artifacts
            const clone = document.documentElement.cloneNode(true);
            
            // Remove edit mode classes and attributes from clone
            clone.querySelectorAll('[contenteditable]').forEach(el => {
                el.removeAttribute('contenteditable');
            });
            
            clone.querySelectorAll('.editable-image').forEach(img => {
                img.classList.remove('editable-image');
                img.removeAttribute('onclick');
            });
            
            clone.querySelectorAll('.editable-link').forEach(link => {
                link.classList.remove('editable-link');
            });
            
            // Remove edit mode toggle from the saved file (hide it permanently)
            const editToggle = clone.querySelector('#editModeToggle');
            if (editToggle) {
                editToggle.style.display = 'none';
            }
            
            // Remove edit indicator
            const editIndicator = clone.querySelector('#editIndicator');
            if (editIndicator) {
                editIndicator.classList.remove('active');
                editIndicator.style.display = 'none';
            }
            
            // Remove image and link edit modals
            const imageModal = clone.querySelector('#imageEditModal');
            if (imageModal) imageModal.remove();
            const linkModal = clone.querySelector('#linkEditModal');
            if (linkModal) linkModal.remove();
            
            // Remove edit-mode class from body
            clone.querySelector('body').classList.remove('edit-mode');
            
            // Get the cleaned HTML
            let htmlContent = '<!DOCTYPE html>\n' + clone.outerHTML;
            
            // Create blob and download
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'SoftwareHub_' + new Date().toISOString().slice(0, 10) + '.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Show success toast
            showToast('success', 'File Saved!', 'HTML file has been downloaded successfully.');
            
            // Hide the edit mode toggle permanently
            const toggleContainer = document.getElementById('editModeToggle');
            toggleContainer.classList.add('hidden');
            
            // Exit edit mode
            isEditMode = false;
            disableEditing();
            document.getElementById('editIndicator').classList.remove('active');
            
            // Also hide on current page after a short delay
            setTimeout(() => {
                toggleContainer.style.display = 'none';
            }, 400);
        }

        // Cancel editing
        function cancelEdit() {
            if (originalContent) {
                document.body.innerHTML = originalContent;
                showToast('info', 'Cancelled', 'Changes have been discarded');
            }
            isEditMode = false;
            document.getElementById('editToggle').textContent = '✏️ Edit Mode';
            document.getElementById('editToggle').classList.remove('active');
            document.getElementById('saveBtn').style.display = 'none';
            document.getElementById('cancelBtn').style.display = 'none';
            document.getElementById('editIndicator').classList.remove('active');
            
            // Re-initialize after cancel
            setTimeout(() => {
                renderSoftware(softwareData);
            }, 100);
        }

        // Image editing
        function openImageModal(imgElement) {
            currentEditingImage = imgElement;
            const modal = document.getElementById('imageEditModal');
            const input = document.getElementById('imageUrlInput');
            input.value = imgElement.src;
            modal.classList.add('active');
        }

        function closeImageModal() {
            document.getElementById('imageEditModal').classList.remove('active');
            currentEditingImage = null;
        }

        function applyImageChange() {
            const newUrl = document.getElementById('imageUrlInput').value;
            if (currentEditingImage && newUrl) {
                currentEditingImage.src = newUrl;
                showToast('success', 'Image Updated', 'Image has been changed successfully');
            }
            closeImageModal();
        }

        // Link editing
        function openLinkModal(linkElement) {
            currentEditingLink = linkElement;
            const modal = document.getElementById('linkEditModal');
            const input = document.getElementById('linkUrlInput');
            input.value = linkElement.href;
            modal.classList.add('active');
        }

        function closeLinkModal() {
            document.getElementById('linkEditModal').classList.remove('active');
            currentEditingLink = null;
        }

        function applyLinkChange() {
            const newUrl = document.getElementById('linkUrlInput').value;
            if (currentEditingLink && newUrl) {
                currentEditingLink.href = newUrl;
                showToast('success', 'Link Updated', 'Link has been changed successfully');
            }
            closeLinkModal();
        }

        // Render software cards
        function renderSoftware(data) {
            const grid = document.getElementById('softwareGrid');
            grid.innerHTML = '';

            data.forEach((software, index) => {
                const card = document.createElement('div');
                card.className = 'software-card';
                card.style.animationDelay = `${index * 0.06}s`;
                card.onclick = () => openModal(software);

                const starsHTML = generateStars(software.rating);
                const categoryBadgeClass = `badge-${software.category}`;
                const downloadCount = formatNumber(software.downloads);

                let tagsHTML = '';
                let tagLabel = '';
                if (software.isNew) {
                    tagLabel += `<span class="new-tag">🔥 NEW</span> `;
                }
                if (software.isPopular) {
                    tagLabel += `<span class="popular-tag">⭐ POPULAR</span>`;
                }

                card.innerHTML = `
                    <div class="card-header">
                        <img src="${software.icon}" alt="${software.name}" class="card-icon editable-image">
                        <div class="card-info">
                            <div class="card-title editable-text">
                                ${software.name}
                                ${software.verified ? '<span class="verified-badge">✓</span>' : ''}
                                ${tagLabel}
                            </div>
                            <div class="card-developer editable-text">${software.developer}</div>
                            <span class="card-category-badge ${categoryBadgeClass}">${getCategoryLabel(software.category)}</span>
                        </div>
                    </div>
                    <p class="card-description editable-text">${software.description}</p>
                    <div class="card-meta">
                        <div class="rating">
                            <div class="rating-stars">${starsHTML}</div>
                            ${software.rating}
                        </div>
                        <div class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                            ${downloadCount} downloads
                        </div>
                        <div class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                            v${software.version}
                        </div>
                        <div class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                            ${software.size}
                        </div>
                    </div>
                    <div class="card-tags">
                        ${software.tags.map(t => `<span class="tag editable-text">${t}</span>`).join('')}
                    </div>
                    <div class="card-actions" onclick="event.stopPropagation()">
                        <a href="${software.url}" style="text-decoration:none; width: 100%;">
                            <button class="btn-download primary" style="width: 100%;">
                                ▶ Launch Application
                            </button>
                        </a>
                    </div>
                `;

                grid.appendChild(card);
            });

            document.getElementById('resultsCount').innerHTML = `Showing <strong>${data.length}</strong> software`;

            // Re-enable editing if in edit mode
            if (isEditMode) {
                enableEditing();
            }
        }

        function generateStars(rating) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(rating)) {
                    stars += '<span class="star">★</span>';
                } else if (i - 0.5 <= rating) {
                    stars += '<span class="star">★</span>';
                } else {
                    stars += '<span class="star empty">★</span>';
                }
            }
            return stars;
        }

        function formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
            return num.toString();
        }

        function getCategoryLabel(cat) {
            const labels = {
                development: ' Development',
                design: '🎨 Design',
                productivity: '📋 Productivity',
                security: '🔒 Security',
                multimedia: '🎬 Multimedia',
                utilities: '🔧 Utilities'
            };
            return labels[cat] || cat;
        }

        function filterByCategory(category, tabElement) {
            currentCategory = category;

            // Update active tab
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            tabElement.classList.add('active');

            applyFilters();
        }

        function filterSoftware() {
            applyFilters();
        }

        function sortSoftware() {
            currentSort = document.getElementById('sortSelect').value;
            applyFilters();
        }

        function applyFilters() {
            let filtered = [...softwareData];

            // Category filter
            if (currentCategory !== 'all') {
                filtered = filtered.filter(s => s.category === currentCategory);
            }

            // Search filter
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            if (searchTerm) {
                filtered = filtered.filter(s =>
                    s.name.toLowerCase().includes(searchTerm) ||
                    s.category.toLowerCase().includes(searchTerm) ||
                    s.description.toLowerCase().includes(searchTerm) ||
                    s.tags.some(t => t.toLowerCase().includes(searchTerm)) ||
                    s.developer.toLowerCase().includes(searchTerm)
                );
            }

            // Sort
            switch (currentSort) {
                case 'popular':
                    filtered.sort((a, b) => b.downloads - a.downloads);
                    break;
                case 'rating':
                    filtered.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                    break;
                case 'name':
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'size':
                    filtered.sort((a, b) => parseInt(a.size) - parseInt(b.size));
                    break;
            }

            renderSoftware(filtered);
        }

        function setView(view) {
            currentView = view;
            const grid = document.getElementById('softwareGrid');

            document.getElementById('gridBtn').classList.toggle('active', view === 'grid');
            document.getElementById('listBtn').classList.toggle('active', view === 'list');

            if (view === 'list') {
                grid.classList.add('list-view');
            } else {
                grid.classList.remove('list-view');
            }
        }

        // Modal
        function openModal(software) {
            const overlay = document.getElementById('modalOverlay');
            const title = document.getElementById('modalTitle');
            const body = document.getElementById('modalBody');

            title.textContent = software.name;

            const starsHTML = generateStars(software.rating);
            const downloadCount = formatNumber(software.downloads);

            body.innerHTML = `
                <div class="modal-icon-row">
                    <img src="${software.icon}" alt="${software.name}" class="modal-icon editable-image">
                    <div class="modal-title-group">
                        <h2 class="editable-text">${software.name} ${software.verified ? '<span class="verified-badge">✓</span>' : ''}</h2>
                        <p class="editable-text">${software.developer}</p>
                        <span class="card-category-badge badge-${software.category}" style="margin-top:8px">${getCategoryLabel(software.category)}</span>
                    </div>
                </div>

                <p class="editable-text" style="color: var(--text-secondary); font-size: 14px; line-height: 1.7;">${software.description}</p>

                <div class="modal-version-info">
                    <div class="version-item">
                        <label>Version</label>
                        <span class="editable-text">v${software.version}</span>
                    </div>
                    <div class="version-item">
                        <label>Size</label>
                        <span class="editable-text">${software.size}</span>
                    </div>
                    <div class="version-item">
                        <label>Downloads</label>
                        <span class="editable-text">${downloadCount}</span>
                    </div>
                    <div class="version-item">
                        <label>Rating</label>
                        <span class="rating"><div class="rating-stars">${starsHTML}</div> ${software.rating}</span>
                    </div>
                    <div class="version-item">
                        <label>Price</label>
                        <span class="price-tag ${software.price === 'Free' ? 'price-free' : 'price-paid'}">
                            ${software.price === 'Free' ? ' Free' : '💰 ' + software.price}
                        </span>
                    </div>
                    <div class="version-item">
                        <label>Platform</label>
                        <span class="editable-text">Win / Mac / Linux</span>
                    </div>
                </div>

                <div class="modal-features">
                    <h4 class="editable-text">Key Features</h4>
                    <ul class="feature-list">
                        ${software.features.map(f => `<li class="editable-text"><span class="check">✓</span> ${f}</li>`).join('')}
                    </ul>
                </div>

                <div class="modal-actions" onclick="event.stopPropagation()">
                    <a href="${software.url}" style="text-decoration:none; width: 100%;">
                        <button class="btn-download primary" style="width: 100%;">
                            ▶ Launch Application
                        </button>
                    </a>
                </div>

                <div class="download-progress" id="downloadProgress_${software.id}">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="progressFill_${software.id}"></div>
                    </div>
                    <div class="progress-info">
                        <span id="progressText_${software.id}">Downloading...</span>
                        <span id="progressPercent_${software.id}">0%</span>
                    </div>
                </div>
            `;

            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Enable editing in modal if in edit mode
            if (isEditMode) {
                enableEditing();
            }
        }

        function closeModal(event) {
            if (event && event.target !== event.currentTarget) return;
            const overlay = document.getElementById('modalOverlay');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Download simulation
        function startDownload(name, size) {
            showToast('success', 'Download Started', `${name} (${size}) is downloading...`);

            // Find a software item to show progress
            const sw = softwareData.find(s => s.name === name);
            if (sw) {
                const progressDiv = document.getElementById(`downloadProgress_${sw.id}`);
                if (progressDiv) {
                    progressDiv.classList.add('active');
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += Math.random() * 15 + 5;
                        if (progress >= 100) {
                            progress = 100;
                            clearInterval(interval);
                            document.getElementById(`progressText_${sw.id}`).textContent = 'Download complete!';
                            showToast('success', 'Download Complete', `${name} has been downloaded successfully!`);
                        }
                        document.getElementById(`progressFill_${sw.id}`).style.width = progress + '%';
                        document.getElementById(`progressPercent_${sw.id}`).textContent = Math.round(progress) + '%';
                    }, 400);
                }
            }

            closeModal();
        }

        // Demo launch
        function launchDemo(name) {
            showToast('info', 'Launching Demo', `Opening demo version of ${name}...`);

            // Simulate opening a demo window
            setTimeout(() => {
                const demoOverlay = document.createElement('div');
                demoOverlay.style.cssText = `
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.85); z-index: 3000;
                    display: flex; align-items: center; justify-content: center;
                    animation: fadeIn 0.3s ease;
                `;

                demoOverlay.innerHTML = `
                    <div style="background: var(--bg-card, #1A1A2E); border: 1px solid var(--border, #2A2A45); border-radius: 24px; padding: 48px; text-align: center; max-width: 500px; width: 90%;">
                        <div style="font-size: 64px; margin-bottom: 20px;">🚀</div>
                        <h2 style="font-size: 24px; margin-bottom: 8px;">${name}</h2>
                        <p style="color: var(--text-secondary, #A0A0B8); margin-bottom: 24px; font-size: 14px;">Demo version loaded successfully!</p>
                        <div style="background: rgba(108,92,231,0.1); border: 1px solid rgba(108,92,231,0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                            <p style="font-size: 13px; color: var(--warning, #FDCB6E);">⚠️ This is a demo version with limited features.</p>
                            <p style="font-size: 12px; color: var(--text-secondary, #A0A0B8); margin-top: 8px;">Some features may be restricted. Download the full version for complete access.</p>
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button onclick="this.closest('div[style]').parentElement.remove()" style="padding: 12px 24px; border-radius: 12px; border: 1px solid var(--border, #2A2A45); background: transparent; color: var(--text-primary, #fff); cursor: pointer; font-family: Inter, sans-serif; font-size: 14px; font-weight: 600;">Close Demo</button>
                            <button onclick="this.closest('div[style]').parentElement.remove()" style="padding: 12px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, #6C5CE7, #5A4BD1); color: white; cursor: pointer; font-family: Inter, sans-serif; font-size: 14px; font-weight: 600;">Download Full Version</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(demoOverlay);
                demoOverlay.onclick = (e) => { if (e.target === demoOverlay) demoOverlay.remove(); };
            }, 1000);

            closeModal();
        }

        // Toast notifications
        function showToast(type, title, message) {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;

            const icons = { success: '✅', info: 'ℹ️', warning: '⚠️' };

            toast.innerHTML = `
                <span class="toast-icon">${icons[type]}</span>
                <div class="toast-content">
                    <h5>${title}</h5>
                    <p>${message}</p>
                </div>
            `;

            container.appendChild(toast);

            setTimeout(() => {
                toast.remove();
            }, 3500);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                closeImageModal();
                closeLinkModal();
            }
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                const input = document.getElementById('searchInput');
                if (document.activeElement !== input) {
                    e.preventDefault();
                    input.focus();
                }
            }
            // Ctrl+S to save in edit mode
            if (e.ctrlKey && e.key === 's' && isEditMode) {
                e.preventDefault();
                saveAsHTML();
            }
        });

        // Initialize
        renderSoftware(softwareData);