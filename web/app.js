import { activities, calendarEvents, friends, highlights, notes } from "./generated/ios-demo-data.js";

const image = (name) => `./public/images/${name}`;

const state = { tab: "plan", capture: "gate", highlight: 0, starred: new Set(), why: false, mic: "idle", modal: null };
const app = document.querySelector("#app");
let advanceTimer;

const firstName = (friend) => friend.name.split(" ")[0];
const byId = (id) => friends.find((friend) => friend.id === id);
const overlap = (tags, interests) => tags.some((tag) => interests.some((interest) => interest === tag || interest.includes(tag) || tag.includes(interest)));
const matches = (activity) => friends.filter((friend) => overlap(activity.tags, friend.interests));
const icon = (name) => `<span class="icon" aria-hidden="true">${name}</span>`;
const esc = (text) => String(text).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

function wordmark() { return `<button class="wordmark" data-action="reset-capture" aria-label="Circle, hold to reset capture">circle<span>.</span></button>`; }
function avatars(people) { return `<div class="avatar-stack">${people.slice(0, 3).reverse().map((friend) => `<img src="${image(friend.photo)}" alt="${esc(friend.name)}" />`).join("")}</div>`; }

function calendar() {
  return `<section class="calendar" aria-label="Week of September 16">
    <div class="calendar-head"><span></span>${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => `<div><small>${d}</small><b class="${i === 2 ? "today" : ""}">${16 + i}</b></div>`).join("")}</div>
    <div class="calendar-body"><div class="hours">${[9,10,11,12,1,2,3,4,5,6,7,8].map((hour) => `<span>${hour}</span>`).join("")}</div><div class="grid">${calendarEvents.map((event) => `<span class="event ${event.tone}" style="--day:${event.day};--start:${event.start};--duration:${event.duration}">${event.title}</span>`).join("")}</div></div>
  </section>`;
}

function activityCard(activity, glass = false, friend = null) {
  const people = friend ? [friend] : matches(activity);
  const fit = friend && activity.tags.find((tag) => overlap([tag], friend.interests));
  return `<button class="activity-card ${glass ? "glass-card" : ""}" data-activity="${activity.id}">
    <div class="activity-art"><img src="${image(activity.photo)}" alt="" />${glass && fit ? `<span class="art-tag dark">${fit}</span>` : `<span class="art-tag">${activity.tags[0]}</span>`}${!glass ? avatars(people) : ""}</div>
    <span class="activity-title">${activity.title}</span><span class="activity-meta">${activity.location} · ${activity.details}</span>${fit ? `<span class="fit">Fits their ${fit}</span>` : ""}
  </button>`;
}

function planView() {
  const order = [["sponsored", "Sponsored"], ["sideQuests", "Side quests"], ["afterHours", "After hours"], ["popupsAndMarkets", "Popups and markets"], ["moveYourBody", "Move your body"]];
  return `<section class="tab-screen scroll-screen plan-screen">${wordmark()}<h1>Salutations, Benjamin</h1>${calendar()}<h2>Hangout plans</h2>${order.map(([category, title]) => `<section class="activity-section"><p class="eyebrow ${category === "sponsored" ? "peach" : ""}">${title}</p><div class="activity-grid">${activities.filter((activity) => activity.category === category).map((activity) => activityCard(activity)).join("")}</div></section>`).join("")}</section>`;
}

function captureView() {
  if (state.capture === "reel") return reelView();
  const scanning = state.capture === "scanning";
  return `<section class="capture-screen"><div class="spheres" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>${wordmark()}<div class="capture-card">${scanning ? `<div class="spinner"></div><p class="scan-label">Scanning your photos</p><h2>Looking for moments with your circle…</h2>` : `${icon("⌗")}<p class="eyebrow">Photo-native</p><h2>Let Circle learn your circle.</h2><p class="capture-copy">Circle scans the photos on this device for the friends you've already added, matching against the reference photo already on each profile. It never uploads a photo.</p><button class="primary" data-action="scan">Scan my photos</button>`}</div></section>`;
}

