import { notFound } from "next/navigation";
import TestcaseManagerPage from "./TestcaseManagerPage";
import { IProblemPageData } from "@/types";

async function getProblemData(slug: string): Promise<IProblemPageData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/problem/${slug}`, {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching problem data:', error);
    return null;
  }
}

export default async function TestcasePage({ params }: { params: { slug: string } }) {
  const problem = await getProblemData(params.slug);
  
  if (!problem) {
    notFound();
  }
  
  return <TestcaseManagerPage problem={problem} slug={params.slug} />;
}
