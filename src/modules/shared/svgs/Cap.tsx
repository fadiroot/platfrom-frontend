import React from "react";

export default function Cap({ className }: { className: string }) {
  return (
    <div>
      <img
        width={50}
        height={50}
        className={`${className} block dark:hidden`}
        src="/doodles/cap-l.svg"
        alt="cap"
      />
      <img
        width={50}
        height={50}
        className={`${className} hidden dark:block`}
        src="/doodles/cap-d.svg"
        alt="cap"
      />
    </div>
  );
}
