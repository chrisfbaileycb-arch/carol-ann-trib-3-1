import { Link } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="text-sm leading-relaxed text-slate-600 dark:text-white/70 space-y-2">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0C12]">
      <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <header className="space-y-2">
          <Link to="/" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Carol Ann
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-500 dark:text-white/40">Last updated: September 2026</p>
        </header>

        <Section title="What Carol Ann is">
          <p>
            Carol Ann is a women's platform — a personal AI companion and workspace app. This policy explains
            what information the app collects, how it is used, and the choices you have.
          </p>
        </Section>

        <Section title="Information we collect">
          <p>
            <strong>Account information.</strong> When you sign in, we receive your name and email address
            through Firebase Authentication (Google sign-in).
          </p>
          <p>
            <strong>Your workspace content.</strong> Messages you send, memories you save, errands, check-ins,
            and settings are stored in your private cloud workspace so they are available across your devices.
          </p>
          <p>
            <strong>Voice sessions.</strong> If you use live voice, your microphone audio is streamed to process
            your request and generate a spoken reply. Audio is processed in real time and is not kept as
            recordings beyond what is needed to run the session.
          </p>
          <p>
            <strong>Diagnostic information.</strong> Basic technical data (such as error reports and whether
            features are working) helps keep the app reliable.
          </p>
        </Section>

        <Section title="How your information is used">
          <p>
            Your information is used only to operate Carol Ann: to run the app, remember your workspace across
            sessions, and power AI features. AI features send your prompts to Google's Gemini API for processing.
            We do not sell your personal information, and we do not share it with advertisers.
          </p>
        </Section>

        <Section title="Who processes your data">
          <ul className="list-disc pl-5 space-y-1">
            <li>Firebase / Google Cloud — sign-in, database, and hosting.</li>
            <li>Google Gemini API — AI chat, voice, and speech features.</li>
          </ul>
          <p>
            These providers process data only to deliver the service, under their own terms and privacy policies.
          </p>
        </Section>

        <Section title="Demo and simulated features">
          <p>
            Some parts of the app are clearly labeled as a demo sandbox (for example, the connector directory).
            Demo features are simulated locally in your browser — nothing is transmitted to outside services.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can export or delete your workspace data from the app's settings at any time. Deleting your
            account removes your workspace content from our systems. API access requires you to be signed in —
            unauthenticated requests are rejected.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Data is encrypted in transit (TLS). Access to your workspace is tied to your sign-in and cannot be
            reached by other users. No system is perfectly secure, but we limit access to what each feature needs.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If this policy changes in a meaningful way, we will note it in the app. Continued use of Carol Ann
            after a change means you accept the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about privacy? Reach us through the feedback channel inside the app and we will respond.
          </p>
        </Section>
      </main>
    </div>
  );
}
