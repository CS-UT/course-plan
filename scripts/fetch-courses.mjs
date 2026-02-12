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
 * 8. Copy it to src/data/gathered_data/ and run: node scripts/merge-courses.mjs
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

  // Normalize Arabic ↔ Persian character variants so day-name matching is
  // insensitive to the exact encoding EMS happens to use.
  function normalizePersian(str) {
    return str
      .replace(/ي/g, 'ی')   // Arabic yeh  → Persian yeh
      .replace(/ك/g, 'ک')   // Arabic kaf  → Persian kaf
      .replace(/ؤ/g, 'و')   // Arabic waw with hamza
      .replace(/أ/g, 'ا')   // Arabic alef with hamza
      .replace(/إ/g, 'ا')   // Arabic alef with hamza below
      .replace(/ة/g, 'ه')   // Arabic taa marbuta → heh
      .replace(/[\s\u200c\u00a0]+/g, ' ') // collapse all whitespace, ZWNJ, NBSP
      .trim();
  }

  // Ensure "XYZشنبه" always becomes "XYZ شنبه" (space before شنبه)
  function normalizeDayName(str) {
    return normalizePersian(str).replace(/(\S)شنبه/, '$1 شنبه');
  }

  function parseSessionsText(text) {
    const sessions = [];
    const dayMap = {
      'پنج شنبه': 4,
      'چهار شنبه': 3,
      'سه شنبه': 2,
      'دو شنبه': 1,
      'یک شنبه': 0,
      'شنبه': 6,
      'جمعه': 5,
    };

    const normalized = normalizePersian(persianToEnglish(text));

    // Match day + time patterns; longer day names first to avoid partial matches
    const dayPattern = /(پنج\s?شنبه|چهار\s?شنبه|سه\s?شنبه|دو\s?شنبه|یک\s?شنبه|شنبه|جمعه)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

    let match;
    while ((match = dayPattern.exec(normalized)) !== null) {
      const rawDay = normalizeDayName(match[1]);
      const dayOfWeek = dayMap[rawDay];

      if (dayOfWeek !== undefined) {
        sessions.push(`${dayOfWeek} ${match[2].padStart(5, '0')}-${match[3].padStart(5, '0')}`);
      }
    }
    return sessions;
  }

  function parseExamText(text) {
    const examMatch = text.match(
      /امتحان\s*\((\d{4})[./](\d{2})[./](\d{2})\)\s*ساعت\s*:\s*(\d{1,2}:\d{2})/
    );
    if (examMatch) {
      return `${examMatch[1]}/${examMatch[2]}/${examMatch[3]} ${examMatch[4].padStart(5, '0')}`;
    }
    return '';
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
    let gender = 'مخت';
    if (genderText.includes('مرد') || genderText.includes('برادر')) gender = 'پسران';
    else if (genderText.includes('زن') || genderText.includes('خواهر')) gender = 'دختران';

    const professor = cells[6]?.textContent?.trim() || '';

    const scheduleText = persianToEnglish(cells[7]?.textContent?.trim() || '');
    const sessions = parseSessionsText(scheduleText);
    const exam = parseExamText(scheduleText);

    const location = cells[8]?.textContent?.trim() || '';

    const out = {
      code: courseCode, group, name: courseName, units: unitCount,
      professor, gender, sessions,
    };
    if (exam) out.exam = exam;
    if (capacity) out.capacity = capacity;
    if (location) out.location = location;

    return out;
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
    // NpGrid VM uses: currpage (1-based), pagecount
    const vm = getNpGridVM();
    if (vm) {
      const current = typeof vm.currpage === 'function' ? vm.currpage() : null;
      const total = typeof vm.pagecount === 'function' ? vm.pagecount() : null;
      if (current != null && total != null) {
        console.log(`  [VM] currpage=${current}, pagecount=${total}, LinePerPage=${typeof vm.LinePerPage === 'function' ? vm.LinePerPage() : '?'}`);
        return { current, total }; // currpage is 1-based
      }
    }

    // Fallback: parse page text
    const bodyText = persianToEnglish(document.body.innerText);
    const match = bodyText.match(/صفحه\s*(\d+)\s*از\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }

    return null;
  }

  function goToPage(pageNum) {
    // pageNum is 1-based (matching currpage convention)
    const vm = getNpGridVM();
    if (vm && typeof vm.currpage === 'function') {
      vm.currpage(pageNum);
      return true;
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

  for (let page = 1; page <= totalPages; page++) {
    console.log(`Scraping page ${page}/${totalPages}...`);

    // Navigate to the target page (skip for first page, we're already there)
    if (page > 1) {
      const currentRows = getTableRows();
      const prevFirstCell = currentRows[0]?.querySelector('td')?.textContent?.trim();

      const navigated = goToPage(page);
      if (!navigated) {
        console.warn(`Could not navigate to page ${page}. Stopping.`);
        break;
      }

      // Wait for new data
      const changed = await waitForTableChange(prevFirstCell);
      if (!changed) {
        console.warn(`Page ${page} did not load in time. Waiting longer...`);
        await sleep(DELAY * 2);

        // Check again
        const rows2 = getTableRows();
        const nowFirst = rows2[0]?.querySelector('td')?.textContent?.trim();
        if (nowFirst === prevFirstCell) {
          console.warn(`Page ${page} still shows same data. Stopping.`);
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
          const key = `${course.code}-${course.group}`;
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
  }

  const coursesArray = Array.from(allCourses.values());
  console.log(`\nDone! Total unique courses: ${coursesArray.length}`);

  const output = coursesArray;

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
  console.log('Copy the file to: src/data/gathered_data/ then run: node scripts/merge-courses.mjs');

  return output;
})();
