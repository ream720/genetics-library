import { Clone, Seed } from "../../types";
import { ProjectSourceSnapshot, SourceType } from "../../types/v2";
import { v4 as uuidv4 } from "uuid";

const nowIsoString = () => new Date().toISOString();

export const createSeedSourceSnapshot = (
  seed: Seed
): ProjectSourceSnapshot => ({
  snapshotId: uuidv4(),
  sourceType: "seed",
  sourceId: seed.id,
  breeder: seed.breeder,
  strain: seed.strain,
  lineage: seed.lineage,
  generation: seed.generation,
  copiedAt: nowIsoString(),
});

export const createCloneSourceSnapshot = (
  clone: Clone
): ProjectSourceSnapshot => ({
  snapshotId: uuidv4(),
  sourceType: "clone",
  sourceId: clone.id,
  breeder: clone.breeder,
  strain: clone.strain,
  lineage: clone.lineage,
  generation: clone.generation,
  copiedAt: nowIsoString(),
});

export const createAdHocSourceSnapshot = ({
  breeder,
  strain,
  lineage,
  generation,
  sourceType = "ad_hoc",
  notes,
}: {
  breeder: string;
  strain: string;
  lineage?: string;
  generation?: string;
  sourceType?: Extract<SourceType, "ad_hoc" | "harvest_batch">;
  notes?: string;
}): ProjectSourceSnapshot => ({
  snapshotId: uuidv4(),
  sourceType,
  breeder,
  strain,
  lineage,
  generation,
  copiedAt: nowIsoString(),
  notes,
});
