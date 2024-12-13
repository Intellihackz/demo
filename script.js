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

    // Constants for API
    const API_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    // Utility Functions
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Handle file selection
    resumeInput.addEventListener('change', async (event) => {
        try {
            await handleFileSelection(Array.from(event.target.files));
        } catch (error) {
            alert(`Error uploading files: ${error.message}`);
        }
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
        resultDiv.className = 'p-6 bg-white rounded-lg shadow-md transform transition-all duration-300 hover:shadow-lg';
        resultDiv.style.opacity = '0';
        
        resultDiv.innerHTML = `
            <div class="mb-4 border-b pb-4">
                <h3 class="text-xl font-semibold text-gray-800">${fileName}</h3>
                <div class="flex items-center justify-between mt-3">
                    <span class="text-gray-600 font-medium">Match Score:</span>
                    <div class="flex items-center">
                        <div class="w-24 h-2 bg-gray-200 rounded-full mr-3">
                            <div class="h-full bg-blue-600 rounded-full" style="width: ${analysis.matchScore}%"></div>
                        </div>
                        <span class="text-xl font-bold text-blue-600">${analysis.matchScore}%</span>
                    </div>
                </div>
            </div>
            
            <div class="space-y-4">
                <div>
                    <h4 class="font-semibold text-gray-700 mb-2">Suggestions for Improvement:</h4>
                    <ul class="space-y-2">
                        ${analysis.suggestions.map(suggestion => `
                            <li class="flex items-start">
                                <span class="text-blue-500 mr-2">•</span>
                                <span class="text-gray-700">${suggestion}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Matching Requirements:</h4>
                        <div class="p-3 bg-green-50 rounded-lg">
                            ${analysis.matchingSkills.length > 0 
                                ? analysis.matchingSkills.map(skill => `
                                    <span class="inline-block bg-green-100 text-green-800 px-2 py-1 rounded m-1">
                                        ${skill}
                                    </span>
                                `).join('')
                                : '<span class="text-gray-500">None found</span>'
                            }
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Missing Requirements:</h4>
                        <div class="p-3 bg-yellow-50 rounded-lg">
                            ${analysis.missingSkills.length > 0 
                                ? analysis.missingSkills.map(skill => `
                                    <span class="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded m-1">
                                        ${skill}
                                    </span>
                                `).join('')
                                : '<span class="text-gray-500">None missing</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(resultDiv);
        
        // Animate the result card
        requestAnimationFrame(() => {
            resultDiv.style.opacity = '1';
        });
    }

    exportPDFBtn.addEventListener('click', async () => {
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
            // Create a temporary container and append it to the document
            const pdfContent = document.createElement('div');
            pdfContent.className = 'p-8 bg-white fixed top-0 left-0 right-0 bottom-0 z-[-1]';
            document.body.appendChild(pdfContent);

            // Add header
            pdfContent.innerHTML = `
                <div class="mb-8">
                    <h1 class="text-3xl font-bold mb-2">Resume Analysis Report</h1>
                    <p class="text-gray-600">Generated on: ${new Date().toLocaleString()}</p>
                </div>
            `;

            // Add requirements section
            const requirements = [];
            const requirementInputs = requirementsForm.querySelectorAll('div > input');
            for (let i = 0; i < requirementInputs.length; i += 2) {
                const label = requirementInputs[i].value.trim();
                const value = requirementInputs[i + 1].value.trim();
                if (label && value) {
                    requirements.push({ label, value });
                }
            }

            if (requirements.length > 0) {
                pdfContent.innerHTML += `
                    <div class="mb-8">
                        <h2 class="text-2xl font-bold mb-4">Job Requirements</h2>
                        <div class="space-y-2">
                            ${requirements.map(req => `
                                <div class="flex">
                                    <span class="font-semibold min-w-[150px]">${req.label}:</span>
                                    <span>${req.value}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Add results section
            const results = Array.from(resultsContainer.children);
            if (results.length > 0) {
                pdfContent.innerHTML += `
                    <div>
                        <h2 class="text-2xl font-bold mb-4">Analysis Results</h2>
                        <div class="space-y-8">
                            ${results.map(result => {
                                const fileName = result.querySelector('h3').textContent;
                                const matchScore = result.querySelector('.text-xl.font-bold').textContent;
                                const suggestions = Array.from(result.querySelectorAll('ul li span:last-child'))
                                    .map(span => span.textContent);
                                const matchingSkills = Array.from(result.querySelectorAll('.bg-green-50 .bg-green-100'))
                                    .map(span => span.textContent.trim());
                                const missingSkills = Array.from(result.querySelectorAll('.bg-yellow-50 .bg-yellow-100'))
                                    .map(span => span.textContent.trim());

                                return `
                                    <div class="border-t pt-4">
                                        <h3 class="text-xl font-bold mb-2">${fileName}</h3>
                                        <div class="mb-4">
                                            <span class="font-semibold">Match Score:</span>
                                            <span class="text-blue-600 font-bold ml-2">${matchScore}</span>
                                        </div>
                                        
                                        <div class="mb-4">
                                            <h4 class="font-semibold mb-2">Suggestions for Improvement:</h4>
                                            <ul class="list-disc pl-5 space-y-1">
                                                ${suggestions.map(s => `<li>${s}</li>`).join('')}
                                            </ul>
                                        </div>

                                        <div class="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 class="font-semibold mb-2">Matching Requirements:</h4>
                                                <div class="p-3 bg-green-50 rounded">
                                                    ${matchingSkills.length ? matchingSkills.join(', ') : 'None found'}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 class="font-semibold mb-2">Missing Requirements:</h4>
                                                <div class="p-3 bg-yellow-50 rounded">
                                                    ${missingSkills.length ? missingSkills.join(', ') : 'None missing'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }

            // Configure PDF options
            const opt = {
                margin: 10,
                filename: 'resume-analysis-report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    windowWidth: pdfContent.scrollWidth
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait'
                },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // Generate PDF
            await html2pdf().set(opt).from(pdfContent).save();

            // Clean up - remove the temporary element
            document.body.removeChild(pdfContent);

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
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            
            const totalPages = pdf.numPages;
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ')
                    .replace(/\s+/g, ' '); // Normalize whitespace
                fullText += pageText + '\n\n';
            }
            
            return fullText.trim();
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error(`Failed to parse PDF: ${file.name}`);
        }
    }

    // Mistral AI analysis function
    async function analyzeResume(resumeText, requirements, retries = MAX_RETRIES) {
        const prompt = `
            Act as an expert resume analyzer. Analyze this resume against the following job requirements.
            Provide a detailed analysis including:
            1. An overall match score (0-100)
            2. Specific matching skills/requirements found
            3. Missing requirements
            4. Detailed suggestions for improvement
            
            Resume Content:
            ${resumeText}

            Job Requirements:
            ${requirements.map(req => `${req.label}: ${req.value}`).join('\n')}

            Provide the analysis in the following JSON format:
            {
                "matchScore": number,
                "matchingSkills": string[],
                "missingSkills": string[],
                "suggestions": string[]
            }
        `;

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.MISTRAL_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (error) {
            if (retries > 0) {
                await sleep(RETRY_DELAY);
                return analyzeResume(resumeText, requirements, retries - 1);
            }
            throw error;
        }
    }

    // Add drag and drop support
    const uploadZone = document.querySelector('.upload-zone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    uploadZone.addEventListener('dragenter', () => {
        uploadZone.classList.add('border-blue-500');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('border-blue-500');
    });

    uploadZone.addEventListener('drop', async (e) => {
        uploadZone.classList.remove('border-blue-500');
        const files = Array.from(e.dataTransfer.files).filter(file => file.name.toLowerCase().endsWith('.pdf'));
        if (files.length > 0) {
            try {
                await handleFileSelection(files);
            } catch (error) {
                alert(`Error uploading files: ${error.message}`);
            }
        }
    });
});
