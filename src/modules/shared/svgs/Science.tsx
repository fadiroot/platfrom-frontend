

export default function Science({ className }: { className: string }) {
  return (
    <div>
      <img
        width={50}
        height={50}
        className={`${className} block dark:hidden`}
        src="/doodles/science-l.svg"
        alt="Science"
      />
      <img
        width={50}
        height={50}
        className={`${className} hidden dark:block`}
        src="/doodles/science-d.svg"
        alt="Science"
      />
    </div>
  );
}
