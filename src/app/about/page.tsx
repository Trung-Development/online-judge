import { Config } from "@/config";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: `About - ${Config.siteDescription}`,
  description: "About the YACPS Online Judge project.",
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-extrabold mb-4">About This Project</h1>

      <section className="prose mb-6">
        <p>
          This project is an online judge platform built to be fast, reliable,
          and developer-friendly. It aims to provide a modern experience for
          problem authors, contest organizers, and competitive programmers by
          combining a polished frontend with a robust backend judged by
          reproducible and secure runtimes.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Mission</h2>
        <p className="text-muted-foreground">
          Make creating, running, and grading programming problems simple and
          maintainable. We focus on clarity for problem authors, safety and
          isolation for execution, and fast feedback for competitors.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Key features</h2>
        <ul className="list-disc ml-6 text-base">
          <li>
            Authoring UI for creating and managing problems (slug, tests,
            limits).
          </li>
          <li>
            Flexible runtimes and language support with per-problem allowed
            languages.
          </li>
          <li>
            Accurate and isolated judge execution using containerized runners.
          </li>
          <li>
            Permissioned APIs for roles (authors, curators, admins) and secure
            client-server forwarding.
          </li>
          <li>
            Extensible architecture: checkers, graders, and test harness
            integrations.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Tech stack</h2>
        <p className="text-base">
          The project combines a TypeScript React frontend (Next.js App Router)
          with a NestJS + Prisma backend. The runtime/test harnesses use
          containerized execution for secure, reproducible judging.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Contributing</h2>
        <p className="text-base">
          Contributions are welcome. Please follow the repository&apos;s
          contribution guidelines. Small fixes, styling improvements, and
          end-to-end tests are especially helpful.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Credits</h2>
        <p className="text-base">
          Created by{" "}
          <a
            href="https://github.com/vuthanhtrung2010"
            className="text-red-600"
          >
            devtrung
          </a>{" "}
          (Vũ Thành Trung) and{" "}
          <a href="https://github.com/kasdvn17" className="text-red-600">
            blamm01
          </a>{" "}
          (Nguyễn Hà Bảo Lâm).
        </p>
      </section>

      <footer className="text-sm text-muted-foreground">
        <p>Last updated: Aug 25, 2025</p>
      </footer>
    </main>
  );
}
