require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const crypto = require('crypto');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function run() {
  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('RB DSA sheet.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const topicsMap = new Map();
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
        order_index: topicOrder++,
        patternsMap: new Map()
      });
    }

    const topicData = topicsMap.get(topicName);
    
    if (!topicData.patternsMap.has(patternName)) {
      topicData.patternsMap.set(patternName, {
        id: crypto.randomUUID(),
        topic_id: topicData.id,
        name: patternName,
        slug: slugify(patternName),
        order_index: topicData.patternsMap.size + 1,
        problems: []
      });
    }

    const patternData = topicData.patternsMap.get(patternName);
    patternData.problems.push({
      id: crypto.randomUUID(),
      pattern_id: patternData.id,
      title: problemTitle,
      difficulty: difficulty,
      platform: platform,
      url: link,
      order_index: patternData.problems.length + 1
    });
  }

  // Clear existing
  console.log('Clearing existing data...');
  // We can't TRUNCATE via REST API, but we can delete all topics which will cascade.
  await supabase.from('topics').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const topics = Array.from(topicsMap.values()).map(t => ({ id: t.id, name: t.name, slug: t.slug, order_index: t.order_index }));
  console.log('Inserting topics...', topics.length);
  const { error: tErr } = await supabase.from('topics').insert(topics);
  if (tErr) console.error('Error inserting topics:', tErr);

  const patterns = [];
  const problems = [];
  for (const topic of topicsMap.values()) {
    for (const pattern of topic.patternsMap.values()) {
      patterns.push({ id: pattern.id, topic_id: pattern.topic_id, name: pattern.name, slug: pattern.slug, order_index: pattern.order_index });
      for (const prob of pattern.problems) {
        problems.push(prob);
      }
    }
  }

  console.log('Inserting patterns...', patterns.length);
  const { error: pErr } = await supabase.from('patterns').insert(patterns);
  if (pErr) console.error('Error inserting patterns:', pErr);

  console.log('Inserting problems...', problems.length);
  // Supabase has a limit on rows per insert, chunk it to 1000
  for (let i = 0; i < problems.length; i += 1000) {
    const chunk = problems.slice(i, i + 1000);
    const { error: prErr } = await supabase.from('problems').insert(chunk);
    if (prErr) console.error('Error inserting problems chunk:', prErr);
  }

  console.log('Done!');
}

run().catch(console.error);
