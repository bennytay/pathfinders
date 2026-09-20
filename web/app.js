import { activities, calendarEvents, friends, highlights, mapClusters, notes, profile as defaultProfile } from "./generated/ios-demo-data.js";

const app = document.querySelector("#app");
const image = (name) => `./public/images/${name}`;
const labels = { sponsored: "Sponsored", sideQuests: "Side quests", afterHours: "After hours", popupsAndMarkets: "Popups and markets", moveYourBody: "Move your body" };
const categoryOrder = ["sponsored", "sideQuests", "afterHours", "popupsAndMarkets", "moveYourBody"];
const state = { tab: "plan", capture: "gate", highlight: 0, starred: new Set(), modal: null, permission: false, profile: { ...defaultProfile } };
let reelTimer;

const icons = {
  map: '<path d="M3.5 5.5 8.75 3l6.5 2.5L20.5 3v15.5L15.25 21l-6.5-2.5-5.25 2.5V5.5Z"/><path d="M8.75 3v15.5m6.5-13v15.5"/>',
  plan: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M7.5 3v4m9-4v4M3.5 9.5h17"/><path d="M7.5 13h.01m4.5 0h.01m4.5 0h.01M7.5 17h.01m4.5 0h.01m4.5 0h.01"/>',
  capture: '<path d="m12 2 .75 3.35A5.35 5.35 0 0 0 16.65 9L20 9.75l-3.35.75a5.35 5.35 0 0 0-3.9 3.65L12 17.5l-.75-3.35a5.35 5.35 0 0 0-3.9-3.65L4 9.75 7.35 9a5.35 5.35 0 0 0 3.9-3.65L12 2Z"/><path d="m19 15 .42 1.58A3 3 0 0 0 21 18l-1.58.42A3 3 0 0 0 18 20l-.42-1.58A3 3 0 0 0 16 17l1.58-.42A3 3 0 0 0 19 15Z"/>',
  people: '<circle cx="8.5" cy="8" r="3.5"/><circle cx="17" cy="9" r="3"/><path d="M2.5 20c.4-4 2.3-6 6-6s5.6 2 6 6m-.5-5.2c3.7-.5 6.3 1.2 7 4.7"/>',
  locate: '<path d="m12 21 2.1-6.9L21 12 3 4l8 18Z"/>',
  run: '<circle cx="13" cy="4.5" r="2"/><path d="m10.5 8-2.8 4.2 3.2 2.1-2.2 5.2M11 8l4 3 3.5.2M11 14.3l4 1.7 2.4 4"/>',
  music: '<path d="M9 18V6l10-2v11M9 10l10-2"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15" r="2.5"/>',
  moon: '<path d="M20.5 15.5A8 8 0 0 1 8.5 3.7 8.5 8.5 0 1 0 20.5 15.5Z"/><path d="m16.5 4 .45 1.3L18.3 6l-1.35.7L16.5 8l-.45-1.3L14.7 6l1.35-.7L16.5 4Z"/>',
  camera: '<path d="M8 4.5h8M4.5 8V6.5a2 2 0 0 1 2-2H8M19.5 8V6.5a2 2 0 0 0-2-2H16M4.5 16v1.5a2 2 0 0 0 2 2H8m11.5-3.5v1.5a2 2 0 0 1-2 2H16"/><circle cx="12" cy="12" r="4"/>',
  refresh: '<path d="M19 7V3.5L16.7 5.8A8 8 0 1 0 20 12"/><path d="M19 3.5h-3.5"/>',
  star: '<path d="m12 3 2.65 5.35 5.9.86-4.28 4.17 1.01 5.89L12 16.5l-5.28 2.77 1.01-5.89-4.28-4.17 5.9-.86L12 3Z"/>',
  share: '<path d="M12 16V3m0 0L7.5 7.5M12 3l4.5 4.5"/><path d="M7 11H5.5A2.5 2.5 0 0 0 3 13.5v5A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-5a2.5 2.5 0 0 0-2.5-2.5H17"/>',
};

