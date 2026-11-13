/**
 * Re-mounted on every navigation: a pomegranate (Anor) sheet wipes across the screen like a turned
 * page, then the new page is under it. Pure CSS, never takes clicks; off under reduced motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="jd-wipe pointer-events-none fixed inset-0 z-[90] bg-anor motion-reduce:hidden" />
      {children}
    </>
  );
}
