/**
 * Browser Console Scraper for UT EMS Report #212
 *
 * USAGE:
 * 1. Open Chrome and navigate to:
 *    https://ems2.ut.ac.ir/browser/fa/#/pages?fid=212&ftype=1&seq=0&subfrm=&sguid=a14c4d27-9c7d-474d-a8fa-77ba71cb171e&TrmType=2#212
 * 2. Log in with your SSO credentials
 * 3. Wait for the first page of data to load (you should see the course table)
 * 4. Open Chrome DevTools (F12) → Console tab
 * 5. Paste the entire contents of this script and press Enter
 * 6. Wait for it to iterate through all pages
 * 7. A courses.json file will be automatically downloaded
 *
 * NpGrid column layout (from EMS2 Beheshan report #212):
 *   col 0:  شماره و گروه درس   (90px)   — e.g. "8101234-01"
 *   col 1:  نام درس            (180px)
 *   col 2:  واحد - کل          (30px)   — total units
 *   col 3:  واحد - عملی        (30px)   — practical units
 *   col 4:  ظرفیت              (35px)   — capacity
 *   col 5:  جنسیت              (40px)
 *   col 6:  نام استاد          (140px)
 *   col 7:  ساعات ارائه و امتحان (250px)
 *   col 8:  محل                (135px)
 *   col 9:  دروس پیش‌نیاز/همنیاز (400px)
 *   col 10: توضیحات / مقطع     (140px)
 */

// ---- PASTE EVERYTHING BELOW INTO THE BROWSER CONSOLE ----