function icon(name, className = "") {
  return `<svg class="symbol ${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}

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
    <button class="wordmark" data-action="reset" aria-label="Reset Capture">circle</button>
    <span class="header-spacer"></span>${reel ? `<button class="round-control" data-action="rescan" aria-label="Rescan photos">${icon("refresh")}</button>` : ""}
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
  const markerIcons = ["run", "music", "run", "moon", "run"];
  return `<section class="map-screen"><div class="map-canvas"><svg class="map-art" viewBox="0 0 400 860" aria-hidden="true"><rect width="400" height="860" fill="#e3e6e2"/><path d="M302 -20 C342 119 287 188 338 291 C378 369 329 427 384 514 L435 545 L435 -20Z" fill="#a9ccdc"/><path d="M17 550 C78 521 112 542 147 598 C118 643 67 671 9 646Z" fill="#bfd6b1"/><path d="M236 154 C267 127 309 145 320 194 C295 224 245 224 218 191Z" fill="#c4dcb6"/><path d="M-28 178 C70 151 116 176 183 149 C232 129 258 77 322 65" fill="none" stroke="#c5c7c4" stroke-width="13"/><path d="M-28 178 C70 151 116 176 183 149 C232 129 258 77 322 65" fill="none" stroke="#f6f7f4" stroke-width="8"/><path d="M39 -15 C56 87 92 135 75 221 C58 313 99 378 75 471 C55 552 116 612 181 682 C231 735 254 804 249 884" fill="none" stroke="#c5c7c4" stroke-width="12"/><path d="M39 -15 C56 87 92 135 75 221 C58 313 99 378 75 471 C55 552 116 612 181 682 C231 735 254 804 249 884" fill="none" stroke="#f6f7f4" stroke-width="7"/><path d="M-14 394 C76 361 122 392 179 408 C239 426 290 396 414 409" fill="none" stroke="#d6a476" stroke-width="11"/><path d="M-14 394 C76 361 122 392 179 408 C239 426 290 396 414 409" fill="none" stroke="#fff7ef" stroke-width="6"/><g fill="none" stroke="#fff" stroke-width="4"><path d="M-15 89 C84 102 137 65 226 94 C267 108 292 141 345 151"/><path d="M-20 278 C64 259 123 286 183 266 C238 249 278 274 343 259"/><path d="M-15 494 C64 462 138 479 204 510 C262 538 326 510 417 547"/><path d="M-10 704 C62 680 109 707 169 735 C225 762 284 744 411 775"/><path d="M135 -12 C157 56 151 111 183 180 C215 249 196 316 218 380 C239 438 221 490 252 565 C273 613 321 652 347 716"/><path d="M284 -10 C249 42 252 101 278 145 C300 180 282 238 305 294 C329 354 304 415 327 473"/></g><g fill="none" stroke="#d0d2cf" stroke-width="1.5"><path d="M-8 119 C68 130 130 96 208 121 C260 138 305 180 386 176"/><path d="M-12 231 C77 208 124 231 190 217 C252 204 307 230 404 211"/><path d="M-10 330 C79 315 124 336 192 323 C250 312 304 337 414 323"/><path d="M-8 570 C76 550 112 582 174 608 C234 634 296 613 411 647"/><path d="M-5 639 C62 624 118 646 181 681 C234 710 295 697 414 721"/><path d="M108 -6 C102 66 117 109 103 167 C91 224 115 278 105 340 C95 398 120 451 111 514"/><path d="M190 -12 C207 43 197 93 221 146 C246 203 232 250 249 308 C271 377 252 431 270 494"/></g></svg><span class="map-park-label park-one">Prince Alfred Park</span><span class="map-park-label park-two">Hyde Park</span><span class="map-road-label road-one">Cleveland St</span><span class="map-road-label road-two">Crown St</span><span class="map-road-label road-three">Oxford St</span><div class="map-label label-one">REDFERN</div><div class="map-label label-two">HAYMARKET</div><div class="map-label label-three">DARLING HARBOUR</div>${mapClusters.map((cluster, index) => `<button class="map-marker" data-cluster="${cluster.id}" style="--x:${positions[index][0]}%;--y:${positions[index][1]}%" aria-label="${cluster.activityIds.length} nearby plans in ${cluster.name}">${icon(markerIcons[index])}<b>${cluster.activityIds.length}</b><small>${cluster.name}</small></button>`).join("")}<div class="home-pin">${icon("locate")}</div></div><div class="map-top"><button class="profile-avatar" data-action="profile" aria-label="Edit your profile"><img src="${image(profileImage())}" alt="" /></button><div class="nearby"><small>Near you</small><b>${state.profile.profileNeighbourhood}</b></div><button class="round-control locate" aria-label="Centre map">${icon("locate")}</button></div></section>`;
}

function planView() {
  const givenName = state.profile.profileName.split(" ")[0] || "Benjamin";
  return `<section class="scroll-screen plan-screen">${header()}<section class="greeting"><h1>Hi ${esc(givenName)}</h1><p>Your week, with room for something good.</p></section>${calendar()}<section class="section-intro"><h2>Hangout plans</h2><p>Ideas worth making time for</p></section>${categoryOrder.map((category) => `<section class="activity-section"><p class="eyebrow ${category === "sponsored" ? "peach" : ""}">${labels[category]}</p><div class="activity-grid">${activities.filter((activity) => activity.category === category).map((activity) => activityCard(activity)).join("")}</div></section>`).join("")}</section>`;
}

function captureView() {
  if (state.capture === "reel") return reelView();
  const scanning = state.capture === "scanning";
  return `<section class="capture-screen"><div class="orbs" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>${header()}<div class="capture-card">${scanning ? `<span class="spinner"></span><p class="scan-status">Scanning your photos</p><h2>Looking for moments with your circle…</h2>` : `<span class="viewfinder">${icon("camera")}</span><p class="eyebrow">PHOTO ACCESS</p><h2>Make space for your memories.</h2><p>Give Circle access to your full library to create a private highlight reel with the friends you’ve already added. Photos never leave this device.</p><button class="primary" data-action="request-access">Give access to full library</button>`}</div></section>`;
}

function reelView() {
  const current = highlights[state.highlight % highlights.length];
  const saved = state.starred.has(current.id);
  const names = current.friendIds.map(friend).map((person) => person.name).join(" and ");
  return `<section class="reel-screen" style="--photo:url('${image(current.photo)}')"><div class="reel-gradient"></div>${header({ reel: true })}<button class="reel-tap" data-action="next-reel" aria-label="Next photo"></button><div class="reel-copy"><p>${current.caption}</p><small>${names} · ${current.place} · ${current.date}</small><button class="save-star ${saved ? "saved" : ""}" data-action="star" aria-label="${saved ? "Remove saved photo" : "Save photo"}">${icon("star")}</button></div></section>`;
}

function peopleView() {
  return `<section class="scroll-screen people-screen">${header()}<div class="people-grid">${friends.map((person) => `<article class="person-card"><button data-friend="${person.id}" aria-label="Open ${person.name}"><span><img src="${image(person.photo)}" alt="${esc(person.name)}" /><i>${person.name.split(" ").map((part) => part[0]).join("")}</i></span><b>${firstName(person)}</b></button><textarea data-note="${person.id}" rows="2" aria-label="Note about ${person.name}">${esc(notes[person.id] || "")}</textarea></article>`).join("")}</div></section>`;
}

function liquidNav() {
  return `<nav class="liquid-nav" aria-label="Primary navigation">${[["map","map","Map"],["plan","plan","Plan"],["capture","capture","Capture"],["people","people","People"]].map(([tab, symbol, title]) => `<button class="${state.tab === tab ? "active" : ""}" data-tab="${tab}">${icon(symbol)}<span>${title}</span></button>`).join("")}</nav>`;
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
  const socialIcons = [["social-instagram.png","Instagram"],["social-whatsapp.png","WhatsApp"],["social-snapchat.png","Snapchat"],["social-x.png","X"]];
  return `<div class="modal-backdrop" data-action="close"><section class="sheet friend-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><button class="done" data-action="close">Done</button><div class="friend-hero"><img src="${image(person.photo)}" alt=""/><div><h2>${person.name}</h2><p>${person.interests.map((item) => item[0].toUpperCase() + item.slice(1)).join(" · ")}</p><small>${person.personality}</small></div></div><section><p class="eyebrow">CONNECT</p><div class="socials">${socialIcons.map(([source, label]) => `<a href="https://www.google.com/search?q=${encodeURIComponent(person.name + " " + label)}" target="_blank" rel="noreferrer"><b><img src="${image(source)}" alt="" /></b>${label}</a>`).join("")}</div></section><section><p class="eyebrow">PERFECT TOGETHER</p><h2>Things you two might like</h2><div class="activity-grid">${suggestions.map((activity) => activityCard(activity, true, person)).join("")}</div></section></section></div>`;
}

