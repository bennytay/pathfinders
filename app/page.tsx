import { getFixtureWorkspace, validateFixtureWorkspace } from "@/lib/fixtures";

export default function Home() {
  const workspace = getFixtureWorkspace();
  const fixtureIssues = validateFixtureWorkspace(workspace);
  return <main className="shell">
    <p className="eyebrow">InnerCircle · Phase 1 foundation</p>
    <h1>Private context for the people you choose.</h1>
    <p className="lede">InnerCircle is a local-first, voice-first context layer for a deliberately small circle of close friends. It helps turn a reflection into a user-reviewed opportunity to meet in person.</p>
    <section className="notice" aria-label="Fixture mode status" data-testid="fixture-mode"><strong>Fixture mode is on.</strong><p>This workspace is fully synthetic, requires no account, API key, or network connection, and contains no recordings.</p></section>
    <section className="grid" aria-label="Product boundaries">
      <article className="card"><h2>Your data stays under your control</h2><p>Raw audio, transcripts, proposals, and confirmed memories are separate records. Future processing choices will be shown per note.</p></article>
      <article className="card"><h2>No relationship score</h2><p>Future prompts will explain their inputs, honour a chosen cadence, and never rank friends or push messages.</p></article>
      <article className="card"><h2>Plans remain drafts</h2><p>InnerCircle will not send outreach, write calendars, import contacts, or act on someone’s behalf.</p></article>
    </section>
    <section className="card" aria-labelledby="fixture-heading"><h2 id="fixture-heading">Synthetic beta fixture</h2><p>Testing scope: one user, one city ({workspace.city}), and at most five active friends.</p><div className="fixture-list">{workspace.friends.map((friend) => <div className="fixture" key={friend.id}><strong>{friend.displayName}</strong><span>Chosen cadence: every {friend.cadenceDays} days · Confirmed interests: {friend.confirmedInterests.join(", ")}</span></div>)}</div>{fixtureIssues.length > 0 && <p role="alert">Fixture validation failed: {fixtureIssues.join(" ")}</p>}</section>
    <footer className="footer">Read <code>docs/product-contract.md</code>, <code>docs/privacy-model.md</code>, and <code>docs/contributing.md</code> in this repository.</footer>
  </main>;
}
