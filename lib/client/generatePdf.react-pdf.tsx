import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';

interface EstimatePrediction {
  photoUrl?: string;
  prediction?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
}

interface CostEstimate {
  model?: string;
  currency?: string;
  total?: number;
  note?: string;
}

interface EstimateData {
  id: string;
  predictions?: EstimatePrediction[];
  confidentPredictions?: EstimatePrediction[];
  confidenceThreshold?: number;
  costEstimate?: CostEstimate;
  summary?: string;
  photoUrls?: string[];
  userName?: string;
  userEmail?: string;
  photoCount?: number;
}

interface PreparedPhoto {
  label: string;
  src: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    color: '#000',
    fontSize: 10,
    fontFamily: 'Helvetica',
    padding: 32,
    lineHeight: 1.4,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 8,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 10,
  },
  section: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
  },
  mono: {
    fontSize: 10,
    fontFamily: 'Courier',
    marginBottom: 3,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  photoCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
  },
  photoImage: {
    width: '100%',
    height: 110,
    objectFit: 'cover',
  },
  photoLabel: {
    fontSize: 8,
    marginTop: 3,
    textAlign: 'center',
  },
  footer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 6,
    fontSize: 8,
  },
});

function chunk<T>(items: T[], perRow: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += perRow) {
    rows.push(items.slice(i, i + perRow));
  }
  return rows;
}

function formatCurrency(amount: number, currency = 'USD') {
  return `${currency} ${amount.toLocaleString()}`;
}

function normalizeConfidence(confidence: number) {
  return confidence > 1 ? confidence / 100 : confidence;
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

function EstimateDocument({
  data,
  generatedAt,
  photos,
}: {
  data: EstimateData;
  generatedAt: Date;
  photos: PreparedPhoto[];
}) {
  const photosPerRow = 3;
  const photoRows = chunk(photos, photosPerRow);
  const inferredPhotoCount =
    data.photoCount ?? data.photoUrls?.length ?? photos.length;
  const predictionList =
    data.confidentPredictions ?? data.predictions ?? [];

  return (
    <Document title={`InsureVision ${data.id}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>InsureVision - Vehicle Damage Report</Text>
        <Text style={styles.subtitle}>Estimate ID: {data.id}</Text>
        <View style={styles.hr} />

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Report Details</Text>
          <Text style={styles.text}>Date: {generatedAt.toLocaleString()}</Text>
          <Text style={styles.text}>Customer: {data.userName || 'N/A'}</Text>
          <Text style={styles.text}>Email: {data.userEmail || 'N/A'}</Text>
          <Text style={styles.text}>Photos analyzed: {inferredPhotoCount}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Confident Predictions</Text>
          {predictionList.length > 0 ? (
            predictionList.map((item, index) => (
              <Text key={`${item.photoUrl ?? index}-${index}`} style={styles.mono}>
                {index + 1}. {item.prediction ?? 'Unknown'} - {Math.round(normalizeConfidence(item.confidence ?? 0) * 100)}%
              </Text>
            ))
          ) : (
            <Text style={styles.text}>
              No confident predictions available.
            </Text>
          )}
          {typeof data.confidenceThreshold === 'number' && (
            <Text style={styles.text}>
              Confidence threshold: {Math.round(data.confidenceThreshold * 100)}%
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Cost Estimate</Text>
          <Text style={styles.text}>
            Model: {data.costEstimate?.model ?? 'cost-model-placeholder-v1'}
          </Text>
          <Text style={styles.text}>
            Estimated Total: {formatCurrency(data.costEstimate?.total ?? 0, data.costEstimate?.currency ?? 'USD')}
          </Text>
          {data.costEstimate?.note && (
            <Text style={styles.text}>{data.costEstimate.note}</Text>
          )}
        </View>

        {photos.length > 0 && (
          <View style={styles.section} wrap>
            <Text style={styles.sectionHeader}>Attached Photos</Text>
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
        )}

        <View style={styles.footer} fixed>
          <Text>
            This report is generated by automated model output and is for reference only.
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

  const photos = await preparePhotos(sourcePhotoUrls);
  const blob = await pdf(
    <EstimateDocument
      data={data}
      generatedAt={generatedAt}
      photos={photos}
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
