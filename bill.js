// --- BILL GENERATION SYSTEM ---
// Author: TNCM Bakery
// Purpose: Generate professional bills for customer orders

class BillGenerator {
    constructor() {
        this.companyInfo = {
            name: "The Nutty Choco Morsels",
            tagline: "Premium Bakery Delights",
            address: "Gandhinagar, Gujarat",
            phone: "+91 9978744573, +91 9974565391",
            email: "thenuttychocomorsels@gmail.com",
            gstin: "XXXXXXXXXX", // Add your GSTIN if applicable
            logo: "bill-image.png"
        };
        
        this.billSettings = {
            currency: "₹",
            taxRate: 0, // 0% tax for bakery items (adjust as needed)
            discountRate: 0,
            terms: "1. Goods once sold cannot be returned\n2. Please check your order before payment\n3. Delivery charges may apply\n4. We accept Cash on Delivery",
            thankYouMessage: "Thank you for choosing The Nutty Choco Morsels!"
        };
    }

    // --- 2. GENERATE PDF USING JSPDF AND HTML2CANVAS ---
    async generatePDFBill(orderId) {
        try {
            console.log('Generating PDF bill for:', orderId);
            
            // Show loading
            this.showLoading('Generating PDF...');
            
            // Load jsPDF and html2canvas if not already loaded
            await this.loadPDFLibraries();
            
            // Get the bill element
            const billElement = document.querySelector('.bill-container');
            if (!billElement) {
                throw new Error('Bill container not found');
            }
            
            // Hide action buttons before capturing
            const actionButtons = billElement.querySelector('.action-buttons');
            const originalDisplay = actionButtons ? actionButtons.style.display : '';
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }
            
            // Generate canvas from bill element
            const canvas = await html2canvas(billElement, {
                scale: 2, // Increased scale for better quality on mobile
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: billElement.scrollWidth,
                height: billElement.scrollHeight
            });
            
            // Show buttons again after capturing
            if (actionButtons) {
                actionButtons.style.display = originalDisplay;
            }
            
            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Calculate dimensions to fit on A4 page
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const margin = 5; // 5mm margin on each side for full page usage
            const availableWidth = pageWidth - (margin * 2);
            const availableHeight = pageHeight - (margin * 2);
            
            // Calculate image dimensions to fit on A4
            const imgWidth = availableWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // If height exceeds available space, scale it down
            let finalWidth = imgWidth;
            let finalHeight = imgHeight;
            
            if (imgHeight > availableHeight) {
                finalHeight = availableHeight;
                finalWidth = (canvas.width * finalHeight) / canvas.height;
            }
            
            // Center the image on the page
            const x = (pageWidth - finalWidth) / 2;
            const y = margin; // Start from top margin
            
            // Add white background
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            
            // Add image to PDF (single page only)
            pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', x, y, finalWidth, finalHeight);
            
            // Save PDF
            const fileName = `Bill_${orderId}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);
            
            this.hideLoading();
            console.log('PDF generated successfully:', fileName);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.hideLoading();
            this.showError('Failed to generate PDF. Please try again.');
        }
    }
    
    // --- 3. LOAD PDF LIBRARIES ---
    async loadPDFLibraries() {
        if (window.jspdf && window.html2canvas) {
            return; // Already loaded
        }
        
        return new Promise((resolve, reject) => {
            // Load jsPDF
            const jspdfScript = document.createElement('script');
            jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            jspdfScript.onload = () => {
                // Load html2canvas
                const html2canvasScript = document.createElement('script');
                html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                html2canvasScript.onload = () => {
                    resolve();
                };
                html2canvasScript.onerror = reject;
                document.head.appendChild(html2canvasScript);
            };
            jspdfScript.onerror = reject;
            document.head.appendChild(jspdfScript);
        });
    }
    
    // --- 4. LOADING AND ERROR HANDLING ---
    showLoading(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'pdf-loading';
        loadingDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; margin-bottom: 15px;">📄</div>
                    <h3>${message}</h3>
                    <div style="margin-top: 15px;">
                        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6b0f1a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    </div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingDiv);
    }
    
    hideLoading() {
        const loadingDiv = document.getElementById('pdf-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 15px 20px; border-radius: 5px; z-index: 9999; max-width: 300px;">
                <strong>Error:</strong> ${message}
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; float: right; font-size: 18px; cursor: pointer;">&times;</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.parentElement.remove();
            }
        }, 5000);
    }

    // --- 5. GENERATE BILL HTML ---
    generateBillHTML(orderData, orderId) {
        const orderDate = orderData.timestamp ? 
            new Date(orderData.timestamp.seconds * 1000).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long', 
                year: 'numeric'
            }) : new Date().toLocaleDateString('en-IN');

        const orderTime = orderData.timestamp ? 
            new Date(orderData.timestamp.seconds * 1000).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            }) : new Date().toLocaleTimeString('en-IN');

        const subtotal = this.calculateSubtotal(orderData.items);
        const tax = this.calculateTax(subtotal);
        const discount = this.calculateDiscount(subtotal);
        const deliveryCharge = orderData.deliveryCharge || 0;
        const total = orderData.totalAmount || (subtotal + tax - discount + deliveryCharge);

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bill - ${orderId}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Roboto', sans-serif;
                }
                
                body {
                    background: white;
                    padding: 0;
                    margin: 0;
                }
                }
                
                .company-logo {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 15px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 30px;
                }
                
                .company-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 5px;
                }
                
                .company-tagline {
                    font-size: 14px;
                    opacity: 0.9;
                    margin-bottom: 10px;
                }
                
                .bill-meta {
                    background: #f8f9fa;
                    padding: 20px 30px;
                    border-bottom: 2px solid #e9ecef;
                }
                
                .meta-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .meta-row:last-child {
                    margin-bottom: 0;
                }
                
                .meta-label {
                    font-weight: 600;
                    color: #495057;
                }
                
                .meta-value {
                    color: #212529;
                    font-weight: 500;
                }
                
                .bill-content {
                    padding: 30px;
                }
                
                .section-title {
                    font-family: 'Playfair Display', serif;
                    font-size: 18px;
                    color: #6b0f1a;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #c5a059;
                }
                
                .customer-info {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                }
                
                .info-row {
                    display: flex;
                    margin-bottom: 8px;
                }
                
                .info-row:last-child {
                    margin-bottom: 0;
                }
                
                .info-label {
                    font-weight: 600;
                    color: #495057;
                    min-width: 100px;
                }
                
                .info-value {
                    color: #212529;
                    flex: 1;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                }
                
                .items-table th {
                    background: #6b0f1a;
                    color: white;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .items-table td {
                    padding: 12px;
                    border-bottom: 1px solid #dee2e6;
                    font-size: 14px;
                }
                
                .items-table tr:last-child td {
                    border-bottom: none;
                }
                
                .items-table tr:nth-child(even) {
                    background: #f8f9fa;
                }
                
                .item-name {
                    font-weight: 600;
                    color: #212529;
                }
                
                .item-quantity {
                    text-align: center;
                    color: #495057;
                }
                
                .item-price {
                    text-align: right;
                    color: #495057;
                }
                
                .item-total {
                    text-align: right;
                    font-weight: 600;
                    color: #212529;
                }
                
                .bill-summary {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }
                
                .summary-row:last-child {
                    margin-bottom: 0;
                }
                
                .summary-row.total {
                    font-size: 18px;
                    font-weight: 700;
                    color: #6b0f1a;
                    padding-top: 10px;
                    border-top: 2px solid #c5a059;
                }
                
                .bill-terms {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 25px;
                }
                
                .terms-title {
                    font-weight: 600;
                    color: #856404;
                    margin-bottom: 10px;
                }
                
                .terms-text {
                    color: #856404;
                    font-size: 14px;
                    white-space: pre-line;
                    line-height: 1.5;
                }
                
                .bill-footer {
                    background: #6b0f1a;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                
                .thank-you {
                    font-family: 'Playfair Display', serif;
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                
                .contact-info {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .action-buttons {
                    padding: 20px 30px;
                    background: #f8f9fa;
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }
                
                .btn-primary {
                    background: #6b0f1a;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #5a0e15;
                    transform: translateY(-2px);
                }
                
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                
                .btn-secondary:hover {
                    background: #5a6268;
                    transform: translateY(-2px);
                }
                
                @media print {
                    body {
                        background: white;
                        padding: 0;
                        margin: 0;
                    }
                    
                    .action-buttons {
                        display: none !important;
                    }
                    
                    .bill-container {
                        position: relative;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 210mm;
                        margin: 0 auto;
                        background: white;
                        box-shadow: none;
                    }
                }
                
                @media (max-width: 600px) {
                    body {
                        background: white;
                        padding: 0;
                        margin: 0;
                        font-size: 16px;
                    }
                    
                    .bill-container {
                        margin: 0;
                        font-size: 16px;
                        background: white;
                    }
                    
                    .bill-header {
                        padding: 20px !important;
                    }
                    
                    .bill-header div[style*="font-size: 28px"] {
                        font-size: 22px !important;
                    }
                    
                    .bill-header div[style*="font-size: 16px"] {
                        font-size: 14px !important;
                    }
                    
                    .bill-meta, .bill-content {
                        padding: 20px !important;
                    }
                    
                    .meta-row, .info-row {
                        flex-direction: column;
                        gap: 8px;
                        font-size: 15px;
                    }
                    
                    .meta-label, .info-label {
                        font-size: 14px;
                        font-weight: 600;
                    }
                    
                    .meta-value, .info-value {
                        font-size: 15px;
                    }
                    
                    .section-title {
                        font-size: 18px;
                        margin-bottom: 12px;
                    }
                    
                    .items-table {
                        font-size: 15px;
                    }
                    
                    .items-table th, .items-table td {
                        padding: 10px;
                        font-size: 14px;
                    }
                    
                    .customer-info {
                        padding: 15px;
                        font-size: 15px;
                    }
                    
                    .bill-summary {
                        padding: 15px;
                        font-size: 15px;
                    }
                    
                    .summary-row {
                        font-size: 14px;
                    }
                    
                    .summary-row.total {
                        font-size: 16px;
                    }
                    
                    .bill-terms {
                        padding: 15px;
                        font-size: 13px;
                    }
                    
                    .bill-footer {
                        padding: 20px !important;
                    }
                    
                    .bill-footer div[style*="font-size: 20px"] {
                        font-size: 16px !important;
                    }
                    
                    .bill-footer div[style*="font-size: 14px"] {
                        font-size: 12px !important;
                    }
                    
                    .bill-footer div[style*="font-size: 12px"] {
                        font-size: 11px !important;
                    }
                    
                    .action-buttons {
                        flex-direction: column;
                        padding: 15px;
                    }
                    
                    .action-buttons button {
                        font-size: 14px;
                        padding: 12px 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="bill-container">
                <!-- Header with Website Name -->
                <div class="bill-header" style="background: linear-gradient(135deg, #6b0f1a, #8b2530); color: white; padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
                    <img src="bill-image.png" style="width: 80px; height: 80px; margin-bottom: 15px; background: white; border-radius: 50%; padding: 10px;" alt="The Nutty Choco Morsels Logo">
                    <div style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; margin-bottom: 5px;">The Nutty Choco Morsels</div>
                    <div style="font-size: 16px; opacity: 0.9;">Premium Bakery Delights</div>
                </div>
                
                <!-- Bill Meta Information -->
                <div class="bill-meta">
                    <div class="meta-row">
                        <span class="meta-label">Bill No:</span>
                        <span class="meta-value">#${orderId.toUpperCase()}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Date:</span>
                        <span class="meta-value">${orderDate}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Time:</span>
                        <span class="meta-value">${orderTime}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Status:</span>
                        <span class="meta-value">${orderData.status || 'Pending'}</span>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="bill-content">
                    <!-- Customer Information -->
                    <div class="section-title">Customer Information</div>
                    <div class="customer-info">
                        <div class="info-row">
                            <span class="info-label">Name:</span>
                            <span class="info-value">${orderData.userName || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone:</span>
                            <span class="info-value">${orderData.phone || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${orderData.userEmail || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Address:</span>
                            <span class="info-value">${orderData.address || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <!-- Order Items -->
                    <div class="section-title">Order Details</div>
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th style="text-align: center;">Quantity</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateItemsRows(orderData.items)}
                        </tbody>
                    </table>
                    
                    <!-- Bill Summary -->
                    <div class="section-title">Bill Summary</div>
                    <div class="bill-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>${this.billSettings.currency}${subtotal.toFixed(2)}</span>
                        </div>
                        ${tax > 0 ? `
                        <div class="summary-row">
                            <span>Tax (${(this.billSettings.taxRate * 100)}%):</span>
                            <span>${this.billSettings.currency}${tax.toFixed(2)}</span>
                        </div>
                        ` : ''}
                        ${discount > 0 ? `
                        <div class="summary-row">
                            <span>Discount (${(this.billSettings.discountRate * 100)}%):</span>
                            <span>-${this.billSettings.currency}${discount.toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="summary-row">
                            <span>Delivery Charges:</span>
                            <span>${deliveryCharge === 0 ? 'FREE' : this.billSettings.currency + deliveryCharge.toFixed(2)}</span>
                        </div>
                        <div class="summary-row total">
                            <span>Total Amount:</span>
                            <span>${this.billSettings.currency}${total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <!-- Terms and Conditions -->
                    <div class="section-title">Terms & Conditions</div>
                    <div class="bill-terms">
                        <div class="terms-text">${this.billSettings.terms}</div>
                    </div>
                </div>
                
                <!-- Footer with Website Branding -->
                <div class="bill-footer" style="background: linear-gradient(135deg, #6b0f1a, #8b2530); color: white; padding: 30px; text-align: center; border-radius: 0 0 15px 15px; margin-top: 20px;">
                    <div style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; margin-bottom: 10px;">The Nutty Choco Morsels</div>
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 15px;">Premium Bakery Delights</div>
                    <div style="font-size: 12px; opacity: 0.8; line-height: 1.6;">
                        📞 ${this.companyInfo.phone} | ✉️ ${this.companyInfo.email}<br>
                        📍 ${this.companyInfo.address}<br>
                        🌐 https://thenuttychocomorsels.in/
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; opacity: 0.7;">
                        ${this.billSettings.thankYouMessage}
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="action-buttons" style="display: flex; gap: 15px; justify-content: center; margin-top: 30px; padding: 20px;">
                    <button onclick="window.billGenerator.generatePDFBill('${orderId}')" style="background: linear-gradient(135deg, #28a745, #20c997); color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(40,167,69,0.3); transition: all 0.3s ease;">
                        📥 Download PDF
                    </button>
                    <button onclick="window.closeBill()" style="background: linear-gradient(135deg, #6b0f1a, #8b2530); color: white; border: none; padding: 15px 30px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(107,15,26,0.3); transition: all 0.3s ease;">
                        🔙 Back to Tracking
                    </button>
                </div>
            </div>
            
            <script>
                // Keyboard shortcuts for bill page
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        window.closeBill();
                    }
                });
                
