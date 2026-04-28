import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';

interface EstimatePart {
  name: string;
  cost: number;
  severity: string;
}

interface EstimateData {
  id: string;
  totalCost: number;
  parts: EstimatePart[];
  summary: string;
  photoUrls?: string[];
  userName?: string;
  userEmail?: string;
  photoCount?: number;
}

interface PreparedPhoto {
  label: string;
  src: string;
}

const NAVY = '#1a2744';
const TEXT = '#111111';
const MUTED = '#666666';
const LIGHT_ROW = '#f9f9f9';
const DIVIDER = '#d0d0d0';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    color: TEXT,
    fontSize: 10,
    fontFamily: 'Helvetica',
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 36,
    lineHeight: 1.45,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  brandTextWrap: {
    justifyContent: 'center',
  },
  brand: {
    fontSize: 20,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: MUTED,
  },
  headerMeta: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metaLine: {
    fontSize: 9,
    color: MUTED,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    marginBottom: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 8,
  },
  customerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
  },
  customerCol: {
    flex: 1,
    gap: 5,
  },
  label: {
    color: MUTED,
    fontSize: 9,
  },
  value: {
    color: TEXT,
    fontSize: 10,
  },
  summaryText: {
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    paddingVertical: 6,
  },
  headerCell: {
    fontSize: 9,
    color: MUTED,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  rowAlt: {
    backgroundColor: LIGHT_ROW,
  },
  componentCell: {
    flex: 1.7,
    fontSize: 10,
  },
  severityCell: {
    flex: 0.8,
    fontSize: 10,
    color: '#2f2f2f',
  },
  severityHigh: {
    fontWeight: 700,
  },
  costCell: {
    flex: 0.8,
    textAlign: 'right',
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
  },
  totalValue: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 700,
  },
  photoRows: {
    gap: 10,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoCell: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
  },
  photoLabel: {
    fontSize: 8,
    color: MUTED,
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },
  disclaimer: {
    color: MUTED,
    fontSize: 8.5,
    fontStyle: 'italic',
    lineHeight: 1.35,
    marginBottom: 8,
  },
  generated: {
    color: MUTED,
    fontSize: 8.5,
    textAlign: 'center',
  },
});

