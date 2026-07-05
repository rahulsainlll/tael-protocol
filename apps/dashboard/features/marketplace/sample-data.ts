// Static sample data for the marketplace UI only. No fetching yet — this is
// replaced by real @tael/api queries when data wiring begins.

export type CapabilityCategory =
  "API" | "MCP" | "Agent" | "Workflow" | "Dataset" | "Browser" | "OCR" | "Model" | "Search";

export interface SampleCapability {
  id: string;
  name: string;
  description: string;
  creator: string;
  /** USDC per call, decimal string. */
  price: string;
  rating: number;
  successRate: number;
  latencyMs: number;
  category: CapabilityCategory;
}

export const categories: CapabilityCategory[] = [
  "API",
  "MCP",
  "Agent",
  "Workflow",
  "Dataset",
  "Browser",
  "OCR",
  "Model",
  "Search",
];

export const sampleCapabilities: SampleCapability[] = [
  {
    id: "cap_ocr",
    name: "Document OCR",
    description: "Extract structured text and tables from PDFs and scanned images.",
    creator: "visionlabs",
    price: "0.02",
    rating: 4.8,
    successRate: 99,
    latencyMs: 640,
    category: "OCR",
  },
  {
    id: "cap_search",
    name: "Live Web Search",
    description: "Real-time web results with citations, tuned for autonomous agents.",
    creator: "searchgrid",
    price: "0.01",
    rating: 4.6,
    successRate: 98,
    latencyMs: 420,
    category: "Search",
  },
  {
    id: "cap_company",
    name: "Company Records API",
    description: "Firmographic and registry data for millions of businesses worldwide.",
    creator: "dataworks",
    price: "0.05",
    rating: 4.7,
    successRate: 97,
    latencyMs: 810,
    category: "API",
  },
  {
    id: "cap_translate",
    name: "Neural Translation MCP",
    description: "High-quality translation across 90 languages via an MCP server.",
    creator: "linguacore",
    price: "0.008",
    rating: 4.5,
    successRate: 99,
    latencyMs: 380,
    category: "MCP",
  },
  {
    id: "cap_browser",
    name: "Headless Browser",
    description: "Navigate, click, and scrape any site from a sandboxed browser.",
    creator: "browserbase",
    price: "0.03",
    rating: 4.4,
    successRate: 95,
    latencyMs: 1200,
    category: "Browser",
  },
  {
    id: "cap_research",
    name: "Research Agent",
    description: "Multi-step research agent that compiles sourced reports on any topic.",
    creator: "deepthink",
    price: "0.25",
    rating: 4.9,
    successRate: 96,
    latencyMs: 5400,
    category: "Agent",
  },
];
