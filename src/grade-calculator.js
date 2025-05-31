(function() {
    'use strict';

    const EXCLUDED_ROW_STYLE = "background-color: #B0E0E6";
    const GWA_LABEL_TEXT = "General Weighted Average:";
    const GPA_LABEL_TEXT_IN_ROW = "GPA"; 
    const EDIT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>`;

    function parseGrade(gradeStr) {
        if (typeof gradeStr !== 'string') return null;
        const trimmedGradeStr = gradeStr.trim().toUpperCase();
        if (trimmedGradeStr === "NG" || trimmedGradeStr === "INC") {
            return null;
        }
        const num = parseFloat(trimmedGradeStr);
        if (!isNaN(num) && num >= 1.0 && num <= 5.0) {
            return num;
        }
        return null;
    }

    function isRowExcluded(row) {
        const styleAttr = row.getAttribute('style');
        return styleAttr && styleAttr.includes(EXCLUDED_ROW_STYLE);
    }

    function calculateAndUpdateGPA(table, semesterName) {
        console.log(`\n--- Calculating GPA for: ${semesterName} ---`);
        let totalWeightedGrade = 0;
        let totalUnitsForGPA = 0;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) {
            console.error(`No tbody found in table for ${semesterName}. Cannot calculate GPA.`);
            return { totalWeightedGrade: 0, totalUnitsForGPA: 0, gpa: null };
        }

        const allRowsInTbody = tbody.querySelectorAll('tr');
        let gpaValueCell = null;
        let gpaRowIndex = -1;

        for (let i = allRowsInTbody.length - 1; i >= 0; i--) {
            const currentRow = allRowsInTbody[i];
            const cells = currentRow.querySelectorAll('td');
            for (let j = 0; j < cells.length; j++) {
                const boldTag = cells[j].querySelector('b');
                if (boldTag && boldTag.textContent.trim().toUpperCase() === GPA_LABEL_TEXT_IN_ROW) {
                    if (cells[j+1]) {
                        gpaValueCell = cells[j+1];
                        gpaRowIndex = i;
                        console.log(`Found GPA row for ${semesterName} at tbody row index ${gpaRowIndex}. GPA value cell:`, gpaValueCell);
                        const existingButton = gpaValueCell.querySelector('.grade-edit-button');
                        if (existingButton) existingButton.remove();
                        gpaValueCell.textContent = '';
                    }
                    break;
                }
            }
            if (gpaValueCell) break;
        }

        // iterate through rows for grade calculation, EXCLUDING the GPA row
        allRowsInTbody.forEach((row, rowIndex) => {
            if (rowIndex === gpaRowIndex) {
                console.log(`Row ${rowIndex + 1}: Identified as GPA summary row, skipping for grade calculation.`);
                return; 
            }
            if (isRowExcluded(row)) {
                console.log(`Row ${rowIndex + 1}: Excluded (Style: ${EXCLUDED_ROW_STYLE})`);
                return;
            }

            const cells = row.querySelectorAll('td');
            if (cells.length < 5) { 
                console.log(`Row ${rowIndex + 1}: Not a typical course grade row (cell count: ${cells.length}), skipping for grade calculation.`);
                return;
            }

            const courseCode = cells[0].textContent.trim();
            const unitText = cells[2].textContent.trim();
            const fgCell = cells[4]; 
            let fgTextToParse = '';

            if (fgCell.firstChild && fgCell.firstChild.nodeType === Node.TEXT_NODE) {
                fgTextToParse = fgCell.firstChild.nodeValue.trim();
            } else { 
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = fgCell.innerHTML;
                const button = tempDiv.querySelector('.grade-edit-button');
                if (button) button.remove();
                fgTextToParse = tempDiv.textContent.trim();
            }

            const units = parseFloat(unitText);
            const fgGrade = parseGrade(fgTextToParse);
            console.log(`Row ${rowIndex + 1} (${courseCode}): Units='${unitText}' (parsed: ${units}), FG='${fgTextToParse}' (parsed: ${fgGrade})`);

            if (!isNaN(units) && units > 0 && fgGrade !== null) {
                totalWeightedGrade += units * fgGrade;
                totalUnitsForGPA += units;
            } else {
                console.log(`  -> Course NOT added to GPA calc.`);
            }
        });

        const gpa = totalUnitsForGPA > 0 ? (totalWeightedGrade / totalUnitsForGPA) : null;
        const gpaDisplayValue = gpa !== null ? gpa.toFixed(2) : "N/A";
        console.log(`Final for ${semesterName}: Total Weighted Grade = ${totalWeightedGrade}, Total Units for GPA = ${totalUnitsForGPA}`);
        console.log(`Calculated GPA for ${semesterName}: ${gpaDisplayValue}`);

        if (gpaValueCell) {
            gpaValueCell.appendChild(document.createTextNode(gpaDisplayValue + '   ')); 
            gpaValueCell.style.whiteSpace = 'nowrap'; 
            console.log(`Updated GPA display for ${semesterName} to: ${gpaDisplayValue}`);
        } else {
            console.error(`Could not find GPA display VALUE CELL in tbody for ${semesterName}.`);
        }
        return { totalWeightedGrade, totalUnitsForGPA, gpa };
    }

    function calculateAndUpdateGWA(allTablesData) {
        console.log("\n--- Calculating GWA ---");
        let grandTotalWeightedGrade = 0;
        let grandTotalUnitsForGWA = 0;
        allTablesData.forEach((semesterData, index) => {
            if (semesterData && semesterData.gpa !== null) {
                grandTotalWeightedGrade += semesterData.totalWeightedGrade;
                grandTotalUnitsForGWA += semesterData.totalUnitsForGPA;
            }
        });
        const gwa = grandTotalUnitsForGWA > 0 ? (grandTotalWeightedGrade / grandTotalUnitsForGWA) : null;
        const gwaDisplayValue = gwa !== null ? gwa.toFixed(2) : "N/A";
        let gwaLabelCell = Array.from(document.querySelectorAll('td')).find(td => td.textContent.trim().includes(GWA_LABEL_TEXT));
        if (gwaLabelCell && gwaLabelCell.nextElementSibling && gwaLabelCell.nextElementSibling.querySelector('b')) {
            gwaLabelCell.nextElementSibling.querySelector('b').textContent = gwaDisplayValue;
        } else {
            console.warn("GWA cell structure not found.");
        }
    }
    
    function addEditButton(fgCell, table, semesterName) {
        if (!fgCell.closest('tbody')) { 
            console.warn("Attempted to add edit button outside of tbody. Skipping for cell:", fgCell);
            return;
        }
        // additional check: ensure this fgCell is not part of the GPA summary row
        // this is a bit heuristic, but we can check if the row contains the GPA label
        const parentRow = fgCell.closest('tr');
        if (parentRow) {
            const cellsInParentRow = parentRow.querySelectorAll('td');
            for (const cell of cellsInParentRow) {
                const boldTag = cell.querySelector('b');
                if (boldTag && boldTag.textContent.trim().toUpperCase() === GPA_LABEL_TEXT_IN_ROW) {
                    console.warn("Attempted to add edit button to a cell in the GPA summary row. Skipping for cell:", fgCell);
                    return; 
                }
            }
        }


        if (fgCell.querySelector('.grade-edit-button')) {
            return; 
        }
        console.log("Adding edit button to FG cell:", fgCell.textContent.trim(), "in", semesterName);

        const editButton = document.createElement('button');
        editButton.innerHTML = EDIT_ICON_SVG;
        editButton.classList.add('grade-edit-button');
        editButton.style.marginLeft = '5px';
        editButton.style.padding = '0px 2px';
        editButton.style.border = 'none';
        editButton.style.background = 'none';
        editButton.style.cursor = 'pointer';
        editButton.style.verticalAlign = 'middle';
        editButton.title = 'Edit Grade';
        editButton.onmouseover = () => { editButton.style.opacity = '0.7'; };
        editButton.onmouseout = () => { editButton.style.opacity = '1'; };

        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            let currentGradeForPrompt = '';
            if (fgCell.firstChild && fgCell.firstChild.nodeType === Node.TEXT_NODE) {
                currentGradeForPrompt = fgCell.firstChild.nodeValue.trim();
            } else {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = fgCell.innerHTML;
                const btn = tempDiv.querySelector('.grade-edit-button');
                if (btn) btn.remove();
                currentGradeForPrompt = tempDiv.textContent.trim();
            }
            const courseDescCell = fgCell.closest('tr').cells[1];
            const courseDesc = courseDescCell ? courseDescCell.textContent.trim() : 'this course';
            const newGradeStr = prompt(`Enter new Final Grade for ${courseDesc} (${semesterName}):`, currentGradeForPrompt);

            if (newGradeStr === null) return;
            let newGradeDisplayValue = '';
            const parsedNum = parseFloat(newGradeStr);

            if (newGradeStr.trim().toUpperCase() === "NG" || newGradeStr.trim().toUpperCase() === "INC") {
                newGradeDisplayValue = newGradeStr.trim().toUpperCase();
            } else if (!isNaN(parsedNum) && parsedNum >= 1.0 && parsedNum <= 5.0) {
                newGradeDisplayValue = parsedNum.toFixed(1);
            } else {
                alert('Invalid grade. Please enter a number between 1.0 and 5.0, or NG/INC.');
                return;
            }

            if (fgCell.firstChild && fgCell.firstChild.nodeType === Node.TEXT_NODE) {
                fgCell.firstChild.nodeValue = newGradeDisplayValue + '   ';
            } else {
                Array.from(fgCell.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) fgCell.removeChild(node);
                });
                fgCell.insertBefore(document.createTextNode(newGradeDisplayValue + '   '), fgCell.firstChild);
            }

            const semesterTables = findSemesterTables(); 
            const allSemesterData = [];
            semesterTables.forEach(semTableData => {
                allSemesterData.push(calculateAndUpdateGPA(semTableData.table, semTableData.name));
            });
            calculateAndUpdateGWA(allSemesterData);
        });

        let gradeText = '';
        if (fgCell.firstChild && fgCell.firstChild.nodeType === Node.TEXT_NODE) {
            gradeText = fgCell.firstChild.nodeValue.trim();
        } else {
            gradeText = fgCell.textContent.trim();
        }
        
        fgCell.textContent = '';
        fgCell.appendChild(document.createTextNode(gradeText + '   '));
        fgCell.appendChild(editButton);
        fgCell.style.whiteSpace = 'nowrap';
    }

    function findSemesterTables() {
        const tablesData = [];
        const semesterHeaders = document.querySelectorAll('div.portlet-body center > h4 > b'); 

        semesterHeaders.forEach(headerElement => {
            const headerText = headerElement.textContent.trim();
            if (headerText.includes("SEMESTER - 20")) {
                let Sibling = headerElement.closest('center').nextElementSibling;
                while(Sibling && Sibling.tagName !== 'TABLE') {
                    Sibling = Sibling.nextElementSibling;
                }
                if (Sibling && Sibling.tagName === 'TABLE' && Sibling.classList.contains('table-forum')) {
                    if (!Array.from(Sibling.querySelectorAll('td')).some(td => td.textContent.trim().includes(GWA_LABEL_TEXT))) {
                         tablesData.push({ table: Sibling, name: headerText });
                         console.log(`Found semester table via header: ${headerText}`);
                    } else {
                        console.log(`Table after header ${headerText} is GWA table, skipping.`);
                    }
                } else {
                     console.log(`No valid table found after header: ${headerText}`);
                }
            }
        });
        
        if (tablesData.length === 0) {
            console.warn("Primary semester table selector (via headers) failed. Using fallback selector.");
            const allPotentialTables = document.querySelectorAll('#PrList .portlet-body .table-forum.table-hover');
            allPotentialTables.forEach(tableEl => {
                const tbody = tableEl.querySelector('tbody');
                if (tbody && !Array.from(tableEl.querySelectorAll('td')).some(td => td.textContent.trim().includes(GWA_LABEL_TEXT))) {
                    const tbodyRows = tbody.querySelectorAll('tr');
                    if (tbodyRows.length > 0) {
                        for (let i = Math.max(0, tbodyRows.length - 3); i < tbodyRows.length; i++) {
                            const cells = tbodyRows[i].querySelectorAll('td');
                            let hasGpaLabel = false;
                            for(const cell of cells) {
                                const boldTag = cell.querySelector('b');
                                if (boldTag && boldTag.textContent.trim().toUpperCase() === GPA_LABEL_TEXT_IN_ROW) {
                                    hasGpaLabel = true;
                                    break;
                                }
                            }
                            if (hasGpaLabel) {
                                let name = `Semester Table (Fallback ${tablesData.length + 1})`;
                                let prevHeaderContainer = tableEl.previousElementSibling;
                                while(prevHeaderContainer && (prevHeaderContainer.tagName !== 'CENTER' || !prevHeaderContainer.querySelector('h4 > b'))) {
                                    prevHeaderContainer = prevHeaderContainer.previousElementSibling;
                                }
                                if (prevHeaderContainer && prevHeaderContainer.querySelector('h4 > b')) {
                                    const potentialName = prevHeaderContainer.querySelector('h4 > b').textContent.trim();
                                    if (potentialName.includes("SEMESTER - 20")) name = potentialName;
                                }
                                tablesData.push({table: tableEl, name: name});
                                console.log(`Found semester table via fallback: ${name}`);
                                break; 
                            }
                        }
                    }
                }
            });
             if (tablesData.length > 2) { 
                console.warn(`Fallback found ${tablesData.length} tables, taking first 2.`);
                tablesData.splice(2);
             }
        }
        console.log(`findSemesterTables finally identified ${tablesData.length} tables suitable for GPA processing.`);
        return tablesData.filter(td => td.table.querySelector('tbody'));
    }

    function initializeGradeEditor() {
        console.log("Initializing grade editor script...");
        const semesterTablesData = findSemesterTables();

        if (semesterTablesData.length === 0) {
            console.error("Could not find any suitable semester grade tables. Script will not run.");
            return;
        }
        
        const allSemesterCalcData = [];

        semesterTablesData.forEach((data) => {
            const { table, name } = data;
            console.log(`Processing table for GPA calculation and edit buttons: ${name}`);
            
            const tbody = table.querySelector('tbody');
            if (!tbody) {
                console.error(`Table for ${name} does not have a tbody. Skipping.`);
                return;
            }
            const allTbodyRows = Array.from(tbody.querySelectorAll('tr'));
            
            let gpaSummaryRowIndex = -1;
            for (let i = allTbodyRows.length - 1; i >= 0; i--) {
                 const cells = allTbodyRows[i].querySelectorAll('td');
                 for (const cell of cells) {
                     const boldTag = cell.querySelector('b');
                     if (boldTag && boldTag.textContent.trim().toUpperCase() === GPA_LABEL_TEXT_IN_ROW) {
                         gpaSummaryRowIndex = i;
                         break;
                     }
                 }
                 if (gpaSummaryRowIndex !== -1) break;
            }

            allTbodyRows.forEach((row, rowIndex) => {
                if (rowIndex === gpaSummaryRowIndex) return; 

                const cells = row.querySelectorAll('td');
                if (cells.length >= 5) { 
                    const fgCell = cells[4]; 
                    if (fgCell) {
                        addEditButton(fgCell, table, name);
                    }
                }
            });
            allSemesterCalcData.push(calculateAndUpdateGPA(table, name));
        });
        
        if(allSemesterCalcData.length > 0) {
            calculateAndUpdateGWA(allSemesterCalcData);
        }
        console.log("Grade editor initialization complete.");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGradeEditor);
    } else {
        setTimeout(initializeGradeEditor, 200); 
    }

})();