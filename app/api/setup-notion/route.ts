import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function richText(content: string) {
  return [{ type: "text" as const, text: { content } }];
}

function heading(level: 1 | 2 | 3, text: string) {
  const type = `heading_${level}` as "heading_1" | "heading_2" | "heading_3";
  return {
    object: "block" as const,
    type,
    [type]: { rich_text: richText(text) },
  };
}

function divider() {
  return { object: "block" as const, type: "divider" as const, divider: {} };
}

function callout(text: string, emoji: string) {
  return {
    object: "block" as const,
    type: "callout" as const,
    callout: {
      rich_text: richText(text),
      icon: { type: "emoji" as const, emoji },
      color: "gray_background" as const,
    },
  };
}

function paragraph(text: string) {
  return {
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: { rich_text: richText(text) },
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const token: string = body.token || process.env.NOTION_TOKEN || "";
  const parentPageId: string | undefined = body.parentPageId || process.env.NOTION_PARENT_PAGE_ID;

  if (!token) {
    return NextResponse.json({ error: "Notion token is required." }, { status: 400 });
  }

  const notion = new Client({ auth: token });

  try {
    // ── 1. Verify token ──────────────────────────────────────────────────────
    await notion.users.me({});

    // ── 2. Create root page ──────────────────────────────────────────────────
    const rootParent = parentPageId
      ? { type: "page_id" as const, page_id: parentPageId }
      : { type: "workspace" as const, workspace: true as const };

    const rootPage = await notion.pages.create({
      parent: rootParent,
      icon: { type: "emoji", emoji: "🧠" },
      cover: { type: "external", external: { url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400" } },
      properties: {
        title: { title: richText("Second Brain OS") },
      },
      children: [
        callout("Welcome to your Second Brain OS — tasks, projects, habits, goals, and life in one place.", "🧠"),
        divider(),
        heading(2, "📋 Quick Dashboard"),
        paragraph("All your databases are below. Use them to manage every area of your life."),
        divider(),
      ],
    });

    const rootId = rootPage.id;
    const created: Record<string, string> = { rootPage: rootId };

    // ── 3. Tasks database ────────────────────────────────────────────────────
    const tasksDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "✅" },
      title: richText("Tasks"),
      properties: {
        Name: { title: {} },
        Priority: {
          select: {
            options: [
              { name: "🔴 High", color: "red" },
              { name: "🟡 Medium", color: "yellow" },
              { name: "🟢 Low", color: "green" },
            ],
          },
        },
        Status: {
          select: {
            options: [
              { name: "Not started", color: "gray" },
              { name: "In progress", color: "blue" },
              { name: "Completed", color: "green" },
            ],
          },
        },
        Area: {
          select: {
            options: [
              { name: "Work", color: "brown" },
              { name: "Personal", color: "pink" },
              { name: "Health", color: "red" },
              { name: "Finances", color: "green" },
              { name: "Education", color: "blue" },
              { name: "Hobbies", color: "yellow" },
              { name: "Family", color: "orange" },
              { name: "Self-dev", color: "purple" },
            ],
          },
        },
        "Due Date": { date: {} },
        Done: { checkbox: {} },
      },
    });
    created.tasksDb = tasksDb.id;

    // ── 4. Seed tasks ─────────────────────────────────────────────────────────
    const seedTasks = [
      { name: "Make a choice between best platforms", priority: "🟡 Medium", area: "Work", status: "Not started" },
      { name: "Buy the Content Planner OS for my videos", priority: "🟡 Medium", area: "Work", status: "Not started" },
      { name: "Watch at Booking.com listings", priority: "🟢 Low", area: "Personal", status: "In progress" },
      { name: "Review current bank accounts", priority: "🟢 Low", area: "Finances", status: "Not started" },
      { name: "Schedule a meet with Max", priority: "🔴 High", area: "Work", status: "In progress" },
      { name: "Buy Academic OS template", priority: "🟢 Low", area: "Education", status: "Not started" },
      { name: "Make an Excel game", priority: "🟢 Low", area: "Hobbies", status: "In progress" },
    ];

    for (const t of seedTasks) {
      await notion.pages.create({
        parent: { database_id: tasksDb.id },
        properties: {
          Name: { title: richText(t.name) },
          Priority: { select: { name: t.priority } },
          Area: { select: { name: t.area } },
          Status: { select: { name: t.status } },
          Done: { checkbox: false },
        },
      });
    }

    // ── 5. Life Areas database ────────────────────────────────────────────────
    const areasDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "🌱" },
      title: richText("Life Areas"),
      properties: {
        Name: { title: {} },
        Description: { rich_text: {} },
        "Goals Count": { number: { format: "number" } },
        "Tasks Count": { number: { format: "number" } },
        "Projects Count": { number: { format: "number" } },
      },
    });
    created.areasDb = areasDb.id;

    const lifeAreas = [
      { name: "🏠 Family", goals: 3, tasks: 2, projects: 1, desc: "Relationships, home, loved ones" },
      { name: "💰 Finances", goals: 5, tasks: 4, projects: 2, desc: "Money, savings, investments" },
      { name: "🧠 Self-development", goals: 4, tasks: 6, projects: 3, desc: "Learning, growth, mindset" },
      { name: "❤️ Health", goals: 3, tasks: 5, projects: 1, desc: "Fitness, nutrition, mental health" },
      { name: "🎓 Education", goals: 2, tasks: 3, projects: 2, desc: "Courses, books, skills" },
      { name: "🎨 Hobbies", goals: 2, tasks: 4, projects: 1, desc: "Creative projects and fun" },
      { name: "💼 Work", goals: 6, tasks: 8, projects: 4, desc: "Career, clients, projects" },
      { name: "👤 Personal", goals: 3, tasks: 5, projects: 2, desc: "Identity, routines, goals" },
    ];

    for (const a of lifeAreas) {
      await notion.pages.create({
        parent: { database_id: areasDb.id },
        properties: {
          Name: { title: richText(a.name) },
          Description: { rich_text: richText(a.desc) },
          "Goals Count": { number: a.goals },
          "Tasks Count": { number: a.tasks },
          "Projects Count": { number: a.projects },
        },
      });
    }

    // ── 6. Projects database ──────────────────────────────────────────────────
    const projectsDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "📁" },
      title: richText("Projects"),
      properties: {
        Name: { title: {} },
        Status: {
          select: {
            options: [
              { name: "Active", color: "green" },
              { name: "To-do", color: "blue" },
              { name: "On hold", color: "gray" },
              { name: "Completed", color: "purple" },
            ],
          },
        },
        Area: {
          select: {
            options: [
              { name: "Work", color: "brown" },
              { name: "Personal", color: "pink" },
              { name: "Health", color: "red" },
              { name: "Finances", color: "green" },
              { name: "Education", color: "blue" },
            ],
          },
        },
        Progress: { number: { format: "percent" } },
        Deadline: { date: {} },
        Tasks: { number: { format: "number" } },
      },
    });
    created.projectsDb = projectsDb.id;

    const seedProjects = [
      { name: "Buy all templation.io products to be organized", status: "Active", area: "Work", progress: 0.19, tasks: 5 },
      { name: "Find a new apartment", status: "Active", area: "Personal", progress: 0.45, tasks: 8 },
      { name: "Launch YouTube Channel", status: "To-do", area: "Work", progress: 0.05, tasks: 12 },
      { name: "Learn Spanish B1", status: "To-do", area: "Education", progress: 0.20, tasks: 6 },
      { name: "Home gym setup", status: "On hold", area: "Health", progress: 0, tasks: 4 },
      { name: "Personal finance tracker", status: "On hold", area: "Finances", progress: 0.10, tasks: 3 },
    ];

    for (const p of seedProjects) {
      await notion.pages.create({
        parent: { database_id: projectsDb.id },
        properties: {
          Name: { title: richText(p.name) },
          Status: { select: { name: p.status } },
          Area: { select: { name: p.area } },
          Progress: { number: p.progress },
          Tasks: { number: p.tasks },
        },
      });
    }

    // ── 7. Goals database ─────────────────────────────────────────────────────
    const goalsDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "🎯" },
      title: richText("Goals"),
      properties: {
        Name: { title: {} },
        Status: {
          select: {
            options: [
              { name: "Done", color: "green" },
              { name: "In progress", color: "yellow" },
              { name: "Not started", color: "gray" },
            ],
          },
        },
        Progress: { number: { format: "percent" } },
        Month: { date: {} },
        Area: {
          select: {
            options: [
              { name: "Work", color: "brown" },
              { name: "Personal", color: "pink" },
              { name: "Finances", color: "green" },
              { name: "Health", color: "red" },
            ],
          },
        },
      },
    });
    created.goalsDb = goalsDb.id;

    const seedGoals = [
      { name: "Get my first salary", status: "Done", progress: 1.0, area: "Work" },
      { name: "Make finance updates", status: "In progress", progress: 0.65, area: "Finances" },
      { name: "Start the first course", status: "In progress", progress: 0.40, area: "Personal" },
      { name: "Complete all tasks this month", status: "Not started", progress: 0.10, area: "Work" },
    ];

    for (const g of seedGoals) {
      await notion.pages.create({
        parent: { database_id: goalsDb.id },
        properties: {
          Name: { title: richText(g.name) },
          Status: { select: { name: g.status } },
          Progress: { number: g.progress },
          Area: { select: { name: g.area } },
        },
      });
    }

    // ── 8. Habits database ────────────────────────────────────────────────────
    const habitsDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "🔥" },
      title: richText("Habits"),
      properties: {
        Name: { title: {} },
        Done: { checkbox: {} },
        Streak: { number: { format: "number" } },
        Frequency: {
          select: {
            options: [
              { name: "Daily", color: "green" },
              { name: "Weekly", color: "blue" },
              { name: "Monthly", color: "purple" },
            ],
          },
        },
        Category: {
          select: {
            options: [
              { name: "Health", color: "red" },
              { name: "Mind", color: "purple" },
              { name: "Learning", color: "blue" },
              { name: "Productivity", color: "yellow" },
            ],
          },
        },
      },
    });
    created.habitsDb = habitsDb.id;

    const seedHabits = [
      { name: "💧 Water 2L", done: false, streak: 12, freq: "Daily", cat: "Health" },
      { name: "🚶 Walk 5 km", done: true, streak: 3, freq: "Daily", cat: "Health" },
      { name: "🧘 Meditation 10 min", done: false, streak: 7, freq: "Daily", cat: "Mind" },
      { name: "📓 Day analysis", done: true, streak: 21, freq: "Daily", cat: "Productivity" },
      { name: "📖 Book 10 pages", done: false, streak: 5, freq: "Daily", cat: "Learning" },
    ];

    for (const h of seedHabits) {
      await notion.pages.create({
        parent: { database_id: habitsDb.id },
        properties: {
          Name: { title: richText(h.name) },
          Done: { checkbox: h.done },
          Streak: { number: h.streak },
          Frequency: { select: { name: h.freq } },
          Category: { select: { name: h.cat } },
        },
      });
    }

    // ── 9. Books database ─────────────────────────────────────────────────────
    const booksDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "📚" },
      title: richText("Books"),
      properties: {
        Name: { title: {} },
        Author: { rich_text: {} },
        Status: {
          select: {
            options: [
              { name: "Reading", color: "blue" },
              { name: "Read", color: "green" },
              { name: "Want to read", color: "gray" },
            ],
          },
        },
        Rating: {
          select: {
            options: [
              { name: "⭐⭐⭐⭐⭐", color: "yellow" },
              { name: "⭐⭐⭐⭐", color: "yellow" },
              { name: "⭐⭐⭐", color: "yellow" },
              { name: "⭐⭐", color: "gray" },
              { name: "⭐", color: "gray" },
            ],
          },
        },
        Progress: { rich_text: {} },
        Genre: { rich_text: {} },
      },
    });
    created.booksDb = booksDb.id;

    const seedBooks = [
      { name: "1984", author: "George Orwell", status: "Reading", rating: "⭐⭐⭐⭐⭐", progress: "63%", genre: "Dystopian" },
      { name: "Atomic Habits", author: "James Clear", status: "Reading", rating: "⭐⭐⭐⭐", progress: "Audio 45%", genre: "Self-dev" },
      { name: "The Psychology of Money", author: "Morgan Housel", status: "Reading", rating: "⭐⭐⭐⭐", progress: "Page 87", genre: "Finance" },
    ];

    for (const b of seedBooks) {
      await notion.pages.create({
        parent: { database_id: booksDb.id },
        properties: {
          Name: { title: richText(b.name) },
          Author: { rich_text: richText(b.author) },
          Status: { select: { name: b.status } },
          Rating: { select: { name: b.rating } },
          Progress: { rich_text: richText(b.progress) },
          Genre: { rich_text: richText(b.genre) },
        },
      });
    }

    // ── 10. Watchlist database ────────────────────────────────────────────────
    const watchDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "📺" },
      title: richText("Watchlist"),
      properties: {
        Name: { title: {} },
        Type: {
          select: {
            options: [
              { name: "Movie", color: "purple" },
              { name: "Series", color: "blue" },
              { name: "Anime", color: "red" },
              { name: "Documentary", color: "green" },
            ],
          },
        },
        Status: {
          select: {
            options: [
              { name: "Watching", color: "blue" },
              { name: "Watched", color: "green" },
              { name: "Want to watch", color: "gray" },
            ],
          },
        },
        Rating: {
          select: {
            options: [
              { name: "⭐⭐⭐⭐⭐", color: "yellow" },
              { name: "⭐⭐⭐⭐", color: "yellow" },
              { name: "⭐⭐⭐", color: "yellow" },
            ],
          },
        },
        Progress: { rich_text: {} },
      },
    });
    created.watchDb = watchDb.id;

    const seedWatch = [
      { name: "Attack on Titan", type: "Anime", status: "Watching", rating: "⭐⭐⭐⭐⭐", progress: "S4 E12" },
      { name: "The Office (US)", type: "Series", status: "Watching", rating: "⭐⭐⭐⭐", progress: "S3 E7" },
      { name: "Dark", type: "Series", status: "Watching", rating: "⭐⭐⭐⭐⭐", progress: "S2 E3" },
    ];

    for (const w of seedWatch) {
      await notion.pages.create({
        parent: { database_id: watchDb.id },
        properties: {
          Name: { title: richText(w.name) },
          Type: { select: { name: w.type } },
          Status: { select: { name: w.status } },
          Rating: { select: { name: w.rating } },
          Progress: { rich_text: richText(w.progress) },
        },
      });
    }

    // ── 11. Notes database ─────────────────────────────────────────────────────
    const notesDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "📝" },
      title: richText("Notes"),
      properties: {
        Name: { title: {} },
        Area: {
          select: {
            options: [
              { name: "Work", color: "brown" },
              { name: "Personal", color: "pink" },
              { name: "Ideas", color: "yellow" },
              { name: "Learning", color: "blue" },
            ],
          },
        },
        Tags: { multi_select: { options: [] } },
        Created: { created_time: {} },
      },
    });
    created.notesDb = notesDb.id;

    // ── 12. Contacts database ─────────────────────────────────────────────────
    const contactsDb = await notion.databases.create({
      parent: { type: "page_id", page_id: rootId },
      icon: { type: "emoji", emoji: "👤" },
      title: richText("Contacts"),
      properties: {
        Name: { title: {} },
        Phone: { phone_number: {} },
        Email: { email: {} },
        Relationship: {
          select: {
            options: [
              { name: "Friend", color: "green" },
              { name: "Family", color: "orange" },
              { name: "Work", color: "brown" },
              { name: "Mentor", color: "purple" },
            ],
          },
        },
        Notes: { rich_text: {} },
      },
    });
    created.contactsDb = contactsDb.id;

    // ── 13. Update root page with database links ──────────────────────────────
    await notion.blocks.children.append({
      block_id: rootId,
      children: [
        heading(2, "✅ Tasks"),
        { object: "block", type: "child_database", child_database: { title: "" } } as never,
        divider(),
        heading(2, "🌱 Life Areas"),
        divider(),
        heading(2, "📁 Projects"),
        divider(),
        heading(2, "🎯 Goals this month"),
        divider(),
        heading(2, "🔥 Habits"),
        divider(),
        heading(2, "📚 Reading now · 📺 Watching now"),
        divider(),
        heading(2, "📝 Notes · 👤 Contacts"),
        paragraph("All databases are created above. Click any database to open and edit."),
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Second Brain OS created successfully in Notion!",
      rootPageUrl: `https://notion.so/${rootId.replace(/-/g, "")}`,
      databases: {
        tasks: `https://notion.so/${tasksDb.id.replace(/-/g, "")}`,
        projects: `https://notion.so/${projectsDb.id.replace(/-/g, "")}`,
        goals: `https://notion.so/${goalsDb.id.replace(/-/g, "")}`,
        habits: `https://notion.so/${habitsDb.id.replace(/-/g, "")}`,
        lifeAreas: `https://notion.so/${areasDb.id.replace(/-/g, "")}`,
        books: `https://notion.so/${booksDb.id.replace(/-/g, "")}`,
        watchlist: `https://notion.so/${watchDb.id.replace(/-/g, "")}`,
        notes: `https://notion.so/${notesDb.id.replace(/-/g, "")}`,
        contacts: `https://notion.so/${contactsDb.id.replace(/-/g, "")}`,
      },
      created,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const body = (err as { body?: string })?.body;
    return NextResponse.json(
      { error: msg, details: body },
      { status: 500 }
    );
  }
}
