export interface Seed {
  id: string; // Unique identifier
  breeder: string; // Breeder of the seed
  strain: string; // Strain type (e.g., indica, sativa, hybrid)
  generation: string; // Generation of the seed (e.g., F1, F2, etc.)
  numSeeds: number; // Number of seeds available
  feminized: boolean; // Whether the seeds are feminized
  open: boolean; // Whether the seed packet is open
  dateAcquired: string; // Date the seed was acquired
}
