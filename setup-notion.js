#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
//  Second Brain OS — Notion Setup
//  Requires: Node.js 18+  (no npm install needed)
//  Usage:    node setup-notion.js
// ────────────────────────────────────────────────────────────────────────────

const TOKEN = 'ntn_z21164074092x2beVjBRbNnoxORumx52KJ4gDW4nG7h69v';
const VERSION = '2022-06-28';

async function api(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${json.message || JSON.stringify(json)}`);
  return json;
}

// ── Schema helpers (used when creating databases) ───────────────────────────
const sel  = (opts) => ({ select:       { options: opts.map(([name, color]) => ({ name, color })) } });
const msel = (opts) => ({ multi_select: { options: opts.map(([name, color]) => ({ name, color })) } });

// ── Value helpers (used when adding page entries) ───────────────────────────
const title = (s) => ({ title: [{ type: 'text', text: { content: s } }] });
const text  = (s) => ({ rich_text: [{ type: 'text', text: { content: s } }] });
const pick  = (s) => ({ select: { name: s } });
const mpick = (arr) => ({ multi_select: arr.map((name) => ({ name })) });
const date  = (s) => ({ date: { start: s } });
const num   = (n) => ({ number: n });
const bool  = (b) => ({ checkbox: b });
const email = (s) => ({ email: s });

// Reusable Area select schema (same across 6 databases)
const AREA_SCHEMA = sel([
  ['Health', 'green'], ['Work', 'blue'], ['Learning', 'purple'],
  ['Personal', 'pink'], ['Finance', 'yellow'],
]);

async function createDb(parentId, icon, dbTitle, props) {
  const db = await api('POST', '/databases', {
    parent: { type: 'page_id', page_id: parentId },
    icon: { type: 'emoji', emoji: icon },
    title: [{ type: 'text', text: { content: dbTitle } }],
    properties: { Name: { title: {} }, ...props },
  });
  return db.id;
}

async function add(dbId, props) {
  return api('POST', '/pages', { parent: { database_id: dbId }, properties: props });
}

// ────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🧠  Second Brain OS — Notion Setup\n');

  // Check Node.js version
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 18) {
    console.error('❌ Node.js 18+ required (yours: ' + process.version + ')');
    console.error('   Download: https://nodejs.org');
    process.exit(1);
  }

  // ── Step 1: Find an accessible page to write into ──────────────────────
  console.log('🔑 Connecting to Notion API...');
  let parentId = null;
  let parentTitle = null;

  try {
    const { results } = await api('POST', '/search', {
      filter: { value: 'page', property: 'object' },
      page_size: 10,
    });

    if (results && results.length > 0) {
      parentId = results[0].id;
      const titleBlock = results[0].properties?.title?.title;
      parentTitle = titleBlock?.[0]?.plain_text ?? 'Untitled';
    }
  } catch (e) {
    console.error('\n❌ Cannot reach Notion:', e.message);
    console.error('\n  Fix: In Notion, open any page → Share → Invite your integration');
    process.exit(1);
  }

  if (parentId) {
    console.log(`✅ Found accessible page: "${parentTitle}"`);
    console.log(`   Creating "Second Brain OS" inside it\n`);
  } else {
    console.log('📌 No shared pages found — trying workspace root\n');
  }

  // ── Step 2: Create the root "Second Brain OS" page ─────────────────────
  console.log('📄 Creating root page...');
  let rootId;

  try {
    const parent = parentId
      ? { type: 'page_id', page_id: parentId }
      : { type: 'workspace', workspace: true };

    const root = await api('POST', '/pages', {
      parent,
      icon: { type: 'emoji', emoji: '🧠' },
      properties: {
        title: [{ type: 'text', text: { content: 'Second Brain OS' } }],
      },
    });
    rootId = root.id;
    console.log('✅ Root page created\n');
  } catch (e) {
    console.error('\n❌ Cannot create root page:', e.message);
    console.error('\n  Fix:');
    console.error('    1. Open Notion in your browser');
    console.error('    2. Create a new blank page (name it anything)');
    console.error('    3. Click "Share" → find your integration → click "Invite"');
    console.error('    4. Run this script again');
    process.exit(1);
  }

  // ── Step 3: Create all 9 databases ─────────────────────────────────────
  console.log('📦 Creating databases...');

  const tasks = await createDb(rootId, '✅', 'Tasks', {
    Status:     sel([['Todo', 'red'], ['In Progress', 'yellow'], ['Done', 'green']]),
    Priority:   sel([['High', 'red'], ['Medium', 'yellow'], ['Low', 'gray']]),
    'Due Date': { date: {} },
    Project:    { rich_text: {} },
    Area:       AREA_SCHEMA,
  });
  console.log('  ✅ Tasks');

  const projects = await createDb(rootId, '📁', 'Projects', {
    Status:       sel([['Planning', 'gray'], ['Active', 'blue'], ['Completed', 'green'], ['On Hold', 'yellow']]),
    Area:         AREA_SCHEMA,
    'Start Date': { date: {} },
    'End Date':   { date: {} },
  });
  console.log('  📁 Projects');

  const goals = await createDb(rootId, '🎯', 'Goals', {
    Status:        sel([['Active', 'blue'], ['Completed', 'green'], ['Abandoned', 'gray']]),
    Area:          AREA_SCHEMA,
    'Target Date': { date: {} },
    Progress:      { number: { format: 'percent' } },
  });
  console.log('  🎯 Goals');

  const habits = await createDb(rootId, '🔄', 'Habits', {
    Frequency: sel([['Daily', 'blue'], ['Weekly', 'green'], ['Monthly', 'yellow']]),
    Area:      AREA_SCHEMA,
    Active:    { checkbox: {} },
  });
  console.log('  🔄 Habits');

  const areas = await createDb(rootId, '🗺️', 'Life Areas', {
    Description: { rich_text: {} },
    Priority:    sel([['High', 'red'], ['Medium', 'yellow'], ['Low', 'gray']]),
  });
  console.log('  🗺️  Life Areas');

  const books = await createDb(rootId, '📚', 'Books', {
    Author:         { rich_text: {} },
    Status:         sel([['To Read', 'gray'], ['Reading', 'blue'], ['Completed', 'green']]),
    Rating:         { number: { format: 'number' } },
    Genre:          msel([['Self-Help', 'blue'], ['Fiction', 'purple'], ['Non-Fiction', 'green'], ['Business', 'yellow'], ['Science', 'red'], ['History', 'orange']]),
    'Date Finished':{ date: {} },
  });
  console.log('  📚 Books');

  const watchlist = await createDb(rootId, '🎬', 'Watchlist', {
    Type:     sel([['Movie', 'blue'], ['Series', 'green'], ['Documentary', 'yellow'], ['Anime', 'purple']]),
    Status:   sel([['To Watch', 'gray'], ['Watching', 'blue'], ['Watched', 'green']]),
    Rating:   { number: { format: 'number' } },
    Platform: sel([['Netflix', 'red'], ['YouTube', 'red'], ['Prime', 'blue'], ['Disney+', 'blue'], ['HBO', 'purple'], ['Other', 'gray']]),
  });
  console.log('  🎬 Watchlist');

  const notes = await createDb(rootId, '📝', 'Notes', {
    Tags: msel([['Idea', 'yellow'], ['Meeting', 'blue'], ['Reference', 'green'], ['Journal', 'purple'], ['Learning', 'red']]),
    Area: AREA_SCHEMA,
    Type: sel([['Meeting', 'blue'], ['Idea', 'yellow'], ['Reference', 'green'], ['Journal', 'purple']]),
  });
  console.log('  📝 Notes');

  const contacts = await createDb(rootId, '👤', 'Contacts', {
    Relationship: sel([['Friend', 'blue'], ['Family', 'green'], ['Colleague', 'yellow'], ['Mentor', 'purple'], ['Client', 'red']]),
    Email:        { email: {} },
    Phone:        { phone_number: {} },
    Notes:        { rich_text: {} },
  });
  console.log('  👤 Contacts\n');

  // ── Step 4: Seed sample data ────────────────────────────────────────────
  console.log('🌱 Adding sample entries...');

  await Promise.all([
    add(tasks, { Name: title('Set up Second Brain system'), Status: pick('Done'),        Priority: pick('High'),   Area: pick('Personal') }),
    add(tasks, { Name: title('Read Atomic Habits'),          Status: pick('In Progress'), Priority: pick('Medium'), Area: pick('Learning') }),
    add(tasks, { Name: title('Weekly review'),               Status: pick('Todo'),        Priority: pick('High'),   Area: pick('Work'),    'Due Date': date('2026-07-28') }),
    add(tasks, { Name: title('Exercise 3× this week'),       Status: pick('In Progress'), Priority: pick('High'),   Area: pick('Health') }),
    add(tasks, { Name: title('Plan Q3 budget'),              Status: pick('Todo'),        Priority: pick('Medium'), Area: pick('Finance'), 'Due Date': date('2026-07-31') }),
  ]);
  console.log('  ✅ 5 tasks');

  await Promise.all([
    add(projects, { Name: title('Personal Website Redesign'), Status: pick('Active'), Area: pick('Work'),     'Start Date': date('2026-07-01'), 'End Date': date('2026-08-31') }),
    add(projects, { Name: title('Read 12 Books This Year'),   Status: pick('Active'), Area: pick('Learning'), 'Start Date': date('2026-01-01'), 'End Date': date('2026-12-31') }),
    add(projects, { Name: title('Get in Shape'),              Status: pick('Active'), Area: pick('Health'),   'Start Date': date('2026-06-01') }),
  ]);
  console.log('  📁 3 projects');

  await Promise.all([
    add(goals, { Name: title('Read 12 books in 2026'),     Status: pick('Active'), Area: pick('Learning'), 'Target Date': date('2026-12-31'), Progress: num(50) }),
    add(goals, { Name: title('Run a 5K'),                  Status: pick('Active'), Area: pick('Health'),   'Target Date': date('2026-09-30'), Progress: num(30) }),
    add(goals, { Name: title('Save 10K emergency fund'),   Status: pick('Active'), Area: pick('Finance'),  'Target Date': date('2026-12-31'), Progress: num(60) }),
  ]);
  console.log('  🎯 3 goals');

  await Promise.all([
    add(habits, { Name: title('Morning meditation'), Frequency: pick('Daily'),   Area: pick('Health'),   Active: bool(true) }),
    add(habits, { Name: title('Read 30 minutes'),    Frequency: pick('Daily'),   Area: pick('Learning'), Active: bool(true) }),
    add(habits, { Name: title('Weekly review'),      Frequency: pick('Weekly'),  Area: pick('Work'),     Active: bool(true) }),
    add(habits, { Name: title('Exercise'),           Frequency: pick('Daily'),   Area: pick('Health'),   Active: bool(true) }),
  ]);
  console.log('  🔄 4 habits');

  await Promise.all([
    add(areas, { Name: title('Health & Fitness'), Description: text('Physical and mental wellbeing, exercise, nutrition, sleep'), Priority: pick('High') }),
    add(areas, { Name: title('Work & Career'),    Description: text('Professional growth, projects, skills'),                    Priority: pick('High') }),
    add(areas, { Name: title('Learning'),         Description: text('Books, courses, new skills and knowledge'),                 Priority: pick('Medium') }),
    add(areas, { Name: title('Personal'),         Description: text('Hobbies, relationships, personal projects'),               Priority: pick('Medium') }),
    add(areas, { Name: title('Finance'),          Description: text('Budget, savings, investments'),                            Priority: pick('High') }),
  ]);
  console.log('  🗺️  5 life areas');

  await Promise.all([
    add(books, { Name: title('Atomic Habits'),              Author: text('James Clear'),   Status: pick('Reading'),   Rating: num(5), Genre: mpick(['Self-Help']) }),
    add(books, { Name: title('Deep Work'),                  Author: text('Cal Newport'),   Status: pick('Completed'), Rating: num(5), Genre: mpick(['Business']),                   'Date Finished': date('2026-03-15') }),
    add(books, { Name: title('The Psychology of Money'),    Author: text('Morgan Housel'), Status: pick('To Read'),                  Genre: mpick(['Business', 'Non-Fiction']) }),
  ]);
  console.log('  📚 3 books');

  await Promise.all([
    add(watchlist, { Name: title('Interstellar'), Type: pick('Movie'),  Status: pick('Watched'),   Rating: num(10), Platform: pick('Netflix') }),
    add(watchlist, { Name: title('Oppenheimer'),  Type: pick('Movie'),  Status: pick('To Watch'),                   Platform: pick('Prime') }),
    add(watchlist, { Name: title('Chernobyl'),    Type: pick('Series'), Status: pick('Watched'),   Rating: num(10), Platform: pick('HBO') }),
  ]);
  console.log('  🎬 3 watchlist items');

  await Promise.all([
    add(notes, { Name: title('Ideas for Q3 projects'),           Tags: mpick(['Idea']),                    Area: pick('Work'),     Type: pick('Idea') }),
    add(notes, { Name: title('Key takeaways from Deep Work'),    Tags: mpick(['Learning', 'Reference']),   Area: pick('Learning'), Type: pick('Reference') }),
  ]);
  console.log('  📝 2 notes');

  await Promise.all([
    add(contacts, { Name: title('John Smith'),    Relationship: pick('Colleague'), Email: email('john@example.com'), Notes: text('Met at conference 2025') }),
    add(contacts, { Name: title('Sarah Johnson'), Relationship: pick('Mentor'),                                      Notes: text('Monthly 1:1 calls') }),
  ]);
  console.log('  👤 2 contacts');

  // ── Done ────────────────────────────────────────────────────────────────
  const url = `https://notion.so/${rootId.replace(/-/g, '')}`;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  Your Second Brain OS is live in Notion!\n');
  console.log('🔗  ' + url);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
