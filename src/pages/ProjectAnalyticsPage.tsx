import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatProjectDate } from "../lib/v2/date";
import { PROJECT_ROUTES } from "../lib/v2/projectPaths";
import {
  getProjectAnalytics,
  getPersonalProjectAnalytics,
  type PersonalProjectAnalyticsRecord,
  type PhenoProjectAnalytics,
  type ProjectAnalytics,
  type TagCount,
  type WashProjectAnalytics,
} from "../services/projectAnalytics";
import { getProject } from "../services/projects";
import {
  PROJECT_TYPE_LABELS,
  ProjectType,
  ProjectBase,
  SourceType,
  WashRunType,
  MaterialType,
} from "../types/v2";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
}

const WASH_RUN_TYPE_LABELS: Record<WashRunType, string> = {
  pheno_specific: "Pheno Specific",
  mixed_pheno: "Mixed Pheno",
  mixed_cultivar: "Mixed Cultivar",
};

const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  fresh_frozen: "Fresh Frozen",
  dried: "Dried",
  cured: "Cured",
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  seed: "Seed",
  clone: "Clone",
  ad_hoc: "Ad-hoc",
  phenotype: "Phenotype",
  plant: "Plant",
  harvest_batch: "Harvest Batch",
};

const metricGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(2, minmax(0, 1fr))",
    md: "repeat(4, minmax(0, 1fr))",
  },
  gap: 1.5,
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  detail,
}) => (
  <Card variant="outlined">
    <CardContent sx={{ "&:last-child": { pb: 2 } }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="h5" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {detail && (
        <Typography color="text.secondary" variant="caption">
          {detail}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const formatPercent = (value: number | null) =>
  value === null ? "No data" : `${value.toFixed(2)}%`;

const formatNumber = (
  value: number | null,
  suffix = "",
  decimals = 1
) =>
  value === null ? "No data" : `${value.toFixed(decimals)}${suffix}`;

const formatWeight = (value: number | null) =>
  value === null ? "No data" : `${value.toFixed(1)} g`;

const TagSummary: React.FC<{
  title: string;
  tags: TagCount[];
}> = ({ title, tags }) => (
  <Box>
    <Typography fontWeight={700} gutterBottom>
      {title}
    </Typography>
    {tags.length === 0 ? (
      <Typography color="text.secondary" variant="body2">
        No tags recorded.
      </Typography>
    ) : (
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {tags.map((tag) => (
          <Chip
            key={tag.tag}
            label={`${tag.tag} (${tag.count})`}
            size="small"
            variant="outlined"
          />
        ))}
      </Stack>
    )}
  </Box>
);

const PhenoAnalyticsView: React.FC<{
  analytics: PhenoProjectAnalytics;
}> = ({ analytics }) => (
  <Stack spacing={3}>
    <Box>
      <Typography variant="h6" gutterBottom>
        Hunt Overview
      </Typography>
      <Box sx={metricGridSx}>
        <MetricCard label="Seeds planted" value={String(analytics.plantedCount)} />
        <MetricCard
          label="Germinated"
          value={String(analytics.germinatedCount)}
        />
        <MetricCard
          label="Surviving"
          value={String(analytics.survivingCount)}
        />
        <MetricCard label="Keepers" value={String(analytics.keeperCount)} />
      </Box>
    </Box>

    <Box>
      <Typography variant="h6" gutterBottom>
        Rates
      </Typography>
      <Box sx={metricGridSx}>
        <MetricCard
          label="Germination rate"
          value={formatPercent(analytics.germinationRate)}
          detail="Germinated / planted"
        />
        <MetricCard
          label="Survival rate"
          value={formatPercent(analytics.survivalRate)}
          detail="Surviving / germinated"
        />
        <MetricCard
          label="Keeper rate"
          value={formatPercent(analytics.keeperRate)}
          detail="Keeper phenotypes / germinated"
        />
        <MetricCard
          label="Average flowering"
          value={formatNumber(analytics.averageFloweringDays, " days")}
          detail="Harvested plants with flowering history"
        />
      </Box>
    </Box>

    <Box>
      <Typography variant="h6" gutterBottom>
        Evaluation Averages
      </Typography>
      <Box sx={metricGridSx}>
        <MetricCard
          label="Vigor"
          value={formatNumber(analytics.averageVigorScore, " / 5")}
        />
        <MetricCard
          label="Stretch"
          value={formatNumber(analytics.averageStretchScore, " / 5")}
        />
        <MetricCard
          label="Resin coverage"
          value={formatNumber(analytics.averageResinCoverageScore, " / 5")}
        />
        <MetricCard
          label="Dry flower yield"
          value={formatWeight(analytics.averageDryFlowerGrams)}
          detail="Average latest recorded value"
        />
        <MetricCard
          label="Fresh-frozen yield"
          value={formatWeight(analytics.averageFreshFrozenGrams)}
          detail="Average latest recorded value"
        />
      </Box>
    </Box>

    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Common Characteristics</Typography>
          <TagSummary title="Aromas" tags={analytics.aromaTags} />
          <TagSummary title="Flavors" tags={analytics.flavorTags} />
          <TagSummary
            title="Resin character"
            tags={analytics.resinCharacterTags}
          />
        </Stack>
      </CardContent>
    </Card>

    <Box>
      <Typography variant="h6" gutterBottom>
        Comparison Groups
      </Typography>
      {analytics.groups.length === 0 ? (
        <Typography color="text.secondary">
          No comparison groups recorded.
        </Typography>
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Group</TableCell>
                <TableCell align="right">Planted</TableCell>
                <TableCell align="right">Germinated</TableCell>
                <TableCell align="right">Surviving</TableCell>
                <TableCell align="right">Keepers</TableCell>
                <TableCell align="right">Germination</TableCell>
                <TableCell align="right">Survival</TableCell>
                <TableCell align="right">Keeper rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.groups.map((group) => (
                <TableRow key={group.groupId}>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">
                      {group.name}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {group.strain} by {group.breeder}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{group.plantedCount}</TableCell>
                  <TableCell align="right">{group.germinatedCount}</TableCell>
                  <TableCell align="right">{group.survivingCount}</TableCell>
                  <TableCell align="right">{group.keeperCount}</TableCell>
                  <TableCell align="right">
                    {formatPercent(group.germinationRate)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercent(group.survivalRate)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercent(group.keeperRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </Stack>
);

const WashAnalyticsView: React.FC<{
  analytics: WashProjectAnalytics;
}> = ({ analytics }) => (
  <Stack spacing={3}>
    <Box>
      <Typography variant="h6" gutterBottom>
        Process Overview
      </Typography>
      <Box sx={metricGridSx}>
        <MetricCard
          label="Wash sessions"
          value={String(analytics.sessionCount)}
        />
        <MetricCard label="Wash runs" value={String(analytics.runCount)} />
        <MetricCard
          label="Starting material"
          value={formatWeight(analytics.totalInputWeightGrams)}
        />
        <MetricCard
          label="Dry hash"
          value={formatWeight(analytics.totalDryHashWeightGrams)}
        />
        <MetricCard
          label="Rosin output"
          value={formatWeight(analytics.totalRosinOutputWeightGrams)}
        />
      </Box>
    </Box>

    <Box>
      <Typography variant="h6" gutterBottom>
        Return Averages
      </Typography>
      <Box sx={metricGridSx}>
        <MetricCard
          label="RTH"
          value={formatPercent(analytics.averageRthPercent)}
          detail="Dry hash / starting material"
        />
        <MetricCard
          label="RTR"
          value={formatPercent(analytics.averageRtrPercent)}
          detail="Rosin / hash pressed"
        />
        <MetricCard
          label="Overall rosin return"
          value={formatPercent(analytics.averageOverallRosinReturnPercent)}
          detail="Rosin / starting material"
        />
        <MetricCard
          label="Quality"
          value={formatNumber(analytics.averageQualityStars, " / 6")}
        />
      </Box>
    </Box>

    <Card variant="outlined">
      <CardContent>
        <TagSummary
          title="Common Resin Character"
          tags={analytics.resinCharacterTags}
        />
      </CardContent>
    </Card>

    <Box>
      <Typography variant="h6" gutterBottom>
        Wash Runs
      </Typography>
      {analytics.runs.length === 0 ? (
        <Typography color="text.secondary">No wash runs recorded.</Typography>
      ) : (
        <TableContainer component={Card} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Run</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Material</TableCell>
                <TableCell align="right">Input</TableCell>
                <TableCell align="right">Dry hash</TableCell>
                <TableCell align="right">Rosin</TableCell>
                <TableCell align="right">RTH</TableCell>
                <TableCell align="right">RTR</TableCell>
                <TableCell align="right">Overall</TableCell>
                <TableCell align="right">Quality</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.runs.map((run) => (
                <TableRow key={run.runId}>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">
                      {run.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{WASH_RUN_TYPE_LABELS[run.runType]}</TableCell>
                  <TableCell>{MATERIAL_TYPE_LABELS[run.materialType]}</TableCell>
                  <TableCell align="right">
                    {formatWeight(run.inputWeightGrams)}
                  </TableCell>
                  <TableCell align="right">
                    {formatWeight(run.dryHashWeightGrams)}
                  </TableCell>
                  <TableCell align="right">
                    {formatWeight(run.rosinOutputWeightGrams)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercent(run.rthPercent)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercent(run.rtrPercent)}
                  </TableCell>
                  <TableCell align="right">
                    {formatPercent(run.overallRosinReturnPercent)}
                  </TableCell>
                  <TableCell align="right">
                    {run.qualityStars === null
                      ? "No data"
                      : `${run.qualityStars} / 6`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </Stack>
);

const averageRecorded = (
  values: Array<number | null | undefined>,
  decimals = 2
) => {
  const recorded = values.filter(
    (value): value is number =>
      value !== null && value !== undefined && Number.isFinite(value)
  );
  if (recorded.length === 0) {
    return null;
  }

  const factor = 10 ** decimals;
  return (
    Math.round(
      (recorded.reduce((total, value) => total + value, 0) /
        recorded.length) *
        factor
    ) / factor
  );
};

const sumRecordedValues = (
  values: Array<number | null | undefined>
) => {
  const recorded = values.filter(
    (value): value is number =>
      value !== null && value !== undefined && Number.isFinite(value)
  );
  return recorded.length === 0
    ? null
    : recorded.reduce((total, value) => total + value, 0);
};

const calculateRate = (value: number, denominator: number) =>
  denominator > 0
    ? Math.round((value / denominator) * 10000) / 100
    : null;

const combineTagCounts = (tagGroups: TagCount[][], limit = 8) => {
  const counts = new Map<string, { tag: string; count: number }>();

  tagGroups.flat().forEach(({ tag, count }) => {
    const key = tag.toLowerCase();
    const existing = counts.get(key);
    counts.set(key, {
      tag: existing?.tag ?? tag,
      count: (existing?.count ?? 0) + count,
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
};

const tagsFromValues = (values: string[], limit = 8): TagCount[] => {
  const counts = new Map<string, { tag: string; count: number }>();

  values.forEach((value) => {
    const cleanValue = value.trim();
    if (!cleanValue) {
      return;
    }

    const key = cleanValue.toLowerCase();
    const existing = counts.get(key);
    counts.set(key, {
      tag: existing?.tag ?? cleanValue,
      count: (existing?.count ?? 0) + 1,
    });
  });

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
};

const PersonalAnalyticsDashboard: React.FC<{
  records: PersonalProjectAnalyticsRecord[];
}> = ({ records }) => {
  const navigate = useNavigate();
  const [projectType, setProjectType] = useState<"all" | ProjectType>("all");
  const [projectId, setProjectId] = useState("all");
  const [breeder, setBreeder] = useState("all");
  const [cultivar, setCultivar] = useState("all");
  const [materialType, setMaterialType] = useState<"all" | MaterialType>("all");
  const [sourceType, setSourceType] = useState<"all" | SourceType>("all");

  const sortedUnique = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );

  const breederOptions = useMemo(
    () =>
      sortedUnique(
        records.flatMap((record) => [
          ...record.breeders,
          ...(record.analytics.type === "wash_process"
            ? record.analytics.runs.flatMap((run) => run.sourceBreeders)
            : []),
        ])
      ),
    [records]
  );
  const cultivarOptions = useMemo(
    () =>
      sortedUnique(
        records.flatMap((record) => [
          ...record.cultivars,
          ...(record.analytics.type === "wash_process"
            ? record.analytics.runs.flatMap((run) => run.sourceCultivars)
            : []),
        ])
      ),
    [records]
  );

  const projectFilteredRecords = useMemo(
    () =>
      records.filter(
        (record) =>
          (projectType === "all" || record.project.type === projectType) &&
          (projectId === "all" || record.project.id === projectId)
      ),
    [projectId, projectType, records]
  );

  const phenoRecords = useMemo(
    () =>
      projectFilteredRecords.filter(
        (
          record
        ): record is PersonalProjectAnalyticsRecord & {
          analytics: PhenoProjectAnalytics;
        } =>
          record.analytics.type === "pheno_hunt" &&
          materialType === "all" &&
          (breeder === "all" || record.breeders.includes(breeder)) &&
          (cultivar === "all" || record.cultivars.includes(cultivar)) &&
          (sourceType === "all" || record.sourceTypes.includes(sourceType))
      ),
    [
      breeder,
      cultivar,
      materialType,
      projectFilteredRecords,
      sourceType,
    ]
  );

  const washRecords = useMemo(
    () =>
      projectFilteredRecords
        .filter(
          (
            record
          ): record is PersonalProjectAnalyticsRecord & {
            analytics: WashProjectAnalytics;
          } => record.analytics.type === "wash_process"
        )
        .map((record) => ({
          ...record,
          runs: record.analytics.runs.filter(
            (run) =>
              (materialType === "all" ||
                run.materialType === materialType) &&
              (breeder === "all" ||
                run.sourceBreeders.includes(breeder)) &&
              (cultivar === "all" ||
                run.sourceCultivars.includes(cultivar)) &&
              (sourceType === "all" ||
                run.sourceTypes.includes(sourceType))
          ),
        }))
        .filter((record) => record.runs.length > 0),
    [
      breeder,
      cultivar,
      materialType,
      projectFilteredRecords,
      sourceType,
    ]
  );

  const phenoSummary = useMemo(() => {
    const plantedCount = phenoRecords.reduce(
      (total, record) => total + record.analytics.plantedCount,
      0
    );
    const germinatedCount = phenoRecords.reduce(
      (total, record) => total + record.analytics.germinatedCount,
      0
    );
    const survivingCount = phenoRecords.reduce(
      (total, record) => total + record.analytics.survivingCount,
      0
    );
    const keeperCount = phenoRecords.reduce(
      (total, record) => total + record.analytics.keeperCount,
      0
    );

    return {
      plantedCount,
      germinatedCount,
      survivingCount,
      keeperCount,
      germinationRate: calculateRate(germinatedCount, plantedCount),
      survivalRate: calculateRate(survivingCount, germinatedCount),
      keeperRate: calculateRate(keeperCount, germinatedCount),
      averageFloweringDays: averageRecorded(
        phenoRecords.map(
          (record) => record.analytics.averageFloweringDays
        ),
        1
      ),
      averageDryFlowerGrams: averageRecorded(
        phenoRecords.map(
          (record) => record.analytics.averageDryFlowerGrams
        ),
        1
      ),
      averageFreshFrozenGrams: averageRecorded(
        phenoRecords.map(
          (record) => record.analytics.averageFreshFrozenGrams
        ),
        1
      ),
      averageVigorScore: averageRecorded(
        phenoRecords.map((record) => record.analytics.averageVigorScore),
        1
      ),
      averageStretchScore: averageRecorded(
        phenoRecords.map(
          (record) => record.analytics.averageStretchScore
        ),
        1
      ),
      averageResinCoverageScore: averageRecorded(
        phenoRecords.map(
          (record) => record.analytics.averageResinCoverageScore
        ),
        1
      ),
      aromaTags: combineTagCounts(
        phenoRecords.map((record) => record.analytics.aromaTags)
      ),
      flavorTags: combineTagCounts(
        phenoRecords.map((record) => record.analytics.flavorTags)
      ),
      resinCharacterTags: combineTagCounts(
        phenoRecords.map(
          (record) => record.analytics.resinCharacterTags
        )
      ),
    };
  }, [phenoRecords]);

  const washRuns = useMemo(
    () => washRecords.flatMap((record) => record.runs),
    [washRecords]
  );
  const washSummary = useMemo(
    () => ({
      totalInputWeightGrams: sumRecordedValues(
        washRuns.map((run) => run.inputWeightGrams)
      ),
      totalDryHashWeightGrams: sumRecordedValues(
        washRuns.map((run) => run.dryHashWeightGrams)
      ),
      totalRosinOutputWeightGrams: sumRecordedValues(
        washRuns.map((run) => run.rosinOutputWeightGrams)
      ),
      averageRthPercent: averageRecorded(
        washRuns.map((run) => run.rthPercent)
      ),
      averageRtrPercent: averageRecorded(
        washRuns.map((run) => run.rtrPercent)
      ),
      averageOverallRosinReturnPercent: averageRecorded(
        washRuns.map((run) => run.overallRosinReturnPercent)
      ),
      averageQualityStars: averageRecorded(
        washRuns.map((run) => run.qualityStars),
        1
      ),
      resinCharacterTags: tagsFromValues(
        washRuns.flatMap((run) => run.resinCharacterTags)
      ),
    }),
    [washRuns]
  );

  if (records.length === 0) {
    return (
      <Alert severity="info">
        Complete a Pheno Hunt or Wash/Process project to begin building
        your personal analytics dashboard.
      </Alert>
    );
  }

  const hasResults = phenoRecords.length > 0 || washRecords.length > 0;

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">Filters</Typography>
              <Typography color="text.secondary" variant="body2">
                Compare completed project results without combining them
                into a single score.
              </Typography>
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              <TextField
                label="Project type"
                select
                size="small"
                value={projectType}
                onChange={(event) => {
                  const nextType = event.target.value as
                    | "all"
                    | ProjectType;
                  setProjectType(nextType);
                  if (nextType === "pheno_hunt") {
                    setMaterialType("all");
                  }
                }}
              >
                <MenuItem value="all">All project types</MenuItem>
                <MenuItem value="pheno_hunt">Pheno Hunt</MenuItem>
                <MenuItem value="wash_process">Wash/Process</MenuItem>
              </TextField>
              <TextField
                label="Project"
                select
                size="small"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <MenuItem value="all">All completed projects</MenuItem>
                {records.map((record) => (
                  <MenuItem
                    key={record.project.id}
                    value={record.project.id}
                  >
                    {record.project.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Breeder"
                select
                size="small"
                value={breeder}
                onChange={(event) => setBreeder(event.target.value)}
              >
                <MenuItem value="all">All breeders</MenuItem>
                {breederOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Cultivar"
                select
                size="small"
                value={cultivar}
                onChange={(event) => setCultivar(event.target.value)}
              >
                <MenuItem value="all">All cultivars</MenuItem>
                {cultivarOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                disabled={projectType === "pheno_hunt"}
                label="Material"
                select
                size="small"
                value={materialType}
                onChange={(event) =>
                  setMaterialType(
                    event.target.value as "all" | MaterialType
                  )
                }
              >
                <MenuItem value="all">All materials</MenuItem>
                {Object.entries(MATERIAL_TYPE_LABELS).map(
                  ([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  )
                )}
              </TextField>
              <TextField
                label="Source"
                select
                size="small"
                value={sourceType}
                onChange={(event) =>
                  setSourceType(
                    event.target.value as "all" | SourceType
                  )
                }
              >
                <MenuItem value="all">All sources</MenuItem>
                {Object.entries(SOURCE_TYPE_LABELS).map(
                  ([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {!hasResults ? (
        <Alert severity="info">
          No completed results match the selected filters.
        </Alert>
      ) : null}

      {phenoRecords.length > 0 && (
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5">Pheno Hunt Results</Typography>
            <Typography color="text.secondary" variant="body2">
              {phenoRecords.length} completed{" "}
              {phenoRecords.length === 1 ? "project" : "projects"}
            </Typography>
          </Box>
          <Box sx={metricGridSx}>
            <MetricCard
              label="Seeds planted"
              value={String(phenoSummary.plantedCount)}
            />
            <MetricCard
              label="Germination rate"
              value={formatPercent(phenoSummary.germinationRate)}
            />
            <MetricCard
              label="Survival rate"
              value={formatPercent(phenoSummary.survivalRate)}
            />
            <MetricCard
              label="Keeper rate"
              value={formatPercent(phenoSummary.keeperRate)}
            />
            <MetricCard
              label="Average flowering"
              value={formatNumber(
                phenoSummary.averageFloweringDays,
                " days"
              )}
              detail="Average across projects with data"
            />
            <MetricCard
              label="Average vigor"
              value={formatNumber(
                phenoSummary.averageVigorScore,
                " / 5"
              )}
              detail="Average across projects with data"
            />
            <MetricCard
              label="Average resin"
              value={formatNumber(
                phenoSummary.averageResinCoverageScore,
                " / 5"
              )}
              detail="Average across projects with data"
            />
            <MetricCard
              label="Average dry yield"
              value={formatWeight(phenoSummary.averageDryFlowerGrams)}
              detail="Average across projects with data"
            />
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <TagSummary
                  title="Common aromas"
                  tags={phenoSummary.aromaTags}
                />
                <TagSummary
                  title="Common flavors"
                  tags={phenoSummary.flavorTags}
                />
                <TagSummary
                  title="Common resin character"
                  tags={phenoSummary.resinCharacterTags}
                />
              </Stack>
            </CardContent>
          </Card>
          <TableContainer component={Card} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Planted</TableCell>
                  <TableCell align="right">Germination</TableCell>
                  <TableCell align="right">Survival</TableCell>
                  <TableCell align="right">Keeper rate</TableCell>
                  <TableCell align="right">Flowering</TableCell>
                  <TableCell align="right">Vigor</TableCell>
                  <TableCell align="right">Resin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {phenoRecords.map((record) => (
                  <TableRow
                    hover
                    key={record.project.id}
                    onClick={() =>
                      navigate(
                        PROJECT_ROUTES.projectAnalytics(
                          record.project.id as string
                        )
                      )
                    }
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography fontWeight={700} variant="body2">
                        {record.project.name}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        variant="caption"
                      >
                        {formatProjectDate(record.project.startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {record.analytics.plantedCount}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(record.analytics.germinationRate)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(record.analytics.survivalRate)}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(record.analytics.keeperRate)}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(
                        record.analytics.averageFloweringDays,
                        " days"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(
                        record.analytics.averageVigorScore,
                        " / 5"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(
                        record.analytics.averageResinCoverageScore,
                        " / 5"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}

      {washRecords.length > 0 && (
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5">Wash/Process Results</Typography>
            <Typography color="text.secondary" variant="body2">
              {washRecords.length} completed{" "}
              {washRecords.length === 1 ? "project" : "projects"} ·{" "}
              {washRuns.length} {washRuns.length === 1 ? "run" : "runs"}
            </Typography>
          </Box>
          <Box sx={metricGridSx}>
            <MetricCard
              label="Starting material"
              value={formatWeight(washSummary.totalInputWeightGrams)}
            />
            <MetricCard
              label="Dry hash"
              value={formatWeight(washSummary.totalDryHashWeightGrams)}
            />
            <MetricCard
              label="Rosin output"
              value={formatWeight(washSummary.totalRosinOutputWeightGrams)}
            />
            <MetricCard
              label="Average RTH"
              value={formatPercent(washSummary.averageRthPercent)}
            />
            <MetricCard
              label="Average RTR"
              value={formatPercent(washSummary.averageRtrPercent)}
            />
            <MetricCard
              label="Overall rosin return"
              value={formatPercent(
                washSummary.averageOverallRosinReturnPercent
              )}
            />
            <MetricCard
              label="Average quality"
              value={formatNumber(
                washSummary.averageQualityStars,
                " / 6"
              )}
            />
          </Box>
          <Card variant="outlined">
            <CardContent>
              <TagSummary
                title="Common resin character"
                tags={washSummary.resinCharacterTags}
              />
            </CardContent>
          </Card>
          <TableContainer component={Card} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell align="right">Runs</TableCell>
                  <TableCell align="right">Input</TableCell>
                  <TableCell align="right">Dry hash</TableCell>
                  <TableCell align="right">Rosin</TableCell>
                  <TableCell align="right">RTH</TableCell>
                  <TableCell align="right">RTR</TableCell>
                  <TableCell align="right">Overall</TableCell>
                  <TableCell align="right">Quality</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {washRecords.map((record) => (
                  <TableRow
                    hover
                    key={record.project.id}
                    onClick={() =>
                      navigate(
                        PROJECT_ROUTES.projectAnalytics(
                          record.project.id as string
                        )
                      )
                    }
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography fontWeight={700} variant="body2">
                        {record.project.name}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        variant="caption"
                      >
                        {formatProjectDate(record.project.startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {record.runs.length}
                    </TableCell>
                    <TableCell align="right">
                      {formatWeight(
                        sumRecordedValues(
                          record.runs.map(
                            (run) => run.inputWeightGrams
                          )
                        )
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatWeight(
                        sumRecordedValues(
                          record.runs.map(
                            (run) => run.dryHashWeightGrams
                          )
                        )
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatWeight(
                        sumRecordedValues(
                          record.runs.map(
                            (run) => run.rosinOutputWeightGrams
                          )
                        )
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(
                        averageRecorded(
                          record.runs.map((run) => run.rthPercent)
                        )
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(
                        averageRecorded(
                          record.runs.map((run) => run.rtrPercent)
                        )
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatPercent(
                        averageRecorded(
                          record.runs.map(
                            (run) => run.overallRosinReturnPercent
                          )
                        )
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(
                        averageRecorded(
                          record.runs.map((run) => run.qualityStars),
                          1
                        ),
                        " / 6"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}
    </Stack>
  );
};

const ProjectAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const isProjectScoped = Boolean(projectId);
  const [project, setProject] = useState<ProjectBase | null>(null);
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [personalRecords, setPersonalRecords] = useState<
    PersonalProjectAnalyticsRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjectAnalytics = async () => {
      if (!currentUser) {
        setError("Sign in to view project analytics.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (!projectId) {
          setPersonalRecords(
            await getPersonalProjectAnalytics(currentUser.uid)
          );
          return;
        }

        const loadedProject = await getProject(projectId);
        if (!loadedProject) {
          setError("Project not found.");
          return;
        }

        if (loadedProject.ownerId !== currentUser.uid) {
          setError("You do not have access to this project.");
          return;
        }

        setProject(loadedProject);
        if (loadedProject.status === "complete") {
          setAnalytics(
            await getProjectAnalytics(
              projectId,
              loadedProject.ownerId,
              loadedProject.type
            )
          );
        }
      } catch (loadError) {
        console.error("Failed to load project analytics:", loadError);
        setError("Failed to load project analytics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadProjectAnalytics();
  }, [currentUser, projectId]);

  const projectIsComplete = project?.status === "complete";

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() =>
            navigate(
              projectId
                ? PROJECT_ROUTES.detail(projectId)
                : PROJECT_ROUTES.list
            )
          }
          sx={{ alignSelf: "flex-start" }}
        >
          {projectId ? "Back to Project" : "Back to Projects"}
        </Button>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  color="primary"
                  label={
                    isProjectScoped
                      ? "Project analytics"
                      : "Personal analytics"
                  }
                />
                <Chip label="Completed projects only" variant="outlined" />
                {project && (
                  <Chip
                    label={PROJECT_TYPE_LABELS[project.type]}
                    variant="outlined"
                  />
                )}
              </Stack>
              <Box>
                <Typography variant="h4">
                  {project?.name ??
                    (isProjectScoped
                      ? "Project Analytics"
                      : "Project Analytics Dashboard")}
                </Typography>
                {project && (
                  <Typography color="text.secondary">
                    Started {formatProjectDate(project.startDate)}
                    {project.completedAt
                      ? ` - Completed ${formatProjectDate(
                          project.completedAt.slice(0, 10)
                        )}`
                      : ""}
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {loading ? (
          <Typography color="text.secondary">Loading analytics...</Typography>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !isProjectScoped ? (
          <PersonalAnalyticsDashboard records={personalRecords} />
        ) : !projectIsComplete ? (
          <Alert severity="info">
            Analytics become available after this project is marked Complete.
          </Alert>
        ) : analytics?.type === "pheno_hunt" ? (
          <PhenoAnalyticsView analytics={analytics} />
        ) : analytics?.type === "wash_process" ? (
          <WashAnalyticsView analytics={analytics} />
        ) : (
          <Alert severity="info">No analytics data is available.</Alert>
        )}
      </Stack>
    </Container>
  );
};

export default ProjectAnalyticsPage;
