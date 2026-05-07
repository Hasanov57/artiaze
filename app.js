const STORAGE_KEY = "artiaze_state_v2";
const SESSION_KEY = "artiaze_session_v2";

const topicImages = {
  AI: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1100&q=80",
  Cybersecurity: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1100&q=80",
  Web: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1100&q=80",
  Robotics: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1100&q=80",
  Data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1100&q=80",
  Cloud: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1100&q=80",
  Hardware: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1100&q=80"
};

const seedState = {
  users: [
    { id: "admin", name: "Artiaze Admin", email: "admin@artiaze.com", password: "admin123", role: "admin" },
    { id: "u1", name: "Leyla Hasan", email: "leyla@student.com", password: "1234", role: "student" },
    { id: "u2", name: "Murat Aliyev", email: "murat@student.com", password: "1234", role: "student" }
  ],
  articles: [
    {
      id: "a1",
      title: "Why small AI models matter for student projects",
      topic: "AI",
      field: "Artificial Intelligence",
      tags: ["machine learning", "education", "ethics"],
      summary: "Compact AI models make classroom experiments faster, cheaper, and easier to explain.",
      body: "Large models get attention, but smaller models can be the better learning tool. They run faster, cost less, and make it easier for students to see how data, training, testing, and evaluation work together.\n\nFor schools, this matters because practical experimentation is often more valuable than theory alone. A small model can classify images, summarize notes, or detect patterns without needing a huge budget.\n\nThe next step is responsible use. Students should document datasets, test bias, and explain limitations before presenting AI output as fact.",
      authorId: "u1",
      status: "published",
      createdAt: "2026-05-01T10:30:00.000Z",
      image: topicImages.AI,
      views: 148,
      shares: 21,
      likedBy: ["u2"],
      comments: [
        { id: "c1", userId: "u2", text: "The point about explainability is strong. Small models are easier to defend in class.", createdAt: "2026-05-02T09:20:00.000Z" }
      ]
    },
    {
      id: "a2",
      title: "A beginner map for safer password systems",
      topic: "Cybersecurity",
      field: "Cybersecurity",
      tags: ["security", "authentication", "privacy"],
      summary: "Password security is less about clever tricks and more about careful storage, rate limits, and recovery design.",
      body: "A safer password system starts with one rule: never store plain text passwords. Applications should store salted password hashes and protect the login flow with sensible rate limits.\n\nStudents building their first authentication project should also think about recovery. Password reset links need expiration times, single-use tokens, and clear account notifications.\n\nSecurity improves when every piece of the journey is considered together: signup, login, reset, logout, and suspicious activity handling.",
      authorId: "u2",
      status: "published",
      createdAt: "2026-05-03T12:00:00.000Z",
      image: topicImages.Cybersecurity,
      views: 96,
      shares: 13,
      likedBy: ["u1"],
      comments: []
    },
    {
      id: "a3",
      title: "Can robotics clubs teach better teamwork?",
      topic: "Robotics",
      field: "Robotics",
      tags: ["robots", "teamwork", "engineering"],
      summary: "Robotics projects force students to combine coding, mechanics, planning, and calm communication.",
      body: "A robotics club is not only about building a machine. It is a live test of collaboration. One student may understand sensors, another may handle CAD, and another may debug control software.\n\nThe best teams make work visible. They keep simple task boards, document failures, and review prototypes together. That habit turns technical frustration into shared progress.\n\nRobotics also makes abstract engineering decisions visible. A weak battery, a shaky wheel, or a slow loop becomes a lesson everyone can see.",
      authorId: "u1",
      status: "published",
      createdAt: "2026-05-05T15:15:00.000Z",
      image: topicImages.Robotics,
      views: 73,
      shares: 7,
      likedBy: [],
      comments: []
    },
    {
      id: "a4",
      title: "What students should know before deploying a first web app",
      topic: "Web",
      field: "Software Engineering",
      tags: ["deployment", "web", "cloud"],
      summary: "Deployment introduces logs, environment variables, uptime, and security decisions that local projects can hide.",
      body: "Publishing a web app is a turning point. The code leaves the laptop and meets real network conditions, real users, and real mistakes.\n\nBefore deploying, students should understand environment variables, build commands, logs, backups, and basic access control. They should also test forms, empty states, loading states, and mobile layouts.\n\nA first deployment does not need to be complex. It needs to be observable, reversible, and honest about what can break.",
      authorId: "u2",
      status: "pending",
      createdAt: "2026-05-07T18:15:00.000Z",
      image: topicImages.Web,
      views: 0,
      shares: 0,
      likedBy: [],
      comments: []
    }
  ]
};

