import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import {
  useGetAppointmentDocumentsQuery,
  useDeleteAppointmentDocumentMutation,
  ensureFreshToken,
} from '../../services/api';
import RNBlobUtil from 'react-native-blob-util';
import { useDispatch, useStore } from 'react-redux';
import { FileText, FileImage, Trash2, Download } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface DocumentListProps {
  appointmentId: string;
  currentUserId: string;
}

/**
 * RNBlobUtil resolves successfully for any HTTP status and saves whatever came back. Without
 * this check a 401 or 500 error body is written to disk under the document's name and then
 * handed to the OS as a PDF.
 */
function assertDownloadSucceeded(res: any) {
  const status = res?.info?.()?.status;
  if (typeof status === 'number' && status >= 400) {
    throw new Error(`Download failed with HTTP ${status}`);
  }
}

export function DocumentList({ appointmentId, currentUserId }: DocumentListProps) {
  const { data: response, isLoading } = useGetAppointmentDocumentsQuery(appointmentId);
  const [deleteDoc, { isLoading: isDeleting }] = useDeleteAppointmentDocumentMutation();
  const dispatch = useDispatch();
  const store = useStore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const docs = response?.data || [];

  const handleDownloadAndOpen = async (doc: any) => {
    try {
      setDownloadingId(doc.documentId);

      // This request bypasses RTK Query, so it gets no 401-retry — fetch a token that is
      // known-good up front instead.
      const token = await ensureFreshToken(dispatch, store.getState as () => any);
      if (!token) {
        Alert.alert('Download Failed', 'Your session has expired. Please log in again.');
        return;
      }

      // Sanitize filename: remove spaces and unsafe characters
      const safeFileName = doc.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const mimeType = doc.fileType || 'application/pdf';

      if (Platform.OS === 'android') {
        // Use Android Download Manager — handles FileProvider, scoped storage,
        // and shows a "Downloading..." notification in the status bar automatically.
        await RNBlobUtil.config({
          addAndroidDownloads: {
            useDownloadManager: true,  // system download manager
            notification: true,         // status bar notification
            title: doc.fileName,
            description: 'Medical document',
            mime: mimeType,
            mediaScannable: true,       // makes file visible in Files app
            path: `${RNBlobUtil.fs.dirs.DownloadDir}/${safeFileName}`,
          },
        })
          .fetch('GET', doc.downloadUrl, {
            Authorization: `Bearer ${token}`,
          })
          .then(res => {
            // RNBlobUtil does not throw on an error status — it writes the JSON error body to
            // disk under the document's filename. Check explicitly, or the user "downloads" a
            // PDF that is really a 401 payload.
            assertDownloadSucceeded(res);
            // Trigger the system "Open With" chooser for this file
            RNBlobUtil.android.actionViewIntent(res.path(), mimeType);
          });
      } else {
        // iOS: save to cache and open with share sheet
        const path = `${RNBlobUtil.fs.dirs.DocumentDir}/${safeFileName}`;
        const res = await RNBlobUtil.config({ path })
          .fetch('GET', doc.downloadUrl, {
            Authorization: `Bearer ${token}`,
          });
        assertDownloadSucceeded(res);
        await RNBlobUtil.ios.openDocument(res.path());
      }
    } catch (error: any) {
      // User cancelled the "Open With" dialog → not a real error
      if (error?.message?.includes('cancel') || error?.message?.includes('dismiss')) return;
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Could not download the document. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (documentId: string) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc({ documentId }).unwrap();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete document.');
          }
        }
      }
    ]);
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />;

  if (docs.length === 0) {
    return (
      <View style={{ paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>No documents uploaded yet.</Text>
      </View>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={{ marginTop: 8, gap: 10 }}>
      {docs.map((doc: any) => {
        const isPdf = doc.fileType?.includes('pdf') || doc.fileName.toLowerCase().endsWith('.pdf');
        const canDelete = doc.uploaderId === currentUserId;

        return (
          <View
            key={doc.documentId}
            style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
              padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0'
            }}
          >
            <View style={{
              width: 40, height: 40, borderRadius: 8,
              backgroundColor: isPdf ? '#fef2f2' : '#f0fdf4',
              alignItems: 'center', justifyContent: 'center', marginRight: 12
            }}>
              {isPdf ? <FileText size={20} color="#ef4444" /> : <FileImage size={20} color="#16a34a" />}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }} numberOfLines={1}>
                {doc.fileName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>
                  {doc.documentType?.toLowerCase()}
                </Text>
                <Text style={{ fontSize: 12, color: '#cbd5e1' }}>•</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{formatFileSize(doc.fileSize)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {downloadingId === doc.documentId ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <TouchableOpacity onPress={() => handleDownloadAndOpen(doc)} style={{ padding: 8 }}>
                  <Download size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={() => handleDelete(doc.documentId)}
                  disabled={isDeleting}
                  style={{ padding: 8 }}
                >
                  <Trash2 size={18} color="#ef4444" opacity={isDeleting ? 0.5 : 1} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
