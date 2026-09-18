import { activities, calendarEvents, friends, highlights, mapClusters, notes, profile as defaultProfile } from "./generated/ios-demo-data.js";

const app = document.querySelector("#app");
const image = (name) => `./public/images/${name}`;
const labels = { sponsored: "Sponsored", sideQuests: "Side quests", afterHours: "After hours", popupsAndMarkets: "Popups and markets", moveYourBody: "Move your body" };
const categoryOrder = ["sponsored", "sideQuests", "afterHours", "popupsAndMarkets", "moveYourBody"];
const state = { tab: "plan", capture: "gate", highlight: 0, starred: new Set(), modal: null, permission: false, profile: { ...defaultProfile } };
let reelTimer;

const firstName = (person) => person.name.split(" ")[0];
const friend = (id) => friends.find((person) => person.id === id);
const overlap = (tags, interests) => tags.some((tag) => interests.some((interest) => interest === tag || interest.includes(tag) || tag.includes(interest)));
const matchingFriends = (activity) => friends.filter((person) => overlap(activity.tags, person.interests));
const esc = (text) => String(text).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);

function profileImage() {
  const fallback = friend(state.profile.profileImageName);
  return fallback ? fallback.photo : friends[0].photo;
}

function header({ reel = false } = {}) {
  return `<header class="app-header ${reel ? "reel-header" : ""}">
    <button class="profile-avatar" data-action="profile" aria-label="Edit your profile"><img src="${image(profileImage())}" alt="" /></button>
    <button class="wordmark" data-action="reset" aria-label="Reset Capture">circle<span>.</span></button>
    <span class="header-spacer"></span>${reel ? `<button class="round-control" data-action="rescan" aria-label="Rescan photos">↻</button>` : ""}
  </header>`;
}

function avatarStack(people) {
  return `<span class="avatar-stack">${people.slice(0, 3).reverse().map((person) => `<img src="${image(person.photo)}" alt="${esc(person.name)}" />`).join("")}</span>`;
}

function activityCard(activity, compact = false, person = null) {
  const matches = person ? [person] : matchingFriends(activity);
  const match = person && activity.tags.find((tag) => overlap([tag], person.interests));
  return `<button class="activity-card ${compact ? "compact-card" : ""}" data-activity="${activity.id}">
    <span class="activity-art"><img src="${image(activity.photo)}" alt="" /><i>${activity.tags[0]}</i>${compact && match ? "" : avatarStack(matches)}</span>
    <b>${activity.title}</b><small>${activity.location} · ${activity.details}</small>${match ? `<em>Fits their ${match}</em>` : ""}
  </button>`;
}

function calendar() {
  return `<section class="calendar" aria-label="Week of September 16"><div class="calendar-days"><span></span>${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => `<span><small>${day}</small><b class="${index === 2 ? "today" : ""}">${16 + index}</b></span>`).join("")}</div><div class="calendar-grid"><div class="hours">${[9,10,11,12,1,2,3,4,5,6,7,8].map((hour) => `<span>${hour}</span>`).join("")}</div><div class="time-grid">${calendarEvents.map((event) => `<i class="calendar-event ${event.tone}" style="--day:${event.day};--start:${event.start};--duration:${event.duration}">${event.title}</i>`).join("")}</div></div></section>`;
}

function mapView() {
  const positions = [[16,67], [50,43], [38,64], [76,29], [83,72]];
  return `<section class="map-screen"><div class="map-canvas"><div class="map-water"></div><div class="map-grid"></div><div class="map-label label-one">REDFERN</div><div class="map-label label-two">HAYMARKET</div><div class="map-label label-three">DARLING HARBOUR</div>${mapClusters.map((cluster, index) => `<button class="map-marker" data-cluster="${cluster.id}" style="--x:${positions[index][0]}%;--y:${positions[index][1]}%" aria-label="${cluster.activityIds.length} nearby plans in ${cluster.name}"><span>${["✦","♫","⌁","◐","⌂"][index]}</span><b>${cluster.activityIds.length}</b></button>`).join("")}<div class="home-pin">⌖</div></div><div class="map-top"><button class="profile-avatar" data-action="profile" aria-label="Edit your profile"><img src="${image(profileImage())}" alt="" /></button><div class="nearby"><small>Near you</small><b>${state.profile.profileNeighbourhood}</b></div><button class="round-control locate" aria-label="Centre map">⌖</button></div></section>`;
}

function planView() {
  const givenName = state.profile.profileName.split(" ")[0] || "Benjamin";
  return `<section class="scroll-screen plan-screen">${header()}<section class="greeting"><h1>Hi ${esc(givenName)}</h1><p>Your week, with room for something good.</p></section>${calendar()}<section class="section-intro"><h2>Hangout plans</h2><p>Ideas worth making time for</p></section>${categoryOrder.map((category) => `<section class="activity-section"><p class="eyebrow ${category === "sponsored" ? "peach" : ""}">${labels[category]}</p><div class="activity-grid">${activities.filter((activity) => activity.category === category).map((activity) => activityCard(activity)).join("")}</div></section>`).join("")}</section>`;
}

