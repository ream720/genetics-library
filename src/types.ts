export interface Seed {
  id: string; // Unique identifier
  breeder: string; // Breeder of the seed
  strain: string; // Strain type (e.g., indica, sativa, hybrid)
  generation: string; // Generation of the seed (e.g., F1, F2, etc.)
  numSeeds: number; // Number of seeds available
  feminized: boolean; // Whether the seeds are feminized
  open: boolean; // Whether the seed packet is open
  available: boolean;
  dateAcquired: string; // Date the seed was acquired
}

export interface Clone {
  id: string; // Unique identifier
  breeder: string; // Breeder of the clone
  strain: string; // Strain type
  cutName: string;
  generation: string; // Generation of the clone
  sex: "Male" | "Female"; // Dropdown selection for Male/Female
  breederCut: boolean; // True/False
  available: boolean; // True/False
  dateAcquired: string; // Date the clone was acquired
}
