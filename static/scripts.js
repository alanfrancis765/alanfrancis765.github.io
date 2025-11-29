// API Configuration
const API_BASE_URL = "https://exoplanet-backend-4-v31o.onrender.com/api";

// Method Switching
const methodButtons = document.querySelectorAll('.method-btn');
const inputSections = document.querySelectorAll('.input-section');

methodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const method = btn.getAttribute('data-method');
        
        // Update active button
        methodButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding input section
        inputSections.forEach(section => {
            section.classList.remove('active');
        });
        
        if (method === 'manual') {
            document.getElementById('manualInput').classList.add('active');
        } else {
            document.getElementById('csvInput').classList.add('active');
        }
        
        // Hide results
        document.getElementById('resultsSection').style.display = 'none';
    });
});

// Manual Form Submission
const manualForm = document.getElementById('manualForm');
manualForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        koi_fpflag_nt: parseInt(document.getElementById('koi_fpflag_nt').value),
        koi_fpflag_ss: parseInt(document.getElementById('koi_fpflag_ss').value),
        koi_fpflag_co: parseInt(document.getElementById('koi_fpflag_co').value),
        koi_fpflag_ec: parseInt(document.getElementById('koi_fpflag_ec').value),
        koi_period: parseFloat(document.getElementById('koi_period').value),
        koi_duration: parseFloat(document.getElementById('koi_duration').value),
        koi_depth: parseFloat(document.getElementById('koi_depth').value),
        koi_impact: parseFloat(document.getElementById('koi_impact').value),
        koi_prad: parseFloat(document.getElementById('koi_prad').value),
        koi_teq: parseFloat(document.getElementById('koi_teq').value),
        koi_insol: parseFloat(document.getElementById('koi_insol').value),
        koi_steff: parseFloat(document.getElementById('koi_steff').value),
        koi_slogg: parseFloat(document.getElementById('koi_slogg').value),
        koi_srad: parseFloat(document.getElementById('koi_srad').value),
        koi_model_snr: parseFloat(document.getElementById('koi_model_snr').value)
    };
    
    // Show loading state
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displaySingleResult(result);
        } else {
            showError(result.error || 'An error occurred during prediction');
        }
    } catch (error) {
        showError('Failed to connect to the server. Make sure Flask is running on port 5000.');
        console.error('Error:', error);
    }
});

// CSV Upload Handling
const uploadArea = document.getElementById('uploadArea');
const csvFileInput = document.getElementById('csvFile');
const csvInfo = document.getElementById('csvInfo');
const fileName = document.getElementById('fileName');
const fileDetails = document.getElementById('fileDetails');
const processCSVBtn = document.getElementById('processCSV');

let selectedFile = null;

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/csv') {
        handleCSVFile(files[0]);
    } else {
        showError('Please upload a valid CSV file');
    }
});

// File input
csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleCSVFile(file);
    }
});

// Handle CSV file selection
function handleCSVFile(file) {
    selectedFile = file;
    
    // Display file info
    fileName.textContent = file.name;
    fileDetails.textContent = `File size: ${(file.size / 1024).toFixed(2)} KB`;
    csvInfo.style.display = 'block';
    uploadArea.style.display = 'none';
}

// Process CSV button
processCSVBtn.addEventListener('click', async () => {
    if (!selectedFile) {
        showError('No file selected');
        return;
    }
    
    // Show loading state
    showLoading();
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
        const response = await fetch(`${API_BASE_URL}/predict-batch`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayMultipleResults(result);
        } else {
            showError(result.error || 'An error occurred during batch prediction');
        }
    } catch (error) {
        showError('Failed to connect to the server. Make sure Flask is running on port 5000.');
        console.error('Error:', error);
    }
});

