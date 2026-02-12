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
    // Example: "درس(ت): شنبه 13:00-15:00، دوشنبه 13:00-15:00"
    // Example: "درس(ع): یک شنبه 08:00-10:00"
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

    // Match day + time patterns; use longer day names first to avoid partial matches
    const dayPattern = /(پنج\s?شنبه|پنجشنبه|چهار\s?شنبه|چهارشنبه|سه[\s‌]?شنبه|سهشنبه|دو\s?شنبه|دوشنبه|یک\s?شنبه|يک\s?شنبه|یکشنبه|يكشنبه|شنبه|جمعه)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

    let match;
    while ((match = dayPattern.exec(text)) !== null) {
      const rawDay = match[1].trim();
      let dayOfWeek = null;

      // Normalize spaces and zero-width non-joiners for matching
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
    // Patterns seen in EMS:
    // "امتحان(1405.04.20) ساعت : 10:00-12:00"
    // "امتحان(1405/04/20) ساعت : 10:00"
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

    // --- col 0: شماره و گروه درس ---
    const codeGroupText = persianToEnglish(cells[0]?.textContent?.trim() || '');
    const codeGroupMatch = codeGroupText.match(/(\d+)[_\-–](\d+)/);
    if (!codeGroupMatch) return null;

    const courseCode = codeGroupMatch[1];
    const group = parseInt(codeGroupMatch[2], 10);

    // --- col 1: نام درس ---
    const courseName = cells[1]?.textContent?.trim() || '';
    if (!courseName) return null;

    // --- col 2: واحد کل ---
    const unitText = persianToEnglish(cells[2]?.textContent?.trim() || '0');
    const unitMatch = unitText.match(/(\d+)/);
    const unitCount = unitMatch ? parseInt(unitMatch[1], 10) : 0;

    // --- col 3: واحد عملی (skip, we only need total) ---

    // --- col 4: ظرفیت ---
    const capacityText = persianToEnglish(cells[4]?.textContent?.trim() || '0');
    const capacityMatch = capacityText.match(/(\d+)/);
    const capacity = capacityMatch ? parseInt(capacityMatch[1], 10) : 0;

    // --- col 5: جنسیت ---
    const genderText = cells[5]?.textContent?.trim() || '';
    let gender = 'mixed';
    if (genderText.includes('مرد') || genderText.includes('برادر')) gender = 'male';
    else if (genderText.includes('زن') || genderText.includes('خواهر')) gender = 'female';

    // --- col 6: نام استاد ---
    const professor = cells[6]?.textContent?.trim() || '';

    // --- col 7: ساعات ارائه و امتحان ---
    const scheduleText = persianToEnglish(cells[7]?.textContent?.trim() || '');
    const sessions = parseSessionsText(scheduleText);
    const { examDate, examTime } = parseExamText(scheduleText);

    // --- col 8: محل ---
    const location = cells[8]?.textContent?.trim() || '';

    // --- col 9: دروس پیش‌نیاز ---
    const prerequisites = cells[9]?.textContent?.trim() || '';

    // --- col 10: توضیحات / مقطع ---
    const notesRaw = cells[10]?.textContent?.trim() || '';

    // Try to extract grade from notes or default
    let grade = '';
    if (notesRaw.includes('کارشناسی ارشد') || notesRaw.includes('ارشد')) {
      grade = 'کارشناسی ارشد';
    } else if (notesRaw.includes('دکتر') || notesRaw.includes('دکتری')) {
      grade = 'دکتری';
    } else if (notesRaw.includes('کارشناسی')) {
      grade = 'کارشناسی';
    }

    return {
      courseCode,
      group,
      courseName,
      unitCount,
      capacity,
      enrolled: 0,
      gender,
      professor,
      sessions,
      examDate,
      examTime,
      location,
      prerequisites,
      notes: notesRaw,
      grade,
    };
  }

  // --- NpGrid-specific table row selector ---
  function getTableRows() {
    // NpGrid renders data rows inside .np-grid-content table tbody
    const contentArea = document.querySelector('.np-grid-content, .ui-npgrid');
    if (contentArea) {
      // Get only data rows (not header rows)
      const headerTable = contentArea.querySelector('.npgrid-table-header');
      const allTables = contentArea.querySelectorAll('table');
      for (const table of allTables) {
        if (table === headerTable) continue;
        const rows = table.querySelectorAll('tbody tr');
        if (rows.length > 0) return rows;
      }
    }

    // Fallback: any table with enough columns
    const allRows = document.querySelectorAll('table tbody tr');
    const dataRows = [];
    for (const row of allRows) {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 9) dataRows.push(row);
    }
    return dataRows;
  }

  // --- NpGrid pagination ---
  function getPageInfo() {
    const bodyText = persianToEnglish(document.body.innerText);

    // Pattern: "صفحه X از Y" or just numbers in pagination area
    const match = bodyText.match(/صفحه\s*(\d+)\s*از\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }

    // NpGrid often uses an input for current page + "از N" label
    const pagerArea = document.querySelector('.np-grid-pager, .npgrid-pager, [class*="pager"]');
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

    // Try all inputs in the page
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      const parent = input.closest('div, span, td');
      if (!parent) continue;
      const parentText = persianToEnglish(parent.textContent || '');
      const totalMatch = parentText.match(/از\s*(\d+)/);
      if (totalMatch) {
        const val = parseInt(persianToEnglish(input.value));
        if (val > 0) {
          return { current: val, total: parseInt(totalMatch[1]) };
        }
      }
    }

    return null;
  }

  function clickNextPage() {
    // NpGrid navigation buttons
    const selectors = [
      '.np-grid-pager button[title*="بعد"]',
      '.np-grid-pager button[title*="next"]',
      '.npgrid-pager button[title*="بعد"]',
      '[class*="pager"] button[title*="بعد"]',
      'button[title*="بعد"]',
      'button[title*="next"]',
      'a[title*="بعد"]',
    ];

    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn && !btn.disabled) { btn.click(); return true; }
    }

    // Try NpGrid's KO-bound navigation; look for arrow icons/buttons
    const allBtns = document.querySelectorAll('button, a, [role="button"], .np-btn, [class*="page"]');
    for (const btn of allBtns) {
      const title = (btn.getAttribute('title') || '').trim();
      const text = btn.textContent?.trim();
      // Left arrow in RTL = next page
      if (title.includes('بعد') || title.includes('Next') ||
          text === '‹' || text === '<' || text === '\u25C0' ||
          btn.querySelector('.fa-chevron-left, .fa-angle-left, [class*="left"]')) {
        if (!btn.disabled && !btn.classList.contains('disabled')) {
          btn.click();
          return true;
        }
      }
    }

    return false;
  }

  // --- Wait for table to be ready after page change ---
  async function waitForTableLoad(previousFirstCell) {
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      const rows = getTableRows();
      if (rows.length > 0) {
        const firstCell = rows[0]?.querySelector('td')?.textContent?.trim();
        // If the content changed or we don't have a reference, table has loaded
        if (!previousFirstCell || firstCell !== previousFirstCell) {
          return true;
        }
      }
    }
    return false;
  }

  console.log('Starting course scraper for EMS Report #212...');
  console.log('Reading page data...');

  const allCourses = new Map(); // keyed by courseCode-group to avoid duplicates
  const pageInfo = getPageInfo();
  const totalPages = pageInfo?.total || 1;

  console.log(`Found ${totalPages} page(s) to scrape`);

  for (let page = 1; page <= totalPages; page++) {
    console.log(`Scraping page ${page}/${totalPages}...`);

    // Small initial delay for first page, longer for subsequent
    if (page === 1) await sleep(500);

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

    console.log(`  Found ${pageCount} new courses on page ${page} (total so far: ${allCourses.size})`);

    if (page < totalPages) {
      // Remember first cell to detect page change
      const firstCell = rows[0]?.querySelector('td')?.textContent?.trim();
      const navigated = clickNextPage();
      if (!navigated) {
        console.warn(`Could not navigate to next page. Stopping at page ${page}`);
        break;
      }
      // Wait for the new page data to load
      const loaded = await waitForTableLoad(firstCell);
      if (!loaded) {
        console.warn(`Page ${page + 1} did not load in time. Continuing anyway...`);
        await sleep(DELAY);
      }
    }
  }

  const coursesArray = Array.from(allCourses.values());
  console.log(`\nDone! Total unique courses: ${coursesArray.length}`);

  // Build the output JSON
  const output = {
    semester: '14042',
    semesterLabel: 'نیمسال دوم ۱۴۰۴-۱۴۰۵',
    fetchedAt: new Date().toISOString(),
    department: 'دانشکده ریاضی، آمار و علوم کامپیوتر',
    courses: coursesArray,
  };

  // Download as JSON file
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