function reelView() {
  const current = highlights[state.highlight % highlights.length];
  const isStarred = state.starred.has(current.id);
  const people = current.friendIds.map(byId);
  return `<section class="reel-screen" style="--reel:url('${image(current.photo)}')"><div class="reel-shade"></div>${wordmark()}<div class="reel-top"><div class="progress"><i style="width:${((state.highlight % highlights.length + 1) / highlights.length) * 100}%"></i></div><button class="reel-control" data-action="rescan" aria-label="Rescan photos">↻</button></div><button class="reel-tap" data-action="next-highlight" aria-label="Next highlight"></button><div class="reel-copy"><p>${current.caption}</p><small>${people.map((friend) => friend.name).join(" and ")} · ${current.place} · ${current.date}</small><div class="reel-actions"><button class="save ${isStarred ? "saved" : ""}" data-action="star">${isStarred ? "★ Saved" : "☆ Save this feeling"}</button><button class="why" data-action="why">Why this photo?</button></div>${state.why ? `<span class="why-copy">A recent memory, shown for variety.</span>` : ""}</div><div class="mic-wrap">${state.mic !== "idle" ? `<span class="mic-label">${state.mic === "listening" ? "Listening…" : "Saved privately on this device."}</span>` : ""}<button class="mic ${state.mic}" data-action="mic" aria-label="Record a voice note">${state.mic === "listening" ? "⌁" : "●"}</button></div></section>`;
}

function peopleView() {
  return `<section class="tab-screen scroll-screen people-screen">${wordmark()}<div class="people-grid">${friends.map((friend) => `<article class="person-card"><button data-friend="${friend.id}" aria-label="Open ${friend.name}"><span class="portrait"><img src="${image(friend.photo)}" alt="${esc(friend.name)}" /><b>${friend.name.split(" ").map((part) => part[0]).join("")}</b></span><span>${firstName(friend)}</span></button><textarea data-note="${friend.id}" rows="2" aria-label="Note about ${friend.name}">${esc(notes[friend.id])}</textarea></article>`).join("")}</div></section>`;
}

function modalView() {
  if (!state.modal) return "";
  if (state.modal.type === "friend") {
    const friend = state.modal.friend;
    const options = activities.filter((activity) => overlap(activity.tags, friend.interests)).slice(0, 8);
    return `<div class="modal-backdrop" data-action="close-modal"><section class="sheet friend-sheet" role="dialog" aria-modal="true" aria-label="${esc(friend.name)}" onclick="event.stopPropagation()"><button class="done" data-action="close-modal">Done</button><div class="friend-hero"><img src="${image(friend.photo)}" alt=""/><div><h2>${friend.name}</h2><p>${friend.interests.map((interest) => interest[0].toUpperCase() + interest.slice(1)).join(" · ")}</p><small>${friend.personality}</small></div></div><section><p class="eyebrow">Connect</p><div class="socials">${[["◎","Instagram"],["◉","WhatsApp"],["♙","Snapchat"],["𝕏","X"]].map(([mark, label]) => `<a href="https://www.google.com/search?q=${encodeURIComponent(friend.name + " " + label)}" target="_blank" rel="noreferrer"><b>${mark}</b><span>${label}</span></a>`).join("")}</div></section><section><p class="eyebrow">Perfect together</p><h2>Things you two might like</h2><div class="activity-grid detail-grid">${options.map((activity) => activityCard(activity, true, friend)).join("")}</div></section></section></div>`;
  }
  const activity = state.modal.activity;
  const people = matches(activity);
  const venue = venueFor(activity);
  return `<div class="modal-backdrop" data-action="close-modal"><section class="sheet event-sheet" role="dialog" aria-modal="true" aria-label="${esc(activity.title)}" onclick="event.stopPropagation()"><header><button class="share" data-action="share">↗</button><button class="done" data-action="close-modal">Done</button></header><div class="event-hero"><img src="${image(activity.photo)}" alt=""/><div><span>${activity.tags[0]}</span><h2>${activity.title}</h2><p>${activity.location} · ${activity.details}</p></div></div><section><p class="eyebrow">About</p><p class="about">A ${venue.vibe.toLowerCase()} ${activity.tags[0]} plan at ${activity.location}, ${activity.details.toLowerCase()}. Make a low-pressure plan, send it to the people shown above, and keep the details in one place.</p></section><div class="facts"><div>▣<small>When</small><b>${activity.details}</b></div><div>♧<small>Best with</small><b>${people.length ? people.map(firstName).join(", ") : "Your circle"}</b></div><div>◷<small>Time to plan</small><b>${venue.window}</b></div><div>✦<small>Vibe</small><b>${venue.vibe}</b></div></div><section><p class="eyebrow">Where to go</p><a class="map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location + " Sydney")}" target="_blank" rel="noreferrer"><span>⌖</span><b>${activity.location}</b><small>${venue.address}</small></a></section>${people.length ? `<section><p class="eyebrow">Fits your circle</p><div class="friends-fit">${people.map((friend) => `<span><img src="${image(friend.photo)}" alt="${esc(friend.name)}"/>${firstName(friend)}</span>`).join("")}</div></section>` : ""}<section><p class="eyebrow">Plan it</p><div class="link-list">${[["⌖", "Open in Maps", venue.address], ["◉", "Find tickets", "Search Eventbrite"], ["⌂", "Visit venue site", "Hours and event info"], ["⌕", "Search the web", `${activity.title} · ${activity.location}`]].map(([mark, title, subtitle]) => `<a href="https://www.google.com/search?q=${encodeURIComponent(activity.title + " " + activity.location)}" target="_blank" rel="noreferrer"><b>${mark}</b><span>${title}<small>${subtitle}</small></span><i>›</i></a>`).join("")}</div></section></section></div>`;
}