function venueFor(activity) {
  const venues = {
    "beginner-bouldering": ["2–14 Wilson St, Newtown", "Book by Tuesday", "Active and easy"],
    "clay-social": ["18 Goodhope St, Paddington", "Spaces move fast", "Hands-on and slow"],
    "harbour-jazz": ["42 King St, Newtown", "Arrive by 7:30pm", "Late-night and lively"],
    "rooftop-cinema": ["80 Commonwealth St, Surry Hills", "Choose seats early", "Relaxed and cinematic"],
    "foreign-film": ["80 Commonwealth St, Surry Hills", "Choose seats early", "Relaxed and cinematic"],
    "run-club": ["Darling Harbour, Sydney", "Just show up", "Fresh-air and social"],
    "park-pilates": ["Darling Harbour, Sydney", "Just show up", "Fresh-air and social"],
    "vintage-market": ["245 Wilson St, Eveleigh", "Best before lunch", "Wandering and curious"],
    "record-fair": ["245 Wilson St, Eveleigh", "Best before lunch", "Wandering and curious"],
    "silent-reading": ["Surry Hills, Sydney", "Save a spot", "Quiet and thoughtful"],
    "book-launch": ["Surry Hills, Sydney", "Save a spot", "Quiet and thoughtful"],
    "warehouse-dance": ["Marrickville, Sydney", "Doors open early", "Noisy and spontaneous"],
    "open-mic": ["Marrickville, Sydney", "Doors open early", "Noisy and spontaneous"],
    "morning-swim": ["1 Notts Ave, Bondi Beach", "Meet at sunrise", "Bracing and bright"],
    "night-market": ["Haymarket, Sydney", "Go hungry", "Loose and delicious"],
    "pasta-club": ["Haymarket, Sydney", "Go hungry", "Loose and delicious"],
  };
  const [address, planningWindow, vibe] = venues[activity.id] || ["Sydney, NSW", "Make a plan this week", "Easygoing and local"];
  return { address, planningWindow, vibe };
}

