import Image from "next/image";
import heroImage from "@/src/assets/images/hero-home.avif";

// Skeleton home page. Its only job right now is to prove the deployment path:
// a static-imported image and a framework chunk both have to come back with the
// /<repo> prefix, or the live site is broken in a way nothing local shows.
//
// The hero uses `fill` inside an aspect-ratio box rather than letting next/image
// read the file's intrinsic size. Two reasons, and either one alone is enough:
// Turbopack can't decode AVIF metadata and silently emits width=100 height=100
// (the webpack builder reads the same file as 2560x1086), and check-evidence.ts
// *requires* every starter image to be replaced before submission, so any
// hardcoded dimension pair is wrong the moment the course is actually written.
// With `fill` the geometry comes from CSS and neither problem can bite.
export default function Home() {
  return (
    <main>
      <h1>Slop University</h1>
      <div className="relative aspect-[21/9] w-full overflow-hidden">
        <Image
          src={heroImage}
          alt="A lecture theatre reduced to flat gold and black shapes, rows of seats sweeping past the frame, in a two-ink risograph print"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
    </main>
  );
}