function venueFor(activity) {
  const data = { "beginner-bouldering": ["2–14 Wilson St, Newtown", "Book by Tuesday", "Active and easy"], "clay-social": ["18 Goodhope St, Paddington", "Spaces move fast", "Hands-on and slow"], "harbour-jazz": ["42 King St, Newtown", "Arrive by 7:30pm", "Late-night and lively"], "run-club": ["Darling Harbour, Sydney", "Just show up", "Fresh-air and social"], "morning-swim": ["1 Notts Ave, Bondi Beach", "Meet at sunrise", "Bracing and bright"], "night-market": ["Haymarket, Sydney", "Go hungry", "Loose and delicious"] };
  const [address = "Sydney, NSW", window = "Make a plan this week", vibe = "Easygoing and local"] = data[activity.id] || [];
  return { address, window, vibe };
}

function render() {
  clearInterval(advanceTimer);
  const view = state.tab === "plan" ? planView() : state.tab === "capture" ? captureView() : peopleView();
  app.innerHTML = `<div class="app-shell ${state.tab === "capture" && state.capture === "reel" ? "is-reel" : ""}">${view}<nav aria-label="Primary navigation">${[["plan", "▣", "Plan"], ["capture", "✦", "Capture"], ["people", "♧", "People"]].map(([tab, glyph, label]) => `<button class="${state.tab === tab ? "active" : ""}" data-tab="${tab}"><b>${glyph}</b><span>${label}</span></button>`).join("")}</nav></div>${modalView()}`;
  if (state.capture === "reel") advanceTimer = setInterval(() => { state.highlight = (state.highlight + 1) % highlights.length; state.why = false; render(); }, 7000);
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("button, [data-friend], [data-activity]");
  if (!target) return;
  const { action, tab, activity: activityId, friend: friendId } = target.dataset;
  if (tab) { state.tab = tab; render(); return; }
  if (activityId) { state.modal = { type: "activity", activity: activities.find((activity) => activity.id === activityId) }; render(); return; }
  if (friendId) { state.modal = { type: "friend", friend: byId(friendId) }; render(); return; }
  if (action === "scan" || action === "rescan") { state.capture = "scanning"; render(); setTimeout(() => { state.capture = "reel"; render(); }, 900); }
  if (action === "next-highlight") { state.highlight = (state.highlight + 1) % highlights.length; state.why = false; render(); }
  if (action === "star") { const current = highlights[state.highlight % highlights.length]; state.starred.has(current.id) ? state.starred.delete(current.id) : state.starred.add(current.id); render(); }
  if (action === "why") { state.why = !state.why; render(); }
  if (action === "mic" && state.mic === "idle") { state.mic = "listening"; render(); setTimeout(() => { state.mic = "saved"; render(); setTimeout(() => { state.mic = "idle"; render(); }, 2000); }, 1600); }
  if (action === "close-modal") { state.modal = null; render(); }
  if (action === "share" && navigator.share) navigator.share({ title: state.modal.activity.title, text: `${state.modal.activity.title} at ${state.modal.activity.location}: ${state.modal.activity.details}` });
});

app.addEventListener("input", (event) => { if (event.target.matches("[data-note]")) notes[event.target.dataset.note] = event.target.value; });
let hold;
app.addEventListener("pointerdown", (event) => { if (event.target.closest('[data-action="reset-capture"]')) hold = setTimeout(() => { state.capture = "gate"; state.starred.clear(); render(); }, 600); });
app.addEventListener("pointerup", () => clearTimeout(hold));
app.addEventListener("pointercancel", () => clearTimeout(hold));
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && state.modal) { state.modal = null; render(); } });

render();