(async function scrapeCourses() {
  const DELAY = 2500; // ms between page navigations

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function persianToEnglish(str) {
    if (!str) return '';
    const persianNums = '۰۱۲۳۴۵۶۷۸۹';
    const arabicNums = '٠١٢٣٤٥٦٧٨٩';
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(new RegExp(persianNums[i], 'g'), String(i));
      result = result.replace(new RegExp(arabicNums[i], 'g'), String(i));
    }
    return result;
  }

  function parseSessionsText(text) {
    const sessions = [];
    const dayMap = {
      'شنبه': 6,
      'یکشنبه': 0, 'يكشنبه': 0, 'یک شنبه': 0, 'يک شنبه': 0,
      'دوشنبه': 1, 'دو شنبه': 1,
      'سه‌شنبه': 2, 'سه شنبه': 2, 'سهشنبه': 2,
      'چهارشنبه': 3, 'چهار شنبه': 3,
      'پنجشنبه': 4, 'پنج شنبه': 4,
      'جمعه': 5,
    };

    // Match day + time patterns; longer day names first to avoid partial matches
    const dayPattern = /(پنج\s?شنبه|پنجشنبه|چهار\s?شنبه|چهارشنبه|سه[\s‌]?شنبه|سهشنبه|دو\s?شنبه|دوشنبه|یک\s?شنبه|يک\s?شنبه|یکشنبه|يكشنبه|شنبه|جمعه)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

    let match;
    while ((match = dayPattern.exec(text)) !== null) {
      const rawDay = match[1].trim();
      let dayOfWeek = null;

      const normalized = rawDay.replace(/[\s‌]+/g, '');
      for (const [name, num] of Object.entries(dayMap)) {
        if (name.replace(/[\s‌]+/g, '') === normalized) {
          dayOfWeek = num;
          break;
        }
      }

      if (dayOfWeek !== null) {
        sessions.push({
          dayOfWeek,
          startTime: match[2].padStart(5, '0'),
          endTime: match[3].padStart(5, '0'),
        });
      }
    }
    return sessions;
  }

  function parseExamText(text) {
    const examMatch = text.match(
      /امتحان\s*\((\d{4})[./](\d{2})[./](\d{2})\)\s*ساعت\s*:\s*(\d{1,2}:\d{2})/
    );
    if (examMatch) {
      return {
        examDate: `${examMatch[1]}/${examMatch[2]}/${examMatch[3]}`,
        examTime: examMatch[4].padStart(5, '0'),
      };
    }
    return { examDate: '', examTime: '' };
  }

  function parseTableRow(row) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 9) return null;

    const codeGroupText = persianToEnglish(cells[0]?.textContent?.trim() || '');
    const codeGroupMatch = codeGroupText.match(/(\d+)[_\-–](\d+)/);
    if (!codeGroupMatch) return null;

    const courseCode = codeGroupMatch[1];
    const group = parseInt(codeGroupMatch[2], 10);
    const courseName = cells[1]?.textContent?.trim() || '';
    if (!courseName) return null;

    const unitText = persianToEnglish(cells[2]?.textContent?.trim() || '0');
    const unitMatch = unitText.match(/(\d+)/);
    const unitCount = unitMatch ? parseInt(unitMatch[1], 10) : 0;

    // col 3 = practical units (skip)

    const capacityText = persianToEnglish(cells[4]?.textContent?.trim() || '0');
    const capacityMatch = capacityText.match(/(\d+)/);
    const capacity = capacityMatch ? parseInt(capacityMatch[1], 10) : 0;

    const genderText = cells[5]?.textContent?.trim() || '';
    let gender = 'mixed';
    if (genderText.includes('مرد') || genderText.includes('برادر')) gender = 'male';
    else if (genderText.includes('زن') || genderText.includes('خواهر')) gender = 'female';

    const professor = cells[6]?.textContent?.trim() || '';

    const scheduleText = persianToEnglish(cells[7]?.textContent?.trim() || '');
    const sessions = parseSessionsText(scheduleText);
    const { examDate, examTime } = parseExamText(scheduleText);

    const location = cells[8]?.textContent?.trim() || '';
    const prerequisites = cells[9]?.textContent?.trim() || '';
    const notesRaw = cells[10]?.textContent?.trim() || '';

    let grade = '';
    if (notesRaw.includes('کارشناسی ارشد') || notesRaw.includes('ارشد')) {
      grade = 'کارشناسی ارشد';
    } else if (notesRaw.includes('دکتر') || notesRaw.includes('دکتری')) {
      grade = 'دکتری';
    } else if (notesRaw.includes('کارشناسی')) {
      grade = 'کارشناسی';
    }

    return {
      courseCode, group, courseName, unitCount, capacity,
      enrolled: 0, gender, professor, sessions, examDate,
      examTime, location, prerequisites, notes: notesRaw, grade,
    };
  }

  // ---------- NpGrid helpers ----------

  function getTableRows() {
    // NpGrid data rows are in a separate table from the header
    const grid = document.querySelector('.ui-npgrid');
    if (!grid) return [];

    const headerTable = grid.querySelector('.npgrid-table-header');
    const allTables = grid.querySelectorAll('table');
    for (const table of allTables) {
      if (table === headerTable) continue;
      const rows = table.querySelectorAll('tbody tr');
      if (rows.length > 0) return Array.from(rows);
    }

    // Fallback
    const allRows = document.querySelectorAll('table tbody tr');
    return Array.from(allRows).filter(r => r.querySelectorAll('td').length >= 9);
  }

  // Get the NpGrid Knockout ViewModel (the most reliable way to navigate)
  function getNpGridVM() {
    const grid = document.querySelector('.ui-npgrid');
    if (grid && typeof ko !== 'undefined') {
      const ctx = ko.contextFor(grid);
      if (ctx && ctx.$data) return ctx.$data;
    }
    return null;
  }

  function getPageInfo() {
    // Try KO ViewModel first
    const vm = getNpGridVM();
    if (vm) {
      const current = typeof vm.PageIndex === 'function' ? vm.PageIndex() : null;
      const total = typeof vm.PageCount === 'function' ? vm.PageCount() : null;
      if (current != null && total != null) {
        return { current: current + 1, total }; // PageIndex is 0-based
      }
    }

    // Fallback: parse page text
    const bodyText = persianToEnglish(document.body.innerText);
    const match = bodyText.match(/صفحه\s*(\d+)\s*از\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }

    // Fallback: look in pager area
    const pagerArea = document.querySelector('[class*="pager"]');
    if (pagerArea) {
      const pagerText = persianToEnglish(pagerArea.textContent || '');
      const totalMatch = pagerText.match(/از\s*(\d+)/);
      const input = pagerArea.querySelector('input');
      if (input && totalMatch) {
        return {
          current: parseInt(persianToEnglish(input.value)) || 1,
          total: parseInt(totalMatch[1]),
        };
      }
    }

    return null;
  }

  function goToPage(pageIndex) {
    // Method 1: Use KO ViewModel directly (0-based index)
    const vm = getNpGridVM();
    if (vm && typeof vm.PageIndex === 'function') {
      vm.PageIndex(pageIndex);
      return true;
    }

    // Method 2: Use the pager input field
    const pagerArea = document.querySelector('[class*="pager"]');
    if (pagerArea) {
      const input = pagerArea.querySelector('input');
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(input, String(pageIndex + 1));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Try pressing Enter to confirm
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
        return true;
      }
    }

    // Method 3: Click next button
    const nextSelectors = [
      'button[title*="بعد"]', 'button[title*="next"]', 'a[title*="بعد"]',
    ];
    for (const sel of nextSelectors) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled) { btn.click(); return true; }
    }

    // Method 4: Find arrow buttons in pager
    if (pagerArea) {
      const btns = pagerArea.querySelectorAll('button, a, span[role="button"]');
      for (const btn of btns) {
        const text = btn.textContent?.trim();
        const cls = btn.className || '';
        // In RTL, "next" arrow points left
        if (text === '‹' || text === '<' || text === '◀' ||
            cls.includes('left') || cls.includes('prev') || cls.includes('next') ||
            cls.includes('بعد')) {
          if (!btn.disabled && !btn.classList.contains('disabled')) {
            btn.click();
            return true;
          }
        }
      }
    }

    return false;
  }

  // Wait for table data to change after navigation
  async function waitForTableChange(prevFirstCellText) {
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      const rows = getTableRows();
      if (rows.length > 0) {
        const firstCell = rows[0]?.querySelector('td')?.textContent?.trim();
        if (firstCell && firstCell !== prevFirstCellText) {
          return true;
        }
      }
    }
    return false;
  }

  // ---------- Main scraping loop ----------

  console.log('Starting course scraper for EMS Report #212...');

  // Detect KO ViewModel
  const vm = getNpGridVM();
  if (vm) {
    console.log('Found NpGrid Knockout ViewModel - using direct page navigation');
  } else {
    console.log('No KO ViewModel found - will try DOM-based navigation');
  }

  console.log('Reading page data...');

  const allCourses = new Map();
  const pageInfo = getPageInfo();
  const totalPages = pageInfo?.total || 1;

  console.log(`Found ${totalPages} page(s) to scrape`);

  for (let page = 0; page < totalPages; page++) {
    const displayPage = page + 1;
    console.log(`Scraping page ${displayPage}/${totalPages}...`);

    // Navigate to the target page (skip for first page, we're already there)
    if (page > 0) {
      const currentRows = getTableRows();
      const prevFirstCell = currentRows[0]?.querySelector('td')?.textContent?.trim();

      const navigated = goToPage(page);
      if (!navigated) {
        console.warn(`Could not navigate to page ${displayPage}. Stopping.`);
        break;
      }

      // Wait for new data
      const changed = await waitForTableChange(prevFirstCell);
      if (!changed) {
        console.warn(`Page ${displayPage} did not load in time. Waiting longer...`);
        await sleep(DELAY * 2);

        // Check again
        const rows2 = getTableRows();
        const nowFirst = rows2[0]?.querySelector('td')?.textContent?.trim();
        if (nowFirst === prevFirstCell) {
          console.warn(`Page ${displayPage} still shows same data. Stopping.`);
          break;
        }
      }
    } else {
      await sleep(500);
    }

    const rows = getTableRows();
    let pageCount = 0;

    for (const row of rows) {
      try {
        const course = parseTableRow(row);
        if (course) {
          const key = `${course.courseCode}-${course.group}`;
          if (!allCourses.has(key)) {
            allCourses.set(key, course);
            pageCount++;
          }
        }
      } catch (e) {
        console.warn('Failed to parse row:', e);
      }
    }

    console.log(`  Found ${pageCount} new courses on page ${displayPage} (total so far: ${allCourses.size})`);
  }

  const coursesArray = Array.from(allCourses.values());
  console.log(`\nDone! Total unique courses: ${coursesArray.length}`);

  const output = {
    semester: '14042',
    semesterLabel: 'نیمسال دوم ۱۴۰۴-۱۴۰۵',
    fetchedAt: new Date().toISOString(),
    department: 'دانشکده ریاضی، آمار و علوم کامپیوتر',
    courses: coursesArray,
  };

  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'courses.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('Downloaded courses.json');
  console.log('Copy the file to: src/data/courses.json in the project');

  return output;
})();