function chunk<T>(items: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += perRow) {
    rows.push(items.slice(i, i + perRow));
  }
  return rows;
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString()}`;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to convert blob to data URL.'));
    };
    reader.onerror = () => reject(new Error('Failed to read blob.'));
    reader.readAsDataURL(blob);
  });
}

async function loadImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = objectUrl;
  });
}

async function compressPhotoUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const originalBlob = await response.blob();
    const objectUrl = URL.createObjectURL(originalBlob);

    try {
      const image = await loadImageElement(objectUrl);
      const maxWidth = 800;
      const maxHeight = 600;
      const widthRatio = maxWidth / image.width;
      const heightRatio = maxHeight / image.height;
      const ratio = Math.min(1, widthRatio, heightRatio);

      const targetWidth = Math.max(1, Math.round(image.width * ratio));
      const targetHeight = Math.max(1, Math.round(image.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return await blobToDataUrl(originalBlob);
      }

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      const compressedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.7);
      });

      if (!compressedBlob) {
        return await blobToDataUrl(originalBlob);
      }

      return await blobToDataUrl(compressedBlob);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

async function preparePhotos(photoUrls: string[]): Promise<PreparedPhoto[]> {
  const prepared = await Promise.all(
    photoUrls.map(async (url, index) => {
      const compressed = await compressPhotoUrl(url);
      if (!compressed) return null;
      return {
        label: `Photo ${index + 1}`,
        src: compressed,
      } satisfies PreparedPhoto;
    })
  );

  return prepared.filter((item): item is PreparedPhoto => item !== null);
}

async function loadHeaderLogo(): Promise<string | null> {
  const candidatePaths = ['/logo.svg', '/logo.png'];

  for (const path of candidatePaths) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        continue;
      }

      const blob = await response.blob();
      return await blobToDataUrl(blob);
    } catch {
      // Ignore and try the next candidate path.
    }
  }

  return null;
}

function EstimateDocument({
  data,
  generatedAt,
  photos,
  logoSrc,
}: {
  data: EstimateData;
  generatedAt: Date;
  photos: PreparedPhoto[];
  logoSrc: string | null;
}) {
  const photosPerRow = 3;
  const photoRows = chunk(photos, photosPerRow);
  const inferredPhotoCount =
    data.photoCount ?? data.photoUrls?.length ?? photos.length;

  return (
    <Document title={`InsureVision ${data.id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {logoSrc && <Image src={logoSrc} style={styles.logo} />}
            <View style={styles.brandTextWrap}>
              <Text style={styles.brand}>InsureVision</Text>
              <Text style={styles.subtitle}>
                Vehicle Damage Estimation Report
              </Text>
            </View>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.metaLine}>Estimate ID: {data.id}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.customerGrid}>
            <View style={styles.customerCol}>
              <Text>
                <Text style={styles.label}>Name: </Text>
                <Text style={styles.value}>{data.userName || 'N/A'}</Text>
              </Text>
              <Text>
                <Text style={styles.label}>Email: </Text>
                <Text style={styles.value}>{data.userEmail || 'N/A'}</Text>
              </Text>
            </View>
            <View style={styles.customerCol}>
              <Text>
                <Text style={styles.label}>Photos Analyzed: </Text>
                <Text style={styles.value}>{inferredPhotoCount}</Text>
              </Text>
              <Text>
                <Text style={styles.label}>Date: </Text>
                <Text style={styles.value}>{generatedAt.toLocaleString()}</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summaryText}>{data.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Damage Breakdown</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1.7 }]}>Component</Text>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Severity</Text>
            <Text
              style={[styles.headerCell, { flex: 0.8, textAlign: 'right' }]}
            >
              Cost
            </Text>
          </View>

          {data.parts.map((part, index) => (
            <View
              key={`${part.name}-${index}`}
              style={
                index % 2 === 1
                  ? [styles.tableRow, styles.rowAlt]
                  : styles.tableRow
              }
            >
              <Text style={styles.componentCell}>{part.name}</Text>
              <Text
                style={[
                  styles.severityCell,
                  ...(part.severity === 'High' ? [styles.severityHigh] : []),
                ]}
              >
                {part.severity}
              </Text>
              <Text style={styles.costCell}>{formatCurrency(part.cost)}</Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(data.totalCost)}
            </Text>
          </View>
        </View>

        {photos.length > 0 && (
          <View style={styles.section} wrap>
            <Text style={styles.sectionTitle}>Photos Analyzed</Text>
            <View style={styles.photoRows}>
              {photoRows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.photoRow}>
                  {row.map((photo) => (
                    <View key={photo.label} style={styles.photoCell}>
                      <Image src={photo.src} style={styles.photoImage} />
                      <Text style={styles.photoLabel}>{photo.label}</Text>
                    </View>
                  ))}
                  {row.length < photosPerRow &&
                    Array.from({ length: photosPerRow - row.length }).map(
                      (_, i) => (
                        <View
                          key={`empty-${rowIndex}-${i}`}
                          style={styles.photoCell}
                        />
                      )
                    )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.disclaimer}>
            This estimate is generated by AI analysis and is for reference only.
            Final repair costs may vary after physical inspection, parts
            pricing, and labor rates.
          </Text>
          <Text style={styles.generated}>
            Generated by InsureVision | {generatedAt.toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate and download a PDF report for a damage estimation.
 */
export async function downloadEstimatePdf(data: EstimateData): Promise<void> {
  const generatedAt = new Date();
  const sourcePhotoUrls = Array.isArray(data.photoUrls)
    ? data.photoUrls.filter((url) => typeof url === 'string' && url.length > 0)
    : [];

  const [photos, logoSrc] = await Promise.all([
    preparePhotos(sourcePhotoUrls),
    loadHeaderLogo(),
  ]);
  const blob = await pdf(
    <EstimateDocument
      data={data}
      generatedAt={generatedAt}
      photos={photos}
      logoSrc={logoSrc}
    />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `InsureVision-${data.id}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export type { EstimateData };
