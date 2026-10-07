// Screens scheduled for Stage 3c (SIP detail, Stop coach). Keeps every tab and link working
// (no dead ends) until the real screen lands.
import { ButtonLink } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { FlowHeader } from '../components/FlowHeader';

export function NotYetBuilt({ title, flow }: { title: string; flow: boolean }) {
  const body = (
    <EmptyState
      title={title}
      body="This part of the prototype arrives in the next build."
      action={
        <ButtonLink to="/home" className="mt-2">
          Back to Home
        </ButtonLink>
      }
    />
  );
  if (!flow) {
    return (
      <div className="space-y-4">
        <h1 className="sr-only">{title}</h1>
        {body}
      </div>
    );
  }
  return (
    <>
      <FlowHeader backTo="/home" closeTo="/home" title={title} />
      <main id="main" tabIndex={-1} className="mx-auto max-w-tablet px-safe pt-6 outline-none">
        <h1 className="sr-only">{title}</h1>
        {body}
      </main>
    </>
  );
}