                // Store that we came from tracking
                sessionStorage.setItem('cameFromTracking', 'true');
                
                console.log('Bill page loaded successfully');
            </script>
        </body>
        </html>`;
    }

    // --- 2. GENERATE ITEMS TABLE ROWS ---
    generateItemsRows(items) {
        if (!items || !Array.isArray(items)) {
            return '<tr><td colspan="4" style="text-align: center;">No items found</td></tr>';
        }

        return items.map(item => `
            <tr>
                <td class="item-name">${item.name || 'Unknown Item'}</td>
                <td class="item-quantity">${item.qty || 1}</td>
                <td class="item-price">${this.billSettings.currency}${(item.price || 0).toFixed(2)}</td>
                <td class="item-total">${this.billSettings.currency}${((item.price || 0) * (item.qty || 1)).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    // --- 3. CALCULATION FUNCTIONS ---
    calculateSubtotal(items) {
        if (!items || !Array.isArray(items)) return 0;
        
        return items.reduce((total, item) => {
            return total + ((item.price || 0) * (item.qty || 1));
        }, 0);
    }

    calculateTax(subtotal) {
        return subtotal * this.billSettings.taxRate;
    }

    calculateDiscount(subtotal) {
        return subtotal * this.billSettings.discountRate;
    }

    // --- 4. GENERATE AND DISPLAY BILL ---
    async generateBill(orderId) {
        try {
            // Show loading state with website theme
            const loadingHTML = `
                <div style="min-height: 100vh; background: linear-gradient(135deg, #f5f5f5, #e8e8e8); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px;">
                    <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(107,15,26,0.1); text-align: center; max-width: 400px; width: 100%;">
                        <div style="font-size: 64px; margin-bottom: 20px;">🧾</div>
                        <h3 style="color: #6b0f1a; font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 10px;">The Nutty Choco Morsels</h3>
                        <p style="color: #666; margin-bottom: 20px;">Generating your bill...</p>
                        <div style="margin: 20px 0;">
                            <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #6b0f1a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        </div>
                        <p style="color: #999; font-size: 14px;">Please wait while we prepare your bill</p>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </div>
            `;
            
            document.body.innerHTML = loadingHTML;

            // Fetch order data from Firebase
            const orderDoc = await db.collection("orders").doc(orderId).get();
            
            if (!orderDoc.exists) {
                throw new Error('Order not found');
            }

            const orderData = orderDoc.data();
            
            // Generate bill HTML
            const billHTML = this.generateBillHTML(orderData, orderId);
            
            // Display bill
            document.body.innerHTML = billHTML;
            
            // Update page title
            document.title = `Bill - ${orderId}`;
            
            console.log(`Bill generated successfully for order: ${orderId}`);
            
        } catch (error) {
            console.error('Error generating bill:', error);
            
            // Show error message
            document.body.innerHTML = `
                <div style="text-align: center; padding: 50px; max-width: 500px; margin: 100px auto;">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <h2>Bill Generation Failed</h2>
                    <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                    <button onclick="window.history.back()" style="background: #6b0f1a; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                        Go Back
                    </button>
                </div>
            `;
        }
    }

    // --- 5. SHARE BILL VIA WHATSAPP ---
    shareBillViaWhatsApp(orderId, orderData) {
        const subtotal = this.calculateSubtotal(orderData.items);
        const total = orderData.totalAmount || subtotal;
        
        const message = `🧾 *BILL - The Nutty Choco Morsels* 🧾
        
📋 Bill No: #${orderId.toUpperCase()}
📅 Date: ${new Date().toLocaleDateString('en-IN')}
👤 Customer: ${orderData.userName}
📞 Phone: ${orderData.phone}

🛍️ *Order Details:*
${orderData.items.map(item => `• ${item.qty}x ${item.name} = ₹${(item.price * item.qty).toFixed(2)}`).join('\n')}

💰 *Total Amount: ₹${total.toFixed(2)}*
📊 Status: ${orderData.status}

Thank you for choosing The Nutty Choco Morsels! 🍰`;

        const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');
    }

    // --- 6. EMAIL BILL ---
    async emailBill(orderId, orderData, recipientEmail) {
        try {
            // This would require backend email service
            // For now, we'll open email client with pre-filled content
            const subject = `Bill - The Nutty Choco Morsels - Order #${orderId.toUpperCase()}`;
            const body = `Dear ${orderData.userName},

Please find your bill details below:

Bill No: #${orderId.toUpperCase()}
Date: ${new Date().toLocaleDateString('en-IN')}
Total Amount: ₹${orderData.totalAmount}

For detailed bill, please visit our website or check your WhatsApp.

Thank you for choosing The Nutty Choco Morsels!

Best regards,
Team TNCM`;

            window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Failed to send email. Please try again.');
        }
    }
}

// --- 7. GLOBAL BILL FUNCTIONS ---
// These functions are available globally for bill interactions

window.downloadBill = function(orderId) {
    console.log('Downloading bill for:', orderId);
    
    // Method 1: Direct print with better instructions
    const printWindow = window.open('', '_blank');
    printWindow.document.write(document.documentElement.innerHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};

window.closeBill = function() {
    console.log('Closing bill and going back to tracking');
    
    // Check if we came from tracking page
    const referrer = document.referrer;
    const fromTracking = sessionStorage.getItem('cameFromTracking');
    
    if (referrer.includes('tracking.html') || fromTracking === 'true') {
        // Go back to tracking page with the same order ID
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id') || urlParams.get('orderId');
        
        if (orderId) {
            window.location.href = 'tracking.html?id=' + orderId;
        } else {
            window.location.href = 'tracking.html';
        }
    } else {
        // Try to get order ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id') || urlParams.get('orderId');
        
        if (orderId) {
            window.location.href = 'tracking.html?id=' + orderId;
        } else {
            // Fallback: go to home page
            window.location.href = 'index.html';
        }
    }
};

// --- 8. BILL GENERATION SYSTEM ---
window.billGenerator = new BillGenerator();

// Generate bill for specific order
window.generateBill = function(orderId) {
    window.billGenerator.generateBill(orderId);
};

// Share bill via WhatsApp
window.shareBillWhatsApp = function(orderId) {
    db.collection("orders").doc(orderId).get().then(doc => {
        if (doc.exists) {
            window.billGenerator.shareBillViaWhatsApp(orderId, doc.data());
        }
    });
};

// Email bill
window.emailBill = function(orderId, email) {
    db.collection("orders").doc(orderId).get().then(doc => {
        if (doc.exists) {
            window.billGenerator.emailBill(orderId, doc.data(), email);
        }
    });
};

console.log('Bill generation system loaded successfully!');
