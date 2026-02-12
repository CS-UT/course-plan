/**
 * Browser Console Scraper for UT EMS Report #212
 *
 * USAGE:
 * 1. Open Chrome and navigate to:
 *    https://ems2.ut.ac.ir/browser/fa/#/pages?fid=212&ftype=1&seq=0&subfrm=&sguid=a14c4d27-9c7d-474d-a8fa-77ba71cb171e&TrmType=2#212
 * 2. Log in with your SSO credentials
 * 3. Wait for the first page of data to load
 * 4. Open Chrome DevTools (F12) → Console tab
 * 5. Paste the entire contents of this script and press Enter
 * 6. Wait for it to iterate through all pages
 * 7. A JSON file will be automatically downloaded
 *
 * The script will:
 * - Read the current page's table data
 * - Navigate through all pages
 * - Parse course info, sessions, exam dates
 * - Download a courses.json file
 */

// ---- PASTE EVERYTHING BELOW INTO THE BROWSER CONSOLE ----

(async function scrapeCourses() {
  const DELAY = 2000; // ms between page navigations

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function parseSessionsText(text) {
    // Example: "درس(ت): شنبه 13:00-15:00، دوشنبه 13:00-15:00"
    // Example: "درس(ت): یک شنبه 08:00-10:00"
    const sessions = [];
    const dayMap = {
      'شنبه': 6,
      'یک شنبه': 0, 'یکشنبه': 0,
      'دوشنبه': 1, 'دو شنبه': 1,
      'سه شنبه': 2, 'سه‌شنبه': 2,
      'چهارشنبه': 3, 'چهار شنبه': 3,
      'پنجشنبه': 4, 'پنج شنبه': 4,
      'جمعه': 5,
    };

    // Match patterns like "شنبه 13:00-15:00"
    const dayPattern = /(شنبه|یک\s?شنبه|یکشنبه|دو\s?شنبه|دوشنبه|سه\s?شنبه|سه‌شنبه|چهار\s?شنبه|چهارشنبه|پنج\s?شنبه|پنجشنبه|جمعه)\s+(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;

    let match;
    while ((match = dayPattern.exec(text)) !== null) {
      const dayName = match[1].trim();
      // Normalize: if it starts with a specific day but could match 'شنبه' alone, check longer patterns first
      let dayOfWeek = null;
      for (const [name, num] of Object.entries(dayMap)) {
        if (dayName === name || dayName.replace(/\s/g, '') === name.replace(/\s/g, '')) {
          dayOfWeek = num;
          break;
        }
      }
      // Special case: plain "شنبه" should be 6, but we need to make sure it's not part of a compound day
      if (dayOfWeek === null && dayName === 'شنبه') {
        dayOfWeek = 6;
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
    // Example: "امتحان(1405.04.20) ساعت : 10:00-10:00"
    const examMatch = text.match(/امتحان\s*\((\d{4})[./](\d{2})[./](\d{2})\)\s*ساعت\s*:\s*(\d{1,2}:\d{2})/);
    if (examMatch) {
      return {
        examDate: `${examMatch[1]}/${examMatch[2]}/${examMatch[3]}`,
        examTime: examMatch[4].padStart(5, '0'),
      };
    }
    return { examDate: '', examTime: '' };
  }

  function persianToEnglish(str) {
    const persianNums = '۰۱۲۳۴۵۶۷۸۹';
    const arabicNums = '٠١٢٣٤٥٦٧٨٩';
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(new RegExp(persianNums[i], 'g'), String(i));
      result = result.replace(new RegExp(arabicNums[i], 'g'), String(i));
    }
    return result;
  }

  function parseTableRow(row) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 8) return null;

    // Column mapping based on the screenshot:
    // 0: شماره و گروه (courseCode_group)
    // 1: نام درس
    // 2: واحد (کل / ع / فیت)
    // 3: جنسیت
    // 4: نام استاد
    // 5: ساعات ارائه و امتحان
    // 6: محل
    // 7: دروس پیش نیاز، همنیاز، متضاد و معادل
    // 8: توضیحات

    const codeGroupText = persianToEnglish(cells[0]?.textContent?.trim() || '');
    const codeGroupMatch = codeGroupText.match(/(\d+)[_-](\d+)/);
    if (!codeGroupMatch) return null;

    const courseCode = codeGroupMatch[1];
    const group = parseInt(codeGroupMatch[2], 10);
    const courseName = cells[1]?.textContent?.trim() || '';

    // Parse units - try to get the total units
    const unitText = persianToEnglish(cells[2]?.textContent?.trim() || '0');
    const unitMatch = unitText.match(/(\d+)/);
    const unitCount = unitMatch ? parseInt(unitMatch[1], 10) : 0;

    // Gender
    const genderText = cells[3]?.textContent?.trim() || '';
    let gender = 'mixed';
    if (genderText.includes('مرد')) gender = 'male';
    else if (genderText.includes('زن')) gender = 'female';
    else gender = 'mixed';

    const professor = cells[4]?.textContent?.trim() || '';

    // Sessions and exam
    const scheduleText = persianToEnglish(cells[5]?.textContent?.trim() || '');
    const sessions = parseSessionsText(scheduleText);
    const { examDate, examTime } = parseExamText(scheduleText);

    const location = cells[6]?.textContent?.trim() || '';
    const prerequisites = cells[7]?.textContent?.trim() || '';
    const notes = cells[8]?.textContent?.trim() || '';

    // Try to determine capacity from text (if available in UI)
    // The screenshot shows ظرفیت column - adjust index if needed

    return {
      courseCode,
      group,
      courseName,
      unitCount,
      capacity: 0,
      enrolled: 0,
      gender,
      professor,
      sessions,
      examDate,
      examTime,
      location,
      prerequisites,
      notes,
      grade: 'کارشناسی',
    };
  }

  // Find the grid/table
  function getTableRows() {
    // Try different selectors that the EMS system might use
    const selectors = [
      'table tbody tr',
      '.smart-grid-row',
      '[role="row"]',
      '.data-row',
    ];

    for (const sel of selectors) {
      const rows = document.querySelectorAll(sel);
      if (rows.length > 0) return rows;
    }
    return [];
  }

  function getPageInfo() {
    // Look for pagination info like "صفحه 1 از 22"
    const pageText = document.body.innerText;
    const match = pageText.match(/صفحه\s*(\d+)\s*از\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }
    // Try English number patterns
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    for (const input of inputs) {
      const val = persianToEnglish(input.value);
      if (/^\d+$/.test(val)) {
        const totalMatch = document.body.innerText.match(/از\s*(\d+)/);
        if (totalMatch) {
          return { current: parseInt(val), total: parseInt(persianToEnglish(totalMatch[1])) };
        }
      }
    }
    return null;
  }

  function clickNextPage() {
    // Look for next page button
    const selectors = [
      'button[title*="بعد"]',
      'button[title*="next"]',
      '.page-next',
      '[aria-label*="next"]',
      '[aria-label*="بعد"]',
    ];

    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) { btn.click(); return true; }
    }

    // Try finding by icon/text
    const buttons = document.querySelectorAll('button, a, [role="button"]');
    for (const btn of buttons) {
      const text = btn.textContent?.trim();
      if (text === '>' || text === '›' || text === '▶') {
        btn.click();
        return true;
      }
    }

    return false;
  }

  console.log('🔍 Starting course scraper...');
  console.log('📄 Reading page data...');

  const allCourses = [];
  const pageInfo = getPageInfo();
  const totalPages = pageInfo?.total || 1;

  console.log(`📊 Found ${totalPages} pages to scrape`);

  for (let page = 1; page <= totalPages; page++) {
    console.log(`📄 Scraping page ${page}/${totalPages}...`);

    await sleep(DELAY);

    const rows = getTableRows();
    let pageCount = 0;

    for (const row of rows) {
      const course = parseTableRow(row);
      if (course) {
        allCourses.push(course);
        pageCount++;
      }
    }

    console.log(`  ✅ Found ${pageCount} courses on this page`);

    if (page < totalPages) {
      const navigated = clickNextPage();
      if (!navigated) {
        console.warn(`  ⚠️ Could not navigate to next page. Stopping at page ${page}`);
        break;
      }
    }
  }

  console.log(`\n🎉 Done! Total courses: ${allCourses.length}`);

  // Build the output JSON
  const output = {
    semester: "14042",
    semesterLabel: "نیمسال دوم ۱۴۰۴-۱۴۰۵",
    fetchedAt: new Date().toISOString(),
    department: "دانشکده ریاضی، آمار و علوم کامپیوتر",
    courses: allCourses,
  };

  // Download as JSON file
  const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'courses.json';
  a.click();
  URL.revokeObjectURL(url);

  console.log('💾 Downloaded courses.json');
  console.log('📋 Copy the file to: src/data/courses.json');

  return output;
})();