function captureView() {
  if (state.capture === "reel") return reelView();
  const scanning = state.capture === "scanning";
  return `<section class="capture-screen"><div class="orbs" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>${header()}<div class="capture-card">${scanning ? `<span class="spinner"></span><p class="scan-status">Scanning your photos</p><h2>Looking for moments with your circle…</h2>` : `<span class="viewfinder">⌗</span><p class="eyebrow">Photo access</p><h2>Make space for your memories.</h2><p>Give Circle access to your full library to create a private highlight reel with the friends you’ve already added. Photos never leave this device.</p><button class="primary" data-action="request-access">Give access to full library</button>`}</div></section>`;
}

function reelView() {
  const current = highlights[state.highlight % highlights.length];
  const saved = state.starred.has(current.id);
  const names = current.friendIds.map(friend).map((person) => person.name).join(" and ");
  return `<section class="reel-screen" style="--photo:url('${image(current.photo)}')"><div class="reel-gradient"></div>${header({ reel: true })}<button class="reel-tap" data-action="next-reel" aria-label="Next photo"></button><div class="reel-copy"><p>${current.caption}</p><small>${names} · ${current.place} · ${current.date}</small><button class="save-star ${saved ? "saved" : ""}" data-action="star" aria-label="${saved ? "Remove saved photo" : "Save photo"}">${saved ? "★" : "☆"}</button></div></section>`;
}

function peopleView() {
  return `<section class="scroll-screen people-screen">${header()}<div class="people-grid">${friends.map((person) => `<article class="person-card"><button data-friend="${person.id}" aria-label="Open ${person.name}"><span><img src="${image(person.photo)}" alt="${esc(person.name)}" /><i>${person.name.split(" ").map((part) => part[0]).join("")}</i></span><b>${firstName(person)}</b></button><textarea data-note="${person.id}" rows="2" aria-label="Note about ${person.name}">${esc(notes[person.id] || "")}</textarea></article>`).join("")}</div></section>`;
}

function liquidNav() {
  return `<nav class="liquid-nav" aria-label="Primary navigation">${[["map","⌁","Map"],["plan","▣","Plan"],["capture","✦","Capture"],["people","♧","People"]].map(([tab, icon, title]) => `<button class="${state.tab === tab ? "active" : ""}" data-tab="${tab}"><b>${icon}</b><span>${title}</span></button>`).join("")}</nav>`;
}

function clusterSheet(cluster) {
  const clusterActivities = cluster.activityIds.map((id) => activities.find((activity) => activity.id === id)).filter(Boolean);
  return `<div class="modal-backdrop" data-action="close"><section class="sheet cluster-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><p class="eyebrow">Near ${cluster.name}</p><h2>Plans in ${cluster.name}</h2><div class="cluster-scroll">${clusterActivities.map((activity) => activityCard(activity, true)).join("")}</div></section></div>`;
}

function profileSheet() {
  const options = friends.slice(0, 5);
  return `<div class="modal-backdrop" data-action="close"><section class="sheet profile-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><button class="done" data-action="close">Done</button><div class="profile-hero"><img src="${image(profileImage())}" alt="" /><h2>Choose a profile photo</h2><div>${options.map((person) => `<button class="choice ${person.id === state.profile.profileImageName ? "chosen" : ""}" data-profile-image="${person.id}"><img src="${image(person.photo)}" alt="Use ${person.name}" /></button>`).join("")}</div></div><label>Name<input data-profile="profileName" value="${esc(state.profile.profileName)}" /></label><label>Your neighbourhood<input data-profile="profileNeighbourhood" value="${esc(state.profile.profileNeighbourhood)}" /></label><label>A little about you<textarea data-profile="profileBio" rows="3">${esc(state.profile.profileBio)}</textarea></label><p class="private-note">⌾ These details stay on this device. Circle only uses them to make local suggestions feel more like you.</p></section></div>`;
}

function friendSheet(person) {
  const suggestions = activities.filter((activity) => overlap(activity.tags, person.interests)).slice(0, 8);
  return `<div class="modal-backdrop" data-action="close"><section class="sheet friend-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><button class="done" data-action="close">Done</button><div class="friend-hero"><img src="${image(person.photo)}" alt=""/><div><h2>${person.name}</h2><p>${person.interests.map((item) => item[0].toUpperCase() + item.slice(1)).join(" · ")}</p><small>${person.personality}</small></div></div><section><p class="eyebrow">Connect</p><div class="socials">${[["◎","Instagram"],["◉","WhatsApp"],["♙","Snapchat"],["𝕏","X"]].map(([symbol, label]) => `<a href="https://www.google.com/search?q=${encodeURIComponent(person.name + " " + label)}" target="_blank" rel="noreferrer"><b>${symbol}</b>${label}</a>`).join("")}</div></section><section><p class="eyebrow">Perfect together</p><h2>Things you two might like</h2><div class="activity-grid">${suggestions.map((activity) => activityCard(activity, true, person)).join("")}</div></section></section></div>`;
}

