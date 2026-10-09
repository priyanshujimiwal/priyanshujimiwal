// Fetches everything the cards need from the GitHub GraphQL API.
// Private repos only ever contribute aggregates (counts, language bytes) — never names.

const API = 'https://api.github.com/graphql';

async function gql(token, query, variables = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'pj-metrics' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const PROFILE = `
query($login: String!) {
  user(login: $login) {
    login name createdAt
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      totalCount
      nodes {
        name isPrivate stargazerCount pushedAt url
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount weekday } }
      }
    }
  }
}`;

// One aliased contributionsCollection per calendar year since the account was created.
function yearlyQuery(fromYear, toYear) {
  const parts = [];
  for (let y = fromYear; y <= toYear; y++) {
    parts.push(`y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
      totalCommitContributions totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions
    }`);
  }
  return `query($login: String!) { user(login: $login) { ${parts.join('\n')} } }`;
}

const DSA = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
    tree: object(expression: "HEAD:") {
      ... on Tree { entries { name type object { ... on Tree { entries { name object { ... on Blob { text } } } } } } }
    }
  }
}`;

function streaks(days) {
  const today = new Date().toISOString().slice(0, 10);
  let longest = 0, run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Current streak: walk back from today; an empty "today" doesn't break it yet.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.date > today) continue;
    if (d.contributionCount > 0) current++;
    else if (d.date === today) continue;
    else break;
  }
  return { current, longest };
}

function parseDsa(repo) {
  if (!repo?.tree?.entries) return null;
  const difficulty = { Easy: 0, Medium: 0, Hard: 0 };
  let solved = 0;
  for (const e of repo.tree.entries) {
    if (e.type !== 'tree' || !/^\d{4}-/.test(e.name)) continue;
    solved++;
    const readme = e.object?.entries?.find((f) => f.name.toLowerCase() === 'readme.md')?.object?.text ?? '';
    const m = readme.match(/<h3>\s*(Easy|Medium|Hard)\s*<\/h3>/i);
    if (m) difficulty[m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()]++;
  }
  // LeetHub keeps a "## Topic" + table index in the root README.
  const topics = {};
  let cur = null;
  for (const line of (repo.readme?.text ?? '').split('\n')) {
    const h = line.match(/^##\s+(.+)/);
    if (h) { cur = h[1].trim(); continue; }
    if (cur && /^\|\s*\[/.test(line)) topics[cur] = (topics[cur] ?? 0) + 1;
  }
  const topTopics = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { solved, difficulty, topTopics };
}

export async function fetchAll(token, config) {
  const { user } = await gql(token, PROFILE, { login: config.login });

  const fromYear = new Date(user.createdAt).getUTCFullYear();
  const toYear = new Date().getUTCFullYear();
  const yearly = Object.values((await gql(token, yearlyQuery(fromYear, toYear), { login: config.login })).user);
  const sum = (k) => yearly.reduce((a, y) => a + y[k], 0);

  const cal = user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  const activeDays = days.filter((d) => d.contributionCount > 0).length;
  const byWeekday = Array(7).fill(0);
  for (const d of days) byWeekday[d.weekday] += d.contributionCount;

  // Languages across owned, non-fork repos (public + private). By default each repo counts
  // equally (its bytes are normalised to 1), so a committed venv/node_modules can't swamp the rest.
  const exRepos = new Set([config.login, ...(config.languages?.excludeRepos ?? [])]);
  const exLangs = new Set(config.languages?.exclude ?? []);
  const byRepo = (config.languages?.weighting ?? 'repo') === 'repo';
  const langs = {};
  for (const r of user.repositories.nodes) {
    if (exRepos.has(r.name)) continue;
    const edges = r.languages.edges.filter((e) => !exLangs.has(e.node.name));
    const total = edges.reduce((a, e) => a + e.size, 0) || 1;
    for (const { size, node } of edges) {
      langs[node.name] ??= { name: node.name, color: node.color ?? '#8b949e', size: 0 };
      langs[node.name].size += byRepo ? size / total : size;
    }
  }

  const repos = Object.fromEntries(
    user.repositories.nodes.filter((r) => !r.isPrivate).map((r) => [r.name, { stars: r.stargazerCount, pushedAt: r.pushedAt, url: r.url }]),
  );

  let dsa = null;
  if (config.dsa?.repo) {
    try {
      dsa = parseDsa((await gql(token, DSA, { owner: config.login, name: config.dsa.repo })).repository);
    } catch (e) {
      console.warn(`dsa: skipped (${e.message})`);
    }
  }

  return {
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    repoCount: user.repositories.totalCount,
    publicRepoCount: Object.keys(repos).length,
    stars: user.repositories.nodes.reduce((a, r) => a + (r.isPrivate ? 0 : r.stargazerCount), 0),
    totalContributions: cal.totalContributions,
    weeks: cal.weeks.map((w) => w.contributionDays),
    days,
    activeDays,
    busiestWeekday: byWeekday.indexOf(Math.max(...byWeekday)),
    streak: streaks(days),
    commits: sum('totalCommitContributions'),
    prs: sum('totalPullRequestContributions'),
    issues: sum('totalIssueContributions'),
    reviews: sum('totalPullRequestReviewContributions'),
    languages: Object.values(langs).sort((a, b) => b.size - a.size),
    repos,
    dsa,
  };
}
