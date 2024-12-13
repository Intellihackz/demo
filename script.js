document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resumeInput = document.getElementById('resume');
    const folderInput = document.getElementById('folderUpload');
    const requirementsForm = document.getElementById('requirementsForm');
    const addRequirementBtn = document.getElementById('addRequirement');
    const resultsDiv = document.getElementById('results');
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingDiv = document.getElementById('loading');
    const parsedContentDiv = document.getElementById('parsedContent');
    const parsedTextElement = document.getElementById('parsedText');
    const editContentBtn = document.getElementById('editContent');
    const fileListDiv = document.getElementById('fileList');
    const fileListContent = document.getElementById('fileListContent');
    const fileCountSpan = document.getElementById('fileCount');
    const clearFilesBtn = document.getElementById('clearFiles');
    const currentFileName = document.getElementById('currentFileName');
    const prevFileBtn = document.getElementById('prevFile');
    const nextFileBtn = document.getElementById('nextFile');
    const exportPDFBtn = document.getElementById('exportPDF');

    let requirementCounter = 0;
    let uploadedFiles = [];
    let currentFileIndex = 0;
    let parsedContents = new Map(); // Store parsed contents for each file

    // Handle file selection
    resumeInput.addEventListener('change', (event) => {
        handleFileSelection(Array.from(event.target.files));
    });

    // Handle folder selection
    folderInput.addEventListener('change', (event) => {
        const files = Array.from(event.target.files).filter(file => file.name.toLowerCase().endsWith('.pdf'));
        handleFileSelection(files);
    });

    // Clear files button
    clearFilesBtn.addEventListener('click', () => {
        uploadedFiles = [];
        parsedContents.clear();
        currentFileIndex = 0;
        updateFileList();
        parsedContentDiv.classList.add('hidden');
        resultsDiv.classList.add('hidden');
        resumeInput.value = '';
        folderInput.value = '';
    });

    // Navigation buttons
    prevFileBtn.addEventListener('click', () => {
        if (currentFileIndex > 0) {
            currentFileIndex--;
            showCurrentFile();
        }
    });

    nextFileBtn.addEventListener('click', () => {
        if (currentFileIndex < uploadedFiles.length - 1) {
            currentFileIndex++;
            showCurrentFile();
        }
    });

    async function handleFileSelection(files) {
        if (files.length === 0) return;

        loadingDiv.classList.remove('hidden');
        
        // Add new files to the list
        uploadedFiles = [...uploadedFiles, ...files];
        
        // Update file list display
        updateFileList();
        
        // Parse all new files
        for (const file of files) {
            try {
                const content = await parsePDFFile(file);
                parsedContents.set(file.name, content);
            } catch (error) {
                console.error(`Error parsing ${file.name}:`, error);
            }
        }

        loadingDiv.classList.add('hidden');
        
        // Show the first file if this is the first upload
        if (uploadedFiles.length === files.length) {
            currentFileIndex = 0;
            showCurrentFile();
        }
    }

    function updateFileList() {
        if (uploadedFiles.length === 0) {
            fileListDiv.classList.add('hidden');
            return;
        }

        fileListDiv.classList.remove('hidden');
        fileCountSpan.textContent = uploadedFiles.length;
        
        fileListContent.innerHTML = uploadedFiles.map((file, index) => `
            <div class="flex items-center justify-between p-2 ${index === currentFileIndex ? 'bg-blue-50' : 'bg-gray-50'} rounded">
                <span class="text-sm truncate flex-1">${file.name}</span>
                <button class="delete-file text-red-500 hover:text-red-700 ml-2" data-index="${index}">×</button>
            </div>
        `).join('');

        // Add delete handlers
        fileListContent.querySelectorAll('.delete-file').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                parsedContents.delete(uploadedFiles[index].name);
                uploadedFiles.splice(index, 1);
                if (currentFileIndex >= uploadedFiles.length) {
                    currentFileIndex = Math.max(0, uploadedFiles.length - 1);
                }
                updateFileList();
                if (uploadedFiles.length > 0) {
                    showCurrentFile();
                } else {
                    parsedContentDiv.classList.add('hidden');
                }
            });
        });
    }

    function showCurrentFile() {
        if (uploadedFiles.length === 0) return;

        const currentFile = uploadedFiles[currentFileIndex];
        const content = parsedContents.get(currentFile.name);

        currentFileName.textContent = currentFile.name;
        parsedTextElement.textContent = content;
        parsedContentDiv.classList.remove('hidden');

        // Update navigation buttons
        prevFileBtn.disabled = currentFileIndex === 0;
        nextFileBtn.disabled = currentFileIndex === uploadedFiles.length - 1;
        prevFileBtn.classList.toggle('opacity-50', prevFileBtn.disabled);
        nextFileBtn.classList.toggle('opacity-50', nextFileBtn.disabled);
    }

    // Handle adding new requirement fields
    addRequirementBtn.addEventListener('click', () => {
        const requirementDiv = document.createElement('div');
        requirementDiv.className = 'flex items-center space-x-2';
        requirementCounter++;

        requirementDiv.innerHTML = `
            <div class="flex-1">
                <input type="text" 
                    placeholder="Label (e.g., skill, location)" 
                    class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    name="label_${requirementCounter}">
            </div>
            <div class="flex-1">
                <input type="text" 
                    placeholder="Value (e.g., Python, New York)" 
                    class="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                    name="value_${requirementCounter}">
            </div>
            <button class="delete-requirement text-red-500 hover:text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        `;

        requirementsForm.appendChild(requirementDiv);

        // Add delete handler
        requirementDiv.querySelector('.delete-requirement').addEventListener('click', () => {
            requirementDiv.remove();
        });
    });

    // Add initial requirement field
    addRequirementBtn.click();

    // Allow editing of parsed content
    editContentBtn.addEventListener('click', () => {
        const textarea = document.createElement('textarea');
        textarea.value = parsedTextElement.textContent;
        textarea.className = 'w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 h-60';
        parsedTextElement.replaceWith(textarea);
        
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save Changes';
        saveBtn.className = 'mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600';
        
        saveBtn.onclick = () => {
            parsedContents.set(uploadedFiles[currentFileIndex].name, textarea.value);
            parsedTextElement.textContent = textarea.value;
            textarea.replaceWith(parsedTextElement);
            editContentBtn.classList.remove('hidden');
            saveBtn.remove();
        };
        
        editContentBtn.classList.add('hidden');
        editContentBtn.parentElement.appendChild(saveBtn);
    });

    analyzeBtn.addEventListener('click', async () => {
        if (uploadedFiles.length === 0) {
            alert('Please upload at least one resume');
            return;
        }

        const requirements = [];
        const requirementInputs = requirementsForm.querySelectorAll('div > input');
        
        for (let i = 0; i < requirementInputs.length; i += 2) {
            const label = requirementInputs[i].value.trim();
            const value = requirementInputs[i + 1].value.trim();
            
            if (label && value) {
                requirements.push({ label, value });
            }
        }

        if (requirements.length === 0) {
            alert('Please add at least one job requirement');
            return;
        }

        loadingDiv.classList.remove('hidden');
        resultsDiv.classList.add('hidden');
        resultsContainer.innerHTML = '';

        try {
            // Analyze each resume
            for (let i = 0; i < uploadedFiles.length; i++) {
                const file = uploadedFiles[i];
                const content = parsedContents.get(file.name);
                
                const analysis = await analyzeResume(content, requirements);
                displayFileResults(file.name, analysis);
            }
            
            resultsDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Error analyzing resumes:', error);
            alert('An error occurred while analyzing the resumes');
        } finally {
            loadingDiv.classList.add('hidden');
        }
    });

    function displayFileResults(fileName, analysis) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'p-4 bg-white rounded-lg shadow';
        
        resultDiv.innerHTML = `
            <div class="mb-4 border-b pb-2">
                <h3 class="text-lg font-semibold">${fileName}</h3>
                <div class="flex items-center justify-between mt-2">
                    <span class="text-gray-600">Match Score:</span>
                    <span class="text-xl font-bold text-blue-600">${analysis.matchScore}%</span>
                </div>
            </div>
            
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold mb-2">Suggestions for Improvement:</h4>
                    ${analysis.suggestions.map(suggestion => `
                        <div class="p-2 bg-blue-50 rounded mb-2">
                            <p class="text-gray-700">• ${suggestion}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Matching Requirements:</h4>
                    <div class="p-2 bg-green-50 rounded">
                        <p class="text-gray-700">${analysis.matchingSkills.join(', ') || 'None'}</p>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-2">Missing Requirements:</h4>
                    <div class="p-2 bg-yellow-50 rounded">
                        <p class="text-gray-700">${analysis.missingSkills.join(', ') || 'None'}</p>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(resultDiv);
    }

    exportPDFBtn.addEventListener('click', async () => {
        // Create a new div for the PDF content
        const pdfContent = document.createElement('div');
        pdfContent.className = 'p-8 bg-white';

        // Add header with timestamp
        const header = document.createElement('div');
        header.innerHTML = `
            <h1 class="text-2xl font-bold mb-4">Resume Analysis Report</h1>
            <p class="text-gray-600 mb-6">Generated on: ${new Date().toLocaleString()}</p>
        `;
        pdfContent.appendChild(header);

        // Add requirements section
        const requirementsSection = document.createElement('div');
        requirementsSection.className = 'mb-8';
        const requirements = [];
        const requirementInputs = requirementsForm.querySelectorAll('div > input');
        for (let i = 0; i < requirementInputs.length; i += 2) {
            const label = requirementInputs[i].value.trim();
            const value = requirementInputs[i + 1].value.trim();
            if (label && value) {
                requirements.push({ label, value });
            }
        }

        requirementsSection.innerHTML = `
            <h2 class="text-xl font-bold mb-2">Job Requirements</h2>
            <div class="space-y-1">
                ${requirements.map(req => `
                    <div class="flex">
                        <span class="font-semibold min-w-[120px]">${req.label}:</span>
                        <span>${req.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
        pdfContent.appendChild(requirementsSection);

        // Add results for each resume
        const resultsSection = document.createElement('div');
        resultsSection.className = 'space-y-8';
        resultsSection.innerHTML = `
            <h2 class="text-xl font-bold mb-4">Analysis Results</h2>
            ${Array.from(resultsContainer.children).map(resultDiv => `
                <div class="border-t pt-4">
                    <h3 class="text-lg font-bold mb-2">${resultDiv.querySelector('h3').textContent}</h3>
                    
                    <div class="mb-4">
                        <span class="font-semibold">Match Score:</span>
                        <span class="text-lg text-blue-600 font-bold">
                            ${resultDiv.querySelector('.text-xl.font-bold').textContent}
                        </span>
                    </div>

                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Suggestions for Improvement:</h4>
                        ${Array.from(resultDiv.querySelectorAll('.bg-blue-50 p')).map(p => `
                            <div class="mb-1">${p.textContent}</div>
                        `).join('')}
                    </div>

                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Matching Requirements:</h4>
                        <div class="bg-green-50 p-2 rounded">
                            ${resultDiv.querySelector('.bg-green-50 p').textContent}
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Missing Requirements:</h4>
                        <div class="bg-yellow-50 p-2 rounded">
                            ${resultDiv.querySelector('.bg-yellow-50 p').textContent}
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
        pdfContent.appendChild(resultsSection);

        // Configure PDF options
        const opt = {
            margin: 1,
            filename: 'resume-analysis-report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Show loading state
        exportPDFBtn.disabled = true;
        exportPDFBtn.innerHTML = `
            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating PDF...
        `;

        try {
            // Generate PDF
            await html2pdf().set(opt).from(pdfContent).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            // Restore button state
            exportPDFBtn.disabled = false;
            exportPDFBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export to PDF
            `;
        }
    });

    // PDF parsing function
    async function parsePDFFile(file) {
        return new Promise(async (resolve, reject) => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }
                
                resolve(fullText.trim());
            } catch (error) {
                reject(error);
            }
        });
    }

    // Mistral AI analysis function
    async function analyzeResume(resumeText, requirements) {
        // Format requirements for the prompt
        const formattedRequirements = requirements
            .map(req => `${req.label}: ${req.value}`)
            .join('\n');

        const prompt = `
            Analyze this resume against the following job requirements. Return a JSON object with:
            {
                "matchScore": <number 0-100>,
                "suggestions": [<string array of specific improvements>],
                "matchingSkills": [<string array of matching requirements>],
                "missingSkills": [<string array of missing requirements>]
            }

            Resume:
            ${resumeText}

            Job Requirements:
            ${formattedRequirements}
        `;

        try {
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${config.MISTRAL_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(errorData.message || 'API request failed');
            }

            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (error) {
            console.error('Error calling Mistral AI:', error);
            throw error;
        }
    }
});
