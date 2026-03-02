import { NextResponse } from "next/server";

// GitHub public Events API — no auth needed, 60 req/hr limit
const GITHUB_URL = "https://api.github.com/events?per_page=30";

// Cache (60s TTL — GitHub rate limits are tight)
let cache: { data: GitHubFeed | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 60_000;

interface GitHubEvent {
  type: string;
  actor: string;
  repo: string;
  createdAt: string;
}

export interface GitHubFeed {
  events: GitHubEvent[];
  summary: {
    totalEvents: number;
    pushEvents: number;
    createEvents: number;
    issueEvents: number;
    prEvents: number;
    watchEvents: number; // stars
    forkEvents: number;
    uniqueRepos: number;
    uniqueActors: number;
  };
  activityScore: number; // 0-1 normalized activity intensity
  fetchedAt: number;
}

export async function GET() {
  const now = Date.now();

  if (cache.data && now - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const res = await fetch(GITHUB_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "CogOps-SwarmBrain",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub returned ${res.status}` },
        { status: 502 }
      );
    }

    const raw = await res.json();

    const events: GitHubEvent[] = raw.map((e: any) => ({
      type: e.type || "Unknown",
      actor: e.actor?.login || "unknown",
      repo: e.repo?.name || "unknown",
      createdAt: e.created_at || "",
    }));

    // Compute summary stats
    const types = events.map((e) => e.type);
    const pushEvents = types.filter((t) => t === "PushEvent").length;
    const createEvents = types.filter((t) => t === "CreateEvent").length;
    const issueEvents = types.filter((t) => t.includes("Issue")).length;
    const prEvents = types.filter((t) => t.includes("PullRequest")).length;
    const watchEvents = types.filter((t) => t === "WatchEvent").length;
    const forkEvents = types.filter((t) => t === "ForkEvent").length;
    const uniqueRepos = new Set(events.map((e) => e.repo)).size;
    const uniqueActors = new Set(events.map((e) => e.actor)).size;

    // Activity score: higher when there are more diverse, high-impact events
    // Push/PR heavy = building. Issue/Watch heavy = attention spike.
    const impactScore = (prEvents * 3 + pushEvents * 1 + issueEvents * 2 + watchEvents * 2 + forkEvents * 2) / Math.max(events.length, 1);
    const activityScore = Math.min(impactScore / 3, 1.0);

    const data: GitHubFeed = {
      events: events.slice(0, 10), // Only send top 10 to client
      summary: {
        totalEvents: events.length,
        pushEvents,
        createEvents,
        issueEvents,
        prEvents,
        watchEvents,
        forkEvents,
        uniqueRepos,
        uniqueActors,
      },
      activityScore,
      fetchedAt: now,
    };

    cache = { data, ts: now };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