let state = loadState();
let session = loadSession();
let currentRoute = "home";
let currentArticleId = null;

const views = {
  home: document.querySelector("#homeView"),
  submit: document.querySelector("#submitView"),
  dashboard: document.querySelector("#dashboardView"),
  admin: document.querySelector("#adminView"),
  article: document.querySelector("#articleView"),
  auth: document.querySelector("#authView")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedState));
    return structuredClone(seedState);
  }
  return JSON.parse(saved);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSession() {
  const saved = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  return saved ? JSON.parse(saved) : null;
}

function saveSession(userId, remember) {
  session = { userId };
  const target = remember ? localStorage : sessionStorage;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  target.setItem(SESSION_KEY, JSON.stringify(session));
}

function currentUser() {
  return session ? state.users.find((user) => user.id === session.userId) : null;
}

function getAuthor(article) {
  return state.users.find((user) => user.id === article.authorId) || { name: "Unknown student" };
}

function routeTo(route, options = {}) {
  const user = currentUser();
  if ((route === "submit" || route === "dashboard") && !user) {
    currentRoute = "auth";
  } else if (route === "admin" && user?.role !== "admin") {
    currentRoute = user ? "home" : "auth";
  } else {
    currentRoute = route;
  }

  if (options.articleId) {
    currentArticleId = options.articleId;
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  Object.values(views).forEach((view) => view.classList.add("hidden"));
  views[currentRoute].classList.remove("hidden");
  renderAccount();
  renderAdminNav();

  if (currentRoute === "home") renderHome();
  if (currentRoute === "submit") renderSubmissionHint();
  if (currentRoute === "dashboard") renderDashboard();
  if (currentRoute === "admin") renderAdmin();
  if (currentRoute === "article") renderArticle();
}

function renderAccount() {
  const area = document.querySelector("#accountArea");
  const user = currentUser();
  if (!user) {
    area.innerHTML = `<button class="secondary-action" data-route="auth">Log In</button>`;
    return;
  }
  area.innerHTML = `
    <div class="user-pill"><span class="avatar">${escapeHtml(user.name[0])}</span><span>${escapeHtml(user.name)}</span></div>
    <button class="secondary-action" id="logoutButton">Log Out</button>
  `;
}

function renderAdminNav() {
  document.querySelector(".admin-link").classList.toggle("hidden", currentUser()?.role !== "admin");
}

function renderHome() {
  fillFilterOptions();
  renderTopicStrip();
  const articles = filteredArticles();
  const grid = document.querySelector("#articleGrid");
  if (!articles.length) {
    grid.innerHTML = `<div class="empty-state">No published articles match these filters.</div>`;
    return;
  }

  const template = document.querySelector("#articleCardTemplate");
  grid.innerHTML = "";
  articles.forEach((article) => {
    const card = template.content.cloneNode(true);
    const cardRoot = card.querySelector(".article-card");
    const image = card.querySelector("img");
    image.src = article.image || topicImages[article.topic] || topicImages.Web;
    image.alt = `${article.topic} article cover`;
    card.querySelector("h3").textContent = article.title;
    card.querySelector("p").textContent = article.summary;
    card.querySelector(".chip-row").innerHTML = `
      <span class="chip">${escapeHtml(article.topic)}</span>
      <span class="chip">${escapeHtml(article.field)}</span>
    `;
    card.querySelector(".card-meta").textContent = `${getAuthor(article).name} · ${formatDate(article.createdAt)} · ${article.views} views · ${article.comments.length} comments`;
    card.querySelector(".read-button").addEventListener("click", () => openArticle(article.id));
    card.querySelector(".like-button").classList.toggle("active", hasLiked(article));
    card.querySelector(".like-button").textContent = `♡ ${article.likedBy.length}`;
    card.querySelector(".like-button").addEventListener("click", () => likeArticle(article.id));
    card.querySelector(".share-button").addEventListener("click", () => shareArticle(article.id));
    cardRoot.addEventListener("dblclick", () => openArticle(article.id));
    grid.appendChild(card);
  });
}

function fillFilterOptions() {
  const published = state.articles.filter((article) => article.status === "published");
  const topics = unique(published.map((article) => article.topic));
  const fields = unique(published.map((article) => article.field));
  const tags = unique(published.flatMap((article) => article.tags));
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
  const published = state.articles.filter((article) => article.status === "published");
  const counts = published.reduce((acc, article) => {
    acc[article.topic] = (acc[article.topic] || 0) + 1;
    return acc;
  }, {});
  const selected = document.querySelector("#topicFilter").value;
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

  return state.articles
    .filter((article) => article.status === "published")
    .filter((article) => !topic || article.topic === topic)
    .filter((article) => !field || article.field === field)
    .filter((article) => !tag || article.tags.includes(tag))
    .filter((article) => {
      if (!query) return true;
      const haystack = [article.title, article.topic, article.field, article.summary, article.body, ...article.tags, getAuthor(article).name].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => {
      if (sort === "views") return b.views - a.views;
      if (sort === "likes") return b.likedBy.length - a.likedBy.length;
      if (sort === "comments") return b.comments.length - a.comments.length;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function renderSubmissionHint() {
  const user = currentUser();
  const articles = state.articles.filter((article) => article.authorId === user?.id);
  const pending = articles.filter((article) => article.status === "pending").length;
  const published = articles.filter((article) => article.status === "published").length;
  document.querySelector("#submissionHint").innerHTML = `
    <p>Your submitted articles are sent to the admin review queue before publication.</p>
    <div class="status-chip pending">Pending ${pending}</div>
    <div class="status-chip published">Published ${published}</div>
  `;
}

function renderDashboard() {
  const user = currentUser();
  const articles = state.articles.filter((article) => article.authorId === user.id);
  const totals = articles.reduce((acc, article) => {
    acc.views += article.views;
    acc.likes += article.likedBy.length;
    acc.shares += article.shares;
    acc.comments += article.comments.length;
    return acc;
  }, { views: 0, likes: 0, shares: 0, comments: 0 });

  document.querySelector("#myStats").innerHTML = `
    <div class="stat-card"><strong>${totals.views}</strong><span>Views</span></div>
    <div class="stat-card"><strong>${totals.likes}</strong><span>Likes</span></div>
    <div class="stat-card"><strong>${totals.shares}</strong><span>Shares</span></div>
    <div class="stat-card"><strong>${totals.comments}</strong><span>Comments</span></div>
  `;

  const list = document.querySelector("#myArticleList");
  if (!articles.length) {
    list.innerHTML = `<div class="empty-state">No articles submitted yet.</div>`;
    return;
  }
  list.innerHTML = articles
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((article) => articleRow(article, false))
    .join("");
}

function renderAdmin() {
  const pending = state.articles.filter((article) => article.status === "pending");
  const list = document.querySelector("#reviewList");
  if (!pending.length) {
    list.innerHTML = `<div class="empty-state">No pending submissions.</div>`;
    return;
  }
  list.innerHTML = pending.map((article) => `
    <article class="review-row">
      <div class="chip-row">
        <span class="status-chip pending">Pending</span>
        <span class="chip">${escapeHtml(article.topic)}</span>
        <span class="chip">${escapeHtml(article.field)}</span>
      </div>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <p><strong>Author:</strong> ${escapeHtml(getAuthor(article).name)} · <strong>Tags:</strong> ${escapeHtml(article.tags.join(", "))}</p>
      <div class="row-actions">
        <button class="primary-action" data-approve="${article.id}">Approve</button>
        <button class="secondary-action" data-reject="${article.id}">Reject</button>
      </div>
    </article>
  `).join("");
}

function articleRow(article, includeActions = true) {
  return `
    <article class="article-row">
      <div class="chip-row">
        <span class="status-chip ${article.status}">${escapeHtml(article.status)}</span>
        <span class="chip">${escapeHtml(article.topic)}</span>
        <span class="chip">${escapeHtml(article.field)}</span>
      </div>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <p>${article.views} views · ${article.likedBy.length} likes · ${article.shares} shares · ${article.comments.length} comments</p>
      ${includeActions ? `<div class="row-actions"><button class="text-button" data-open="${article.id}">Open</button></div>` : ""}
    </article>
  `;
}

function openArticle(articleId) {
  const article = state.articles.find((item) => item.id === articleId);
  if (!article || article.status !== "published") return;
  article.views += 1;
  saveState();
  routeTo("article", { articleId });
}

function renderArticle() {
  const article = state.articles.find((item) => item.id === currentArticleId);
  const reader = document.querySelector("#articleReader");
  if (!article) {
    reader.innerHTML = `<div class="empty-state">Article not found.</div>`;
    return;
  }
  const user = currentUser();
  reader.innerHTML = `
    <div class="reader-panel">
      <img class="reader-hero" src="${article.image || topicImages.Web}" alt="${escapeHtml(article.topic)} cover image">
      <div class="reader-body">
        <div class="chip-row">
          <span class="chip">${escapeHtml(article.topic)}</span>
          <span class="chip">${escapeHtml(article.field)}</span>
          ${article.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <h2>${escapeHtml(article.title)}</h2>
        <div class="reader-meta">
          <span>${escapeHtml(getAuthor(article).name)}</span>
          <span>${formatDate(article.createdAt)}</span>
          <span>${article.views} views</span>
          <span>${article.likedBy.length} likes</span>
          <span>${article.shares} shares</span>
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
          ${user ? `
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
    .map((comment) => `<div class="comment"><strong>${escapeHtml(state.users.find((user) => user.id === comment.userId)?.name || "Student")}</strong><p>${escapeHtml(comment.text)}</p></div>`)
    .join("");
}

function likeArticle(articleId) {
  const user = currentUser();
  if (!user) {
    routeTo("auth");
    return;
  }
  const article = state.articles.find((item) => item.id === articleId);
  if (!article) return;
  const index = article.likedBy.indexOf(user.id);
  if (index >= 0) article.likedBy.splice(index, 1);
  else article.likedBy.push(user.id);
  saveState();
  render();
}

function hasLiked(article) {
  const user = currentUser();
  return Boolean(user && article.likedBy.includes(user.id));
}

async function shareArticle(articleId) {
  const article = state.articles.find((item) => item.id === articleId);
  if (!article) return;
  article.shares += 1;
  saveState();
  const shareText = `${article.title} - Artiaze`;
  const shareUrl = `${location.href.split("#")[0]}#article-${article.id}`;
  if (navigator.share) {
    await navigator.share({ title: shareText, url: shareUrl }).catch(() => {});
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareUrl).catch(() => {});
  }
  render();
}

function submitArticle(form) {
  const user = currentUser();
  const data = new FormData(form);
  const topic = data.get("topic").trim();
  const article = {
    id: crypto.randomUUID(),
    title: data.get("title").trim(),
    topic,
    field: data.get("field"),
    tags: data.get("tags").split(",").map((tag) => tag.trim()).filter(Boolean),
    summary: data.get("summary").trim(),
    body: data.get("body").trim(),
    authorId: user.id,
    status: "pending",
    createdAt: new Date().toISOString(),
    image: topicImages[topic] || topicImages.Web,
    views: 0,
    shares: 0,
    likedBy: [],
    comments: []
  };
  state.articles.push(article);
  saveState();
  form.reset();
  routeTo("dashboard");
}

function handleLogin(form) {
  const data = new FormData(form);
  const email = data.get("email").trim().toLowerCase();
  const password = data.get("password");
  let user = state.users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      name: titleCase(email.split("@")[0].replace(/[._-]/g, " ")),
      email,
      password,
      role: "student"
    };
    state.users.push(user);
    saveState();
  }

  if (user.password !== password || password.length < 4) {
    alert("Email or password is not correct.");
    return;
  }

  saveSession(user.id, data.get("remember") === "on");
  form.reset();
  routeTo(user.role === "admin" ? "admin" : "home");
}

function approveArticle(articleId) {
  const article = state.articles.find((item) => item.id === articleId);
  if (!article) return;
  article.status = "published";
  saveState();
  renderAdmin();
}

function rejectArticle(articleId) {
  const article = state.articles.find((item) => item.id === articleId);
  if (!article) return;
  article.status = "rejected";
  saveState();
  renderAdmin();
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

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    routeTo(routeButton.dataset.route);
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
    approveArticle(approveButton.dataset.approve);
    return;
  }

  const rejectButton = event.target.closest("[data-reject]");
  if (rejectButton) {
    rejectArticle(rejectButton.dataset.reject);
    return;
  }

  if (event.target.closest("#logoutButton")) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    session = null;
    routeTo("home");
    return;
  }

  if (event.target.closest("[data-like-current]")) {
    likeArticle(currentArticleId);
    return;
  }

  if (event.target.closest("[data-share-current]")) {
    shareArticle(currentArticleId);
  }
});

document.querySelector("#articleForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitArticle(event.currentTarget);
});

document.querySelector("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  handleLogin(event.currentTarget);
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "commentForm") return;
  event.preventDefault();
  const user = currentUser();
  const article = state.articles.find((item) => item.id === currentArticleId);
  const form = event.target;
  article.comments.push({
    id: crypto.randomUUID(),
    userId: user.id,
    text: new FormData(form).get("comment").trim(),
    createdAt: new Date().toISOString()
  });
  saveState();
  renderArticle();
});

["#searchInput", "#topicFilter", "#fieldFilter", "#tagFilter", "#sortFilter"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", renderHome);
});

if (location.hash.startsWith("#article-")) {
  currentArticleId = location.hash.replace("#article-", "");
  currentRoute = "article";
}

render();