// Display single result
function displaySingleResult(result) {
    const resultSection = document.getElementById("resultsSection");
    const resultContainer = document.getElementById("resultsContent");
    
    resultSection.style.display = "block";

    resultContainer.innerHTML = `
        <div class="result-card">
            <h3>Prediction Result</h3>
            
            <p><strong>${result.prediction}</strong></p>
            <p>${result.confidence}% Confidence</p>

            ${result.probabilities ? `
            <div class="probabilities-section">
                <h4>Class Probabilities:</h4>
                <div class="prob-bars">
                    ${Object.entries(result.probabilities).map(([label, value]) => `
                        <div class="prob-item">
                            <span class="prob-label">${label}</span>
                            <div class="prob-bar-container">
                                <div class="prob-bar" 
                                    style="width: ${value}%; 
                                           background: ${
                                               label.toLowerCase().includes('false') 
                                               ? 'var(--danger-color)'
                                               : label.toLowerCase().includes('confirm')
                                               ? 'var(--success-color)'
                                               : 'var(--warning-color)'
                                           };
                                    ">
                                </div>
                            </div>
                            <span class="prob-value">${value}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}
// Display multiple results
function displayMultipleResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    
    const { results, summary, total_records } = data;
    
    let resultsHTML = `
        <div class="summary">
            <h3>Batch Analysis Summary</h3>
            <div class="summary-stats">
                <div class="stat-box">
                    <div class="stat-value">${summary.total}</div>
                    <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value candidate">${summary.candidates || 0}</div>
                    <div class="stat-label">Candidates</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value exoplanet">${summary.exoplanets}</div>
                    <div class="stat-label">Confirmed</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value false-positive">${summary.false_positives}</div>
                    <div class="stat-label">False Positives</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${summary.exoplanet_percentage}%</div>
                    <div class="stat-label">Confirmation Rate</div>
                </div>
                <div class="stat-box">
                    <div class="stat-value">${summary.average_confidence}%</div>
                    <div class="stat-label">Avg Confidence</div>
                </div>
            </div>
        </div>
    `;
    
    // Display first 10 results in detail
    const displayLimit = Math.min(10, results.length);
    for (let i = 0; i < displayLimit; i++) {
        const result = results[i];
        const isExoplanet = result.prediction === 'Confirmed Exoplanet';
        const isCandidate = result.prediction === 'Candidate';
        const confidenceClass = result.confidence > 75 ? 'confidence-high' : 
                               result.confidence > 50 ? 'confidence-medium' : 'confidence-low';
        
        let iconSVG, resultClass;
        if (isExoplanet) {
            resultClass = 'exoplanet';
            iconSVG = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>`;
        } else if (isCandidate) {
            resultClass = 'candidate';
            iconSVG = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>`;
        } else {
            resultClass = 'false-positive';
            iconSVG = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>`;
        }
        
        const inputData = result.input_data;
        
        resultsHTML += `
            <div class="result-item ${resultClass}">
                <div class="result-header">
                    <div class="result-label ${resultClass}">
                        ${iconSVG}
                        Record #${i + 1}: ${result.prediction}
                    </div>
                    <div class="confidence-badge ${confidenceClass}">
                        ${result.confidence}% Confidence
                    </div>
                </div>
                <div class="result-data">
                    <div class="data-point">
                        <label>Orbital Period</label>
                        <span>${inputData.koi_period.toFixed(4)} days</span>
                    </div>
                    <div class="data-point">
                        <label>Planetary Radius</label>
                        <span>${inputData.koi_prad.toFixed(3)} R⊕</span>
                    </div>
                    <div class="data-point">
                        <label>Equilibrium Temp</label>
                        <span>${inputData.koi_teq.toFixed(1)} K</span>
                    </div>
                    <div class="data-point">
                        <label>Signal-to-Noise</label>
                        <span>${inputData.koi_model_snr.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (results.length > displayLimit) {
        resultsHTML += `
            <div class="result-item">
                <p style="text-align: center; color: var(--text-secondary); margin: 0;">
                    ... and ${results.length - displayLimit} more results
                </p>
            </div>
        `;
    }
    
    resultsContent.innerHTML = resultsHTML;
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show loading state
function showLoading() {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin-top: 20px; color: var(--text-secondary);">Analyzing data...</p>
        </div>
    `;
    
    resultsSection.style.display = 'block';
}

// Show error message
function showError(message) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContent = document.getElementById('resultsContent');
    
    resultsContent.innerHTML = `
        <div class="result-item false-positive">
            <div class="result-header">
                <div class="result-label false-positive">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Error
                </div>
            </div>
            <p style="margin-top: 15px;">${message}</p>
        </div>
    `;
    
    resultsSection.style.display = 'block';
}

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
