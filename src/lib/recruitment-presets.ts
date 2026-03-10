import type { EnrichmentFormat } from "./exa-types";

export interface EnrichmentPreset {
  id: string;
  label: string;
  icon: string; // lucide icon name
  description: string;
  format: EnrichmentFormat;
  prompt: string;
  options?: Array<{ label: string }>;
}

export const RECRUITMENT_PRESETS: EnrichmentPreset[] = [
  {
    id: "email",
    label: "Work Email",
    icon: "Mail",
    description: "Professional email address",
    format: "text",
    prompt: "Find the professional or work email address for this person. Return only the email address.",
  },
  {
    id: "phone",
    label: "Phone",
    icon: "Phone",
    description: "Phone number",
    format: "text",
    prompt: "Find the phone number for this person. Return only the phone number.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "Linkedin",
    description: "LinkedIn profile URL",
    format: "url",
    prompt: "Find the LinkedIn profile URL for this person.",
  },
  {
    id: "company",
    label: "Current Company",
    icon: "Building2",
    description: "Where they currently work",
    format: "text",
    prompt: "What company does this person currently work at? Return the company name.",
  },
  {
    id: "title",
    label: "Job Title",
    icon: "Briefcase",
    description: "Current job title",
    format: "text",
    prompt: "What is this person's current job title? Return only the title.",
  },
  {
    id: "experience",
    label: "Years of Experience",
    icon: "Clock",
    description: "Professional experience",
    format: "number",
    prompt: "How many years of professional experience does this person have? Return a number.",
  },
  {
    id: "skills",
    label: "Key Skills",
    icon: "Code",
    description: "Technical and professional skills",
    format: "text",
    prompt: "What are this person's key technical and professional skills? List the top 5-8 skills, comma separated.",
  },
  {
    id: "education",
    label: "Education",
    icon: "GraduationCap",
    description: "Highest education",
    format: "text",
    prompt: "What is this person's highest level of education and which institution did they attend?",
  },
  {
    id: "location",
    label: "Location",
    icon: "MapPin",
    description: "Current location",
    format: "text",
    prompt: "Where is this person currently located? Return the city and country.",
  },
  {
    id: "github",
    label: "GitHub",
    icon: "Github",
    description: "GitHub profile URL",
    format: "url",
    prompt: "Find the GitHub profile URL for this person.",
  },
  {
    id: "availability",
    label: "Open to Work",
    icon: "UserCheck",
    description: "Likely open to opportunities",
    format: "options",
    prompt: "Based on available signals (recent job changes, 'open to work' badges, etc.), is this person likely open to new job opportunities?",
    options: [
      { label: "Likely" },
      { label: "Unlikely" },
      { label: "Unknown" },
    ],
  },
];
