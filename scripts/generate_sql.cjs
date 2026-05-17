const xlsx = require('xlsx');
const fs = require('fs');
const crypto = require('crypto');

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

const workbook = xlsx.readFile('RB DSA sheet.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

const topicsMap = new Map(); // topicName -> { id, slug, patternsMap }
let topicOrder = 1;

for (let i = 1; i < data.length; i++) {
  const row = data[i];
  if (row.length === 0) continue;
  
  let [topicName, patternName, problemTitle, difficulty, link] = row;
  if (!topicName || !patternName || !problemTitle) continue;

  topicName = topicName.toString().trim();
  patternName = patternName.toString().trim();
  problemTitle = problemTitle.toString().trim();
  difficulty = difficulty ? difficulty.toString().trim() : 'Unknown';
  link = link ? link.toString().trim() : '';

  let platform = 'Unknown';
  if (link.includes('leetcode.com')) platform = 'LeetCode';
  else if (link.includes('geeksforgeeks.org')) platform = 'GFG';

  if (!topicsMap.has(topicName)) {
    topicsMap.set(topicName, {
      id: crypto.randomUUID(),
      name: topicName,
      slug: slugify(topicName),
      order: topicOrder++,
      patternsMap: new Map() // patternName -> { id, slug, problems }
    });
  }

  const topicData = topicsMap.get(topicName);
  
  if (!topicData.patternsMap.has(patternName)) {
    topicData.patternsMap.set(patternName, {
      id: crypto.randomUUID(),
      name: patternName,
      slug: slugify(patternName),
      order: topicData.patternsMap.size + 1,
      problems: []
    });
  }

  const patternData = topicData.patternsMap.get(patternName);
  patternData.problems.push({
    id: crypto.randomUUID(),
    title: problemTitle,
    difficulty: difficulty,
    platform: platform,
    url: link,
    order: patternData.problems.length + 1
  });
}

let sql = '';

// Clear existing tables
sql += 'TRUNCATE TABLE public.problems CASCADE;\n';
sql += 'TRUNCATE TABLE public.patterns CASCADE;\n';
sql += 'TRUNCATE TABLE public.topics CASCADE;\n\n';

for (const [topicName, topicData] of topicsMap) {
  sql += `INSERT INTO public.topics (id, name, slug, order_index) VALUES ('${topicData.id}', '${topicData.name.replace(/'/g, "''")}', '${topicData.slug}', ${topicData.order});\n`;
}
sql += '\n';

for (const [topicName, topicData] of topicsMap) {
  for (const [patternName, patternData] of topicData.patternsMap) {
    sql += `INSERT INTO public.patterns (id, topic_id, name, slug, order_index) VALUES ('${patternData.id}', '${topicData.id}', '${patternData.name.replace(/'/g, "''")}', '${patternData.slug}', ${patternData.order});\n`;
  }
}
sql += '\n';

for (const [topicName, topicData] of topicsMap) {
  for (const [patternName, patternData] of topicData.patternsMap) {
    for (const prob of patternData.problems) {
      sql += `INSERT INTO public.problems (id, pattern_id, title, difficulty, platform, url, order_index) VALUES ('${prob.id}', '${patternData.id}', '${prob.title.replace(/'/g, "''")}', '${prob.difficulty}', '${prob.platform}', '${prob.url}', ${prob.order});\n`;
    }
  }
}

fs.writeFileSync('seed.sql', sql);
console.log('seed.sql generated successfully.');
