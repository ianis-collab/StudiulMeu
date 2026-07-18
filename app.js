document.addEventListener('DOMContentLoaded', () => {
    const selectYear = document.getElementById('select-year');
    const selectMonth = document.getElementById('select-month');
    const tbody = document.getElementById('schedule-tbody');
    const btnPrint = document.getElementById('btn-print');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const printHeaderSubtitle = document.getElementById('print-header-subtitle');

    const monthsRo = [
        'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ];

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            `;
        } else {
            themeIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            `;
        }
    }

    // Populate Years (Current Year +/- 1 Year)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 1; y <= currentYear + 2; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        selectYear.appendChild(option);
    }

    // Set Current Month
    const currentMonth = new Date().getMonth();
    selectMonth.value = currentMonth;

    // Load and Generate Table
    function generateSchedule() {
        const year = parseInt(selectYear.value);
        const month = parseInt(selectMonth.value);

        // Update print subtitle
        printHeaderSubtitle.textContent = `Luna: ${monthsRo[month]} ${year}`;

        tbody.innerHTML = '';

        // Get all weeks containing days of this month
        const weeks = getWeeksOfMonth(year, month);

        weeks.forEach((week, index) => {
            const tr = document.createElement('tr');

            // Format week range text
            const rangeText = formatWeekRange(week.start, week.end);

            // Generate Tuesday Cell Data
            const marKey = `service-${year}-${month}-${index}-mar`;
            const marVal = localStorage.getItem(marKey) || '';
            const marDateText = formatDateLabel(week.tuesday, 'Mar');

            // Generate Friday Cell Data
            const vinKey = `service-${year}-${month}-${index}-vin`;
            const vinVal = localStorage.getItem(vinKey) || '';
            const vinDateText = formatDateLabel(week.friday, 'Vin');

            // Generate Saturday Cell Data
            const samKey = `service-${year}-${month}-${index}-sam`;
            const samVal = localStorage.getItem(samKey) || '';
            const samDateText = formatDateLabel(week.saturday, 'Sâm');

            tr.innerHTML = `
                <td class="col-date">${rangeText}</td>
                <td>
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">
                        ${marDateText}
                    </div>
                    <input type="text" class="input-editable" data-key="${marKey}" value="${marVal}" placeholder="Adaugă conducător...">
                </td>
                <td>
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">
                        ${vinDateText}
                    </div>
                    <input type="text" class="input-editable" data-key="${vinKey}" value="${vinVal}" placeholder="Adaugă conducător...">
                </td>
                <td>
                    <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.25rem;">
                        ${samDateText}
                    </div>
                    <input type="text" class="input-editable" data-key="${samKey}" value="${samVal}" placeholder="Adaugă conducător...">
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Add input event listeners to auto-save
        document.querySelectorAll('.input-editable').forEach(input => {
            input.addEventListener('input', (e) => {
                localStorage.setItem(e.target.dataset.key, e.target.value);
            });
        });
    }

    // Helper: Get all weeks of a month (Monday to Sunday)
    function getWeeksOfMonth(year, month) {
        const weeks = [];
        // First day of the month
        let current = new Date(year, month, 1);
        // Find the Monday of the week containing the 1st of the month
        let dayOfWeek = current.getDay();
        let diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        current.setDate(current.getDate() + diffToMonday);

        // End of the month
        const endOfMonth = new Date(year, month + 1, 0);

        // Loop through weeks until we are past the end of the month
        while (current <= endOfMonth || current.getMonth() === month) {
            const startOfWeek = new Date(current);
            
            const endOfWeek = new Date(current);
            endOfWeek.setDate(endOfWeek.getDate() + 6);

            // Get exact dates for Tuesday (1), Friday (4), Saturday (5) relative to Monday (0)
            const tuesday = new Date(startOfWeek);
            tuesday.setDate(tuesday.getDate() + 1);

            const friday = new Date(startOfWeek);
            friday.setDate(friday.getDate() + 4);

            const saturday = new Date(startOfWeek);
            saturday.setDate(saturday.getDate() + 5);

            // Only add week if at least one day falls in the current month, or starts in current month
            weeks.push({
                start: startOfWeek,
                end: endOfWeek,
                tuesday,
                friday,
                saturday
            });

            // Move to next Monday
            current.setDate(current.getDate() + 7);
        }

        return weeks;
    }

    function formatWeekRange(start, end) {
        const startDay = String(start.getDate()).padStart(2, '0');
        const startMonth = monthsRo[start.getMonth()].substring(0, 3).toLowerCase();
        const endDay = String(end.getDate()).padStart(2, '0');
        const endMonth = monthsRo[end.getMonth()].substring(0, 3).toLowerCase();
        
        if (start.getMonth() === end.getMonth()) {
            return `${startDay} - ${endDay} ${monthsRo[start.getMonth()]}`;
        } else {
            return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
        }
    }

    function formatDateLabel(date, dayName) {
        const day = String(date.getDate()).padStart(2, '0');
        const monthLabel = monthsRo[date.getMonth()].substring(0, 3).toLowerCase();
        return `${dayName}, ${day} ${monthLabel}`;
    }

    // Event Listeners for Changes
    selectYear.addEventListener('change', generateSchedule);
    selectMonth.addEventListener('change', generateSchedule);

    // Print Action
    btnPrint.addEventListener('click', () => {
        window.print();
    });

    // Initial load
    generateSchedule();
});