function eventSheet(activity) {
  const people = matchingFriends(activity);
  return `<div class="modal-backdrop" data-action="close"><section class="sheet event-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><header><button aria-label="Share this plan" data-action="share">↗</button><button class="done" data-action="close">Done</button></header><div class="event-hero"><img src="${image(activity.photo)}" alt=""/><div><i>${activity.tags[0]}</i><h2>${activity.title}</h2><p>${activity.location} · ${activity.details}</p></div></div><section><p class="eyebrow">About</p><p class="about">A low-pressure ${activity.tags[0]} plan at ${activity.location}, ${activity.details.toLowerCase()}. Make a plan, send it to the people shown below, and keep the details in one place.</p></section><div class="facts"><div><small>When</small><b>${activity.details}</b></div><div><small>Best with</small><b>${people.length ? people.map(firstName).join(", ") : "Your circle"}</b></div><div><small>Vibe</small><b>Easygoing and local</b></div><div><small>Plan it</small><b>Make time this week</b></div></div><section><p class="eyebrow">Fits your circle</p><div class="friends-fit">${people.map((person) => `<span><img src="${image(person.photo)}" alt="${person.name}"/>${firstName(person)}</span>`).join("")}</div></section></section></div>`;
}

function permissionDialog() {
  return `<div class="permission-backdrop"><section class="permission-dialog" role="dialog" aria-modal="true"><span>▧</span><h2>Allow “Circle” to access your photos?</h2><p>Circle uses your library to create a private highlight reel. Photos stay on this device.</p><button data-action="select-photos">Select Photos…</button><button data-action="allow-full">Allow Full Access</button><button data-action="deny">Don’t Allow</button></section></div>`;
}

function modal() {
  if (state.permission) return permissionDialog();
  if (!state.modal) return "";
  if (state.modal.type === "cluster") return clusterSheet(state.modal.cluster);
  if (state.modal.type === "profile") return profileSheet();
  if (state.modal.type === "friend") return friendSheet(state.modal.person);
  return eventSheet(state.modal.activity);
}

function render() {
  clearInterval(reelTimer);
  const view = state.tab === "map" ? mapView() : state.tab === "plan" ? planView() : state.tab === "capture" ? captureView() : peopleView();
  app.innerHTML = `<div class="preview-stage"><div class="iphone"><div class="iphone-shell"><div class="speaker"></div><div class="status-bar"><span>9:41</span><span>▮▮▮ ◔</span></div><main class="phone-app ${state.tab === "map" ? "map-mode" : ""}">${view}${liquidNav()}</main><div class="home-indicator"></div></div></div><p class="desktop-caption">Circle · interactive iPhone preview</p></div>${modal()}`;
  if (state.capture === "reel") reelTimer = setInterval(() => { state.highlight = (state.highlight + 1) % highlights.length; render(); }, 7000);
}

// Modal sheets stop bubbling so backdrop taps stay local. Capture the event at
// the app root so controls inside those sheets, including Done, still work.
app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action], [data-tab], [data-friend], [data-activity], [data-cluster], [data-profile-image]");
  if (!target) return;
  const { action, tab, activity: activityId, friend: friendId, cluster: clusterId, profileImage } = target.dataset;
  if (tab) { state.tab = tab; render(); return; }
  if (activityId) { state.modal = { type: "activity", activity: activities.find((activity) => activity.id === activityId) }; render(); return; }
  if (friendId) { state.modal = { type: "friend", person: friend(friendId) }; render(); return; }
  if (clusterId) { state.modal = { type: "cluster", cluster: mapClusters.find((cluster) => cluster.id === clusterId) }; render(); return; }
  if (profileImage) { state.profile.profileImageName = profileImage; render(); return; }
  if (action === "profile") { state.modal = { type: "profile" }; render(); return; }
  if (action === "request-access") { state.permission = true; render(); return; }
  if (action === "allow-full" || action === "select-photos") { state.permission = false; state.capture = "scanning"; render(); setTimeout(() => { state.capture = "reel"; render(); }, 900); return; }
  if (action === "deny") { state.permission = false; render(); return; }
  if (action === "rescan") { state.capture = "scanning"; render(); setTimeout(() => { state.capture = "reel"; render(); }, 900); return; }
  if (action === "next-reel") { state.highlight = (state.highlight + 1) % highlights.length; render(); return; }
  if (action === "star") { const current = highlights[state.highlight % highlights.length]; state.starred.has(current.id) ? state.starred.delete(current.id) : state.starred.add(current.id); render(); return; }
  if (action === "reset") { state.capture = "gate"; state.starred.clear(); render(); return; }
  if (action === "close") { state.modal = null; render(); return; }
  if (action === "share" && navigator.share) navigator.share({ title: state.modal.activity.title, text: `${state.modal.activity.title} at ${state.modal.activity.location}` });
}, true);

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-note]")) notes[event.target.dataset.note] = event.target.value;
  if (event.target.matches("[data-profile]")) state.profile[event.target.dataset.profile] = event.target.value;
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && (state.modal || state.permission)) { state.modal = null; state.permission = false; render(); } });

render();
