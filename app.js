const config = window.ARTIAZE_SUPABASE || {};
const supabaseClient = config.url && config.anonKey
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;

const topicImages = {
  AI: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1100&q=80",
  Cybersecurity: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1100&q=80",
  Web: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1100&q=80",
  Robotics: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1100&q=80",
  Data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1100&q=80",
  Cloud: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1100&q=80",
  Hardware: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1100&q=80"
};

const views = {
  home: document.querySelector("#homeView"),
  submit: document.querySelector("#submitView"),
  dashboard: document.querySelector("#dashboardView"),
  admin: document.querySelector("#adminView"),
  article: document.querySelector("#articleView"),
  auth: document.querySelector("#authView")
};

const appState = {
  route: "home",
  articleId: null,
  authMode: "login",
  user: null,
  profile: null,
  homeArticles: [],
  myArticles: [],
  pendingArticles: [],
  currentArticle: null
};

init();

async function init() {
  if (!supabaseClient) {
    renderMissingConfig();
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  appState.user = data.session?.user || null;
  await loadProfile();
  await loadHome();
  if (appState.route === "article" && appState.articleId) {
    await loadArticle(appState.articleId, true);
  }
  render();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    appState.user = session?.user || null;
    appState.profile = null;
    await loadProfile();
    await loadHome();
    render();
  });
}

function renderMissingConfig() {
  Object.values(views).forEach((view) => view.classList.add("hidden"));
  views.home.classList.remove("hidden");
  document.querySelector("#accountArea").innerHTML = "";
  document.querySelector("#articleGrid").innerHTML = `
    <div class="empty-state">
      Supabase is not connected yet. Add your Supabase project URL and anon key in supabase-config.js, then redeploy.
    </div>
  `;
}

async function loadProfile() {
  if (!appState.user) return;
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", appState.user.id)
    .single();

  if (!error) appState.profile = data;
}

async function loadHome() {
  const { data, error } = await supabaseClient
    .from("articles")
    .select("*, profiles(display_name), comments(id), article_likes(user_id)")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  appState.homeArticles = error ? [] : normalizeArticles(data || []);
}

async function loadDashboard() {
  if (!appState.user) return;
  const { data, error } = await supabaseClient
    .from("articles")
    .select("*, profiles(display_name), comments(id), article_likes(user_id)")
    .eq("author_id", appState.user.id)
    .order("created_at", { ascending: false });

  appState.myArticles = error ? [] : normalizeArticles(data || []);
}

