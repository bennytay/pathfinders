export type University = {
  value: string;
  domain: string;
};

// The visual badge is the official favicon served by each university's own domain.
export const universities: University[] = [
  { value: "ANU", domain: "anu.edu.au" }, { value: "University of Melbourne", domain: "unimelb.edu.au" },
  { value: "Monash", domain: "monash.edu" }, { value: "UNSW", domain: "unsw.edu.au" },
  { value: "USYD", domain: "sydney.edu.au" }, { value: "UQ", domain: "uq.edu.au" },
  { value: "University of Adelaide", domain: "adelaide.edu.au" }, { value: "UWA", domain: "uwa.edu.au" },
  { value: "UTS", domain: "uts.edu.au" }, { value: "Macquarie", domain: "mq.edu.au" },
  { value: "RMIT", domain: "rmit.edu.au" }, { value: "QUT", domain: "qut.edu.au" },
  { value: "Deakin", domain: "deakin.edu.au" }, { value: "Curtin", domain: "curtin.edu.au" },
  { value: "Griffith", domain: "griffith.edu.au" }, { value: "University of Wollongong", domain: "uow.edu.au" },
  { value: "Western Sydney", domain: "westernsydney.edu.au" }, { value: "University of Newcastle", domain: "newcastle.edu.au" },
  { value: "Flinders", domain: "flinders.edu.au" }, { value: "Swinburne", domain: "swinburne.edu.au" },
  { value: "La Trobe", domain: "latrobe.edu.au" }, { value: "Victoria University", domain: "vu.edu.au" },
  { value: "Murdoch", domain: "murdoch.edu.au" }, { value: "ACU", domain: "acu.edu.au" },
];

export function universityFor(value: string) { return universities.find((university) => university.value === value) ?? { value, domain: "example.edu.au" }; }

export function UniversityMark({ university, label = false, className = "" }: { university: string; label?: boolean; className?: string }) {
  const item = universityFor(university);
  return <span className={`university-mark ${className}`} title={item.value}><span aria-hidden="true"><Image src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=128`} width={128} height={128} unoptimized alt=""/></span>{label ? <b>{item.value}</b> : null}</span>;
}
import Image from "next/image";