function eventSheet(activity) {
  const people = matchingFriends(activity);
  const venue = venueFor(activity);
  const mapQuery = encodeURIComponent(`${activity.location} ${venue.address}`);
  const planRows = [
    ["Open in Apple Maps", venue.address, `https://maps.apple.com/?q=${mapQuery}`],
    ["Open in Google Maps", "Directions and reviews", `https://www.google.com/maps/search/?api=1&query=${mapQuery}`],
    ["Find tickets", "Search Eventbrite", `https://www.eventbrite.com/d/search/?q=${encodeURIComponent(activity.title)}`],
    ["Visit venue site", "Hours and event info", `https://www.google.com/search?q=${encodeURIComponent(`${activity.location} official site`)}`],
    ["Search the web", `${activity.title} · ${activity.location}`, `https://www.google.com/search?q=${encodeURIComponent(`${activity.title} ${activity.location}`)}`],
  ];
  return `<div class="modal-backdrop" data-action="close"><section class="sheet event-sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()"><header><button class="share" aria-label="Share this plan" data-action="share">${icon("share")}</button><button class="done" data-action="close">Done</button></header><div class="event-hero"><img src="${image(activity.photo)}" alt=""/><div><i>${activity.tags[0]}</i><h2>${activity.title}</h2><p>${activity.location} · ${activity.details}</p></div></div><section><p class="eyebrow">ABOUT</p><p class="about">A ${venue.vibe.toLowerCase()} ${activity.tags[0]} plan at ${activity.location}, ${activity.details.toLowerCase()}. Make a low-pressure plan, send it to the people shown above, and keep the details in one place.</p></section><div class="facts"><div><small>WHEN</small><b>${activity.details}</b></div><div><small>BEST WITH</small><b>${people.length ? people.map(firstName).join(", ") : "Your circle"}</b></div><div><small>TIME TO PLAN</small><b>${venue.planningWindow}</b></div><div><small>VIBE</small><b>${venue.vibe}</b></div></div><section><p class="eyebrow">WHERE TO GO</p><div class="venue-map"><span>${activity.location}</span><i></i></div><p class="venue-address">● <span>${venue.address}</span></p></section>${people.length ? `<section><p class="eyebrow">FITS YOUR CIRCLE</p><div class="friends-fit">${people.map((person) => `<span><img src="${image(person.photo)}" alt="${person.name}"/>${firstName(person)}</span>`).join("")}</div></section>` : ""}<section class="plan-it"><p class="eyebrow">PLAN IT</p><div class="plan-links">${planRows.map(([title, subtitle, href]) => `<a href="${href}" target="_blank" rel="noreferrer"><span class="link-icon">${icon("locate")}</span><span><b>${title}</b><small>${subtitle}</small></span><strong>›</strong></a>`).join("")}</div></section></section></div>`;
}

function permissionDialog() {
  return `<div class="permission-backdrop"><section class="permission-dialog" role="dialog" aria-modal="true"><span>${icon("camera")}</span><h2>Allow “Circle” to access your photos?</h2><p>Circle uses your library to create a private highlight reel. Photos stay on this device.</p><button data-action="select-photos">Select Photos…</button><button data-action="allow-full">Allow Full Access</button><button data-action="deny">Don’t Allow</button></section></div>`;
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
  app.innerHTML = `<div class="preview-stage"><div class="iphone"><div class="iphone-shell"><div class="speaker"></div><div class="status-bar"><span>9:41</span><span>▮▮▮ ◔</span></div><main class="phone-app ${state.tab === "map" ? "map-mode" : ""}">${view}${liquidNav()}</main><div class="home-indicator"></div>${modal()}</div></div><p class="desktop-caption">Circle · interactive iPhone preview</p></div>`;
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