async function loadAdmin() {
  if (!isAdmin()) return;
  const { data, error } = await supabaseClient
    .from("articles")
    .select("*, profiles(display_name), comments(id), article_likes(user_id)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  appState.pendingArticles = error ? [] : normalizeArticles(data || []);
}

async function loadArticle(articleId, incrementView = false) {
  if (incrementView) {
    await supabaseClient.rpc("increment_article_view", { article_uuid: articleId });
  }

  const { data, error } = await supabaseClient
    .from("articles")
    .select("*, profiles(display_name), comments(id, body, created_at, profiles(display_name)), article_likes(user_id)")
    .eq("id", articleId)
    .single();

  appState.currentArticle = error ? null : normalizeArticle(data);
}

function normalizeArticles(articles) {
  return articles.map(normalizeArticle);
}

function normalizeArticle(article) {
  return {
    ...article,
    authorName: article.profiles?.display_name || "Student author",
    comments: article.comments || [],
    likes: article.article_likes || [],
    image: topicImages[article.topic] || topicImages.Web
  };
}

function render() {
  Object.values(views).forEach((view) => view.classList.add("hidden"));
  views[appState.route].classList.remove("hidden");
  renderAccount();
  renderAdminNav();

  if (appState.route === "home") renderHome();
  if (appState.route === "submit") renderSubmissionHint();
  if (appState.route === "dashboard") renderDashboard();
  if (appState.route === "admin") renderAdmin();
  if (appState.route === "article") renderArticle();
  if (appState.route === "auth") renderAuthMode();
}

function renderAccount() {
  const area = document.querySelector("#accountArea");
  if (!appState.user) {
    area.innerHTML = `<button class="secondary-action" data-route="auth">Log In</button>`;
    return;
  }

  const name = appState.profile?.display_name || appState.user.email;
  area.innerHTML = `
    <div class="user-pill"><span class="avatar">${escapeHtml(name[0])}</span><span>${escapeHtml(name)}</span></div>
    <button class="secondary-action" id="logoutButton">Log Out</button>
  `;
}

function renderAdminNav() {
  document.querySelector(".admin-link").classList.toggle("hidden", !isAdmin());
}

function renderHome() {
  fillFilterOptions();
  renderTopicStrip();
  const articles = filteredArticles();
  const grid = document.querySelector("#articleGrid");

  if (!articles.length) {
    grid.innerHTML = `<div class="empty-state">No published articles yet. Be the first student to submit one.</div>`;
    return;
  }

  const template = document.querySelector("#articleCardTemplate");
  grid.innerHTML = "";
  articles.forEach((article) => {
    const card = template.content.cloneNode(true);
    card.querySelector("img").src = article.image;
    card.querySelector("img").alt = `${article.topic} article cover`;
    card.querySelector("h3").textContent = article.title;
    card.querySelector("p").textContent = article.summary;
    card.querySelector(".chip-row").innerHTML = `
      <span class="chip">${escapeHtml(article.topic)}</span>
      <span class="chip">${escapeHtml(article.field)}</span>
    `;
    card.querySelector(".card-meta").textContent = `${article.authorName} · ${formatDate(article.created_at)} · ${article.views_count} views · ${article.comments.length} comments`;
    card.querySelector(".read-button").addEventListener("click", () => openArticle(article.id));
    card.querySelector(".like-button").classList.toggle("active", hasLiked(article));
    card.querySelector(".like-button").textContent = `♡ ${article.likes.length}`;
    card.querySelector(".like-button").addEventListener("click", () => toggleLike(article.id));
    card.querySelector(".share-button").addEventListener("click", () => shareArticle(article.id));
    grid.appendChild(card);
  });
}

function fillFilterOptions() {
  const topics = unique(appState.homeArticles.map((article) => article.topic));
  const fields = unique(appState.homeArticles.map((article) => article.field));
  const tags = unique(appState.homeArticles.flatMap((article) => article.tags || []));
  syncSelect("#topicFilter", ["All topics", ...topics]);
  syncSelect("#fieldFilter", ["All fields", ...fields]);
  syncSelect("#tagFilter", ["All tags", ...tags]);
}

function syncSelect(selector, values) {
  const select = document.querySelector(selector);
  const oldValue = select.value;
  select.innerHTML = values.map((value, index) => `<option value="${index === 0 ? "" : escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  select.value = values.includes(oldValue) ? oldValue : "";
}

function renderTopicStrip() {
  const strip = document.querySelector("#topicStrip");
  const selected = document.querySelector("#topicFilter").value;
  const counts = appState.homeArticles.reduce((acc, article) => {
    acc[article.topic] = (acc[article.topic] || 0) + 1;
    return acc;
  }, {});

  strip.innerHTML = Object.entries(counts)
    .map(([topic, count]) => `<button class="chip ${selected === topic ? "active" : ""}" data-topic="${escapeHtml(topic)}">${escapeHtml(topic)} · ${count}</button>`)
    .join("");
}

function filteredArticles() {
  const query = document.querySelector("#searchInput").value.trim().toLowerCase();
  const topic = document.querySelector("#topicFilter").value;
  const field = document.querySelector("#fieldFilter").value;
  const tag = document.querySelector("#tagFilter").value;
  const sort = document.querySelector("#sortFilter").value;

  return [...appState.homeArticles]
    .filter((article) => !topic || article.topic === topic)
    .filter((article) => !field || article.field === field)
    .filter((article) => !tag || article.tags.includes(tag))
    .filter((article) => {
      if (!query) return true;
      return [article.title, article.topic, article.field, article.summary, article.body, article.authorName, ...(article.tags || [])].join(" ").toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sort === "views") return b.views_count - a.views_count;
      if (sort === "likes") return b.likes.length - a.likes.length;
      if (sort === "comments") return b.comments.length - a.comments.length;
      return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
    });
}

function renderSubmissionHint() {
  const articles = appState.myArticles;
  document.querySelector("#submissionHint").innerHTML = `
    <p>Your submitted articles are sent to the admin review queue before publication.</p>
    <div class="status-chip pending">Pending ${articles.filter((article) => article.status === "pending").length}</div>
    <div class="status-chip published">Published ${articles.filter((article) => article.status === "published").length}</div>
  `;
}

function renderDashboard() {
  const totals = appState.myArticles.reduce((acc, article) => {
    acc.views += article.views_count;
    acc.likes += article.likes.length;
    acc.shares += article.shares_count;
    acc.comments += article.comments.length;
    return acc;
  }, { views: 0, likes: 0, shares: 0, comments: 0 });

  document.querySelector("#myStats").innerHTML = `
    <div class="stat-card"><strong>${totals.views}</strong><span>Views</span></div>
    <div class="stat-card"><strong>${totals.likes}</strong><span>Likes</span></div>
    <div class="stat-card"><strong>${totals.shares}</strong><span>Shares</span></div>
    <div class="stat-card"><strong>${totals.comments}</strong><span>Comments</span></div>
  `;

  document.querySelector("#myArticleList").innerHTML = appState.myArticles.length
    ? appState.myArticles.map(articleRow).join("")
    : `<div class="empty-state">No articles submitted yet.</div>`;
}

function renderAdmin() {
  document.querySelector("#reviewList").innerHTML = appState.pendingArticles.length
    ? appState.pendingArticles.map((article) => `
      <article class="review-row">
        <div class="chip-row">
          <span class="status-chip pending">Pending</span>
          <span class="chip">${escapeHtml(article.topic)}</span>
          <span class="chip">${escapeHtml(article.field)}</span>
        </div>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.summary)}</p>
        <p><strong>Author:</strong> ${escapeHtml(article.authorName)} · <strong>Tags:</strong> ${escapeHtml(article.tags.join(", "))}</p>
        <div class="row-actions">
          <button class="primary-action" data-approve="${article.id}">Approve</button>
          <button class="secondary-action" data-reject="${article.id}">Reject</button>
        </div>
      </article>
    `).join("")
    : `<div class="empty-state">No pending submissions.</div>`;
}

function articleRow(article) {
  return `
    <article class="article-row">
      <div class="chip-row">
        <span class="status-chip ${article.status}">${escapeHtml(article.status)}</span>
        <span class="chip">${escapeHtml(article.topic)}</span>
        <span class="chip">${escapeHtml(article.field)}</span>
      </div>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <p>${article.views_count} views · ${article.likes.length} likes · ${article.shares_count} shares · ${article.comments.length} comments</p>
    </article>
  `;
}

function renderArticle() {
  const article = appState.currentArticle;
  const reader = document.querySelector("#articleReader");
  if (!article) {
    reader.innerHTML = `<div class="empty-state">Article not found.</div>`;
    return;
  }

  reader.innerHTML = `
    <div class="reader-panel">
      <img class="reader-hero" src="${article.image}" alt="${escapeHtml(article.topic)} cover image">
      <div class="reader-body">
        <div class="chip-row">
          <span class="chip">${escapeHtml(article.topic)}</span>
          <span class="chip">${escapeHtml(article.field)}</span>
          ${(article.tags || []).map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <h2>${escapeHtml(article.title)}</h2>
        <div class="reader-meta">
          <span>${escapeHtml(article.authorName)}</span>
          <span>${formatDate(article.created_at)}</span>
          <span>${article.views_count} views</span>
          <span>${article.likes.length} likes</span>
          <span>${article.shares_count} shares</span>
          <span>${article.comments.length} comments</span>
        </div>
        <p class="reader-content">${escapeHtml(article.body)}</p>
        <div class="row-actions">
          <button class="primary-action" data-like-current>${hasLiked(article) ? "Liked" : "Like"}</button>
          <button class="secondary-action" data-share-current>Share</button>
        </div>
        <section>
          <h3>Comments</h3>
          <div class="article-list">${renderComments(article)}</div>
          ${appState.user ? `
            <form class="comment-form" id="commentForm">
              <textarea name="comment" rows="3" required placeholder="Add a thoughtful comment"></textarea>
              <button class="primary-action" type="submit">Post Comment</button>
            </form>
          ` : `<p class="auth-note">Log in to comment on this article.</p>`}
        </section>
      </div>
    </div>
  `;
}

function renderComments(article) {
  if (!article.comments.length) return `<div class="empty-state">No comments yet.</div>`;
  return article.comments
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((comment) => `<div class="comment"><strong>${escapeHtml(comment.profiles?.display_name || "Student")}</strong><p>${escapeHtml(comment.body)}</p></div>`)
    .join("");
}

function renderAuthMode() {
  const form = document.querySelector("#loginForm");
  form.querySelector("h2").textContent = appState.authMode === "login" ? "Log in to Artiaze" : "Create your Artiaze account";
  form.querySelector(".primary-action").textContent = appState.authMode === "login" ? "Log In" : "Create Account";
  document.querySelector("#modeSwitch").textContent = appState.authMode === "login" ? "Create a student account" : "Already have an account? Log in";
}

async function routeTo(route, options = {}) {
  if ((route === "submit" || route === "dashboard") && !appState.user) route = "auth";
  if (route === "admin" && !isAdmin()) route = appState.user ? "home" : "auth";

  appState.route = route;
  if (options.articleId) appState.articleId = options.articleId;
  if (route === "dashboard" || route === "submit") await loadDashboard();
  if (route === "admin") await loadAdmin();
  if (route === "article") await loadArticle(appState.articleId, options.incrementView);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function openArticle(articleId) {
  await routeTo("article", { articleId, incrementView: true });
}

async function submitArticle(form) {
  const data = new FormData(form);
  const tags = data.get("tags").split(",").map((tag) => tag.trim()).filter(Boolean);
  const { error } = await supabaseClient.from("articles").insert({
    author_id: appState.user.id,
    title: data.get("title").trim(),
    topic: data.get("topic").trim(),
    field: data.get("field"),
    tags,
    summary: data.get("summary").trim(),
    body: data.get("body").trim(),
    status: "pending"
  });

  if (error) {
    alert(error.message);
    return;
  }

  form.reset();
  await routeTo("dashboard");
}

async function handleLogin(form) {
  const data = new FormData(form);
  const email = data.get("email").trim().toLowerCase();
  const password = data.get("password");
  let response;

  if (appState.authMode === "login") {
    response = await supabaseClient.auth.signInWithPassword({ email, password });
  } else {
    response = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { display_name: titleCase(email.split("@")[0].replace(/[._-]/g, " ")) } }
    });
  }

  if (response.error) {
    alert(response.error.message);
    return;
  }

  form.reset();
  await routeTo("home");
}

async function toggleLike(articleId) {
  if (!appState.user) {
    await routeTo("auth");
    return;
  }

  const article = [...appState.homeArticles, appState.currentArticle].find((item) => item?.id === articleId);
  const liked = article?.likes.some((like) => like.user_id === appState.user.id);
  const query = supabaseClient.from("article_likes");

  const { error } = liked
    ? await query.delete().eq("article_id", articleId).eq("user_id", appState.user.id)
    : await query.insert({ article_id: articleId, user_id: appState.user.id });

  if (error) alert(error.message);
  await loadHome();
  if (appState.route === "article") await loadArticle(articleId);
  render();
}

async function shareArticle(articleId) {
  await supabaseClient.rpc("increment_article_share", { article_uuid: articleId });
  const shareUrl = `${location.href.split("#")[0]}#article-${articleId}`;
  if (navigator.share) await navigator.share({ title: "Artiaze article", url: shareUrl }).catch(() => {});
  else if (navigator.clipboard) await navigator.clipboard.writeText(shareUrl).catch(() => {});
  await loadHome();
  if (appState.route === "article") await loadArticle(articleId);
  render();
}

async function reviewArticle(articleId, status) {
  const patch = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  const { error } = await supabaseClient.from("articles").update(patch).eq("id", articleId);
  if (error) alert(error.message);
  await loadAdmin();
  await loadHome();
  render();
}

function hasLiked(article) {
  return Boolean(appState.user && article.likes.some((like) => like.user_id === appState.user.id));
}

function isAdmin() {
  return appState.profile?.role === "admin";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("click", async (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    await routeTo(routeButton.dataset.route);
    return;
  }

  const topicButton = event.target.closest("[data-topic]");
  if (topicButton) {
    document.querySelector("#topicFilter").value = topicButton.dataset.topic;
    renderHome();
    return;
  }

  const approveButton = event.target.closest("[data-approve]");
  if (approveButton) {
    await reviewArticle(approveButton.dataset.approve, "published");
    return;
  }

  const rejectButton = event.target.closest("[data-reject]");
  if (rejectButton) {
    await reviewArticle(rejectButton.dataset.reject, "rejected");
    return;
  }

  if (event.target.closest("#logoutButton")) {
    await supabaseClient.auth.signOut();
    await routeTo("home");
    return;
  }

  if (event.target.closest("#modeSwitch")) {
    appState.authMode = appState.authMode === "login" ? "signup" : "login";
    renderAuthMode();
    return;
  }

  if (event.target.closest("[data-like-current]")) {
    await toggleLike(appState.articleId);
    return;
  }

  if (event.target.closest("[data-share-current]")) {
    await shareArticle(appState.articleId);
  }
});

document.querySelector("#articleForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitArticle(event.currentTarget);
});

document.querySelector("#loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleLogin(event.currentTarget);
});

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "commentForm") return;
  event.preventDefault();
  const body = new FormData(event.target).get("comment").trim();
  const { error } = await supabaseClient.from("comments").insert({
    article_id: appState.articleId,
    user_id: appState.user.id,
    body
  });
  if (error) alert(error.message);
  await loadArticle(appState.articleId);
  renderArticle();
});

["#searchInput", "#topicFilter", "#fieldFilter", "#tagFilter", "#sortFilter"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", renderHome);
});

if (location.hash.startsWith("#article-")) {
  appState.articleId = location.hash.replace("#article-", "");
  appState.route = "article";
}
